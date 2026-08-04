# Autenticacion y seguridad

Este documento describe la API backend de autenticacion, sus middlewares de control de acceso y el cliente React que restaura y mantiene la sesion. La administracion backend de usuarios se documenta por separado; no existe recuperacion por correo ni registro publico.

## Endpoints

| Metodo | Ruta | Autenticacion | Resultado |
| --- | --- | --- | --- |
| POST | `/api/autenticacion/iniciar-sesion` | Credenciales JSON | Access token y cookie refresh |
| POST | `/api/autenticacion/renovar` | Cookie refresh | Rotacion y access token nuevo |
| GET | `/api/autenticacion/yo` | Bearer access token | Usuario, rol y perfil academico |
| POST | `/api/autenticacion/cerrar-sesion` | Bearer access token | Revoca la sesion actual |
| POST | `/api/autenticacion/cerrar-todas` | Bearer access token | Revoca todas las sesiones |
| PATCH | `/api/autenticacion/cambiar-contrasena` | Bearer access token | Cambia la clave y exige nuevo login |

Las respuestas exitosas usan `{ exito, mensaje, datos? }`. Los errores usan `{ exito: false, mensaje, errores, codigo? }` con 400, 401, 403, 409, 429, 500 o 503 segun corresponda. El login usa mensajes genericos para no revelar si un correo existe.

Swagger/OpenAPI se publica en `/api/docs` e incluye Bearer JWT, cookie de renovacion, ejemplos ficticios, rutas publicas, rutas protegidas, errores y codigos internos. Los codigos internos relevantes son `AUTENTICACION_REQUERIDA`, `TOKEN_INVALIDO`, `TOKEN_VENCIDO`, `SESION_INVALIDA`, `USUARIO_INACTIVO`, `CREDENCIALES_DESACTUALIZADAS`, `ROL_NO_AUTORIZADO` y `CAMBIO_CONTRASENA_REQUERIDO`.

## Contrasenas

La entrada se valida sin recortarla ni modificarla: exige entre 12 caracteres y 72 bytes UTF-8, rechaza espacios al inicio o final y marcadores evidentemente inseguros. Los hashes se generan con bcrypt y el costo `BCRYPT_COSTO`; ni contrasenas ni hashes se escriben en logs o respuestas.

## Access token

El access token es JWT firmado con HS256 y `JWT_SECRET`. Su duracion proviene de `JWT_ACCESS_EXPIRACION`. El payload se valida de forma estricta y solo contiene `sub` (usuario), `rol` (`ADMINISTRADOR`, `DOCENTE` o `ESTUDIANTE`), `sid` (sesion), `tipo: access`, `iat` y `exp`. No incorpora correo, datos personales ni secretos.

En cada ruta protegida, `autenticar` verifica nuevamente usuario y sesion en PostgreSQL. El rol que autoriza es el valor vigente de `roles.codigo`, no el claim historico del JWT. Una sesion revocada o vencida, un usuario inactivo o una contrasena modificada en un segundo posterior a `iat` invalidan el acceso con HTTP 401.

## Refresh token y sesiones

El refresh token es opaco, no un JWT. Se genera con 48 bytes criptograficamente aleatorios y solo su SHA-256 se almacena en `sesiones_autenticacion`. El token en texto plano existe unicamente para entregarlo al cliente. La rotacion crea una nueva sesion y revoca/enlaza la anterior dentro de una transaccion.

La reutilizacion de una sesion revocada o reemplazada se considera un incidente: se revocan las sesiones activas del usuario, se registra auditoria sanitizada y se devuelve un error operacional. Una sesion solo es activa si no esta revocada, no vencio y el usuario sigue activo. La limpieza futura esta acotada a sesiones vencidas y revocadas, en lotes y sin dependencias históricas.

## Cookie

La cookie usa el nombre `REFRESH_TOKEN_COOKIE`, `HttpOnly`, `SameSite=Lax`, ruta `/api/autenticacion`, duracion derivada de `REFRESH_TOKEN_DIAS` y `Secure` en produccion. Por tanto, JavaScript del navegador no puede leerla. CORS acepta credenciales exclusivamente desde `ORIGEN_FRONTEND`.

## Cliente React y restauracion

`ProveedorAutenticacion` mantiene los estados `inicializando`, `autenticado` y `no_autenticado`, junto con el usuario, su rol y el indicador `debeCambiarContrasena`. El access token se conserva exclusivamente en memoria; no se escribe en `localStorage`, `sessionStorage` ni cookies accesibles desde JavaScript.

Al cargar la aplicacion, el proveedor ejecuta `POST /api/autenticacion/renovar` con `withCredentials`, conserva el nuevo access token y consulta `GET /api/autenticacion/yo`. Durante este proceso se presenta una pantalla de inicializacion para evitar mostrar brevemente rutas publicas o protegidas incorrectas. Si cualquiera de los pasos falla, se limpia el estado local.

El cliente Axios agrega `Authorization: Bearer` desde memoria. Ante un 401 de una solicitud protegida, comparte una sola renovacion entre todas las solicitudes simultaneas, reintenta cada solicitud una vez y limpia la sesion si el refresh falla. Login y renovacion se excluyen de este mecanismo; tampoco se renueva ante 403, 409 o 429.

Las rutas React separan acceso publico, autenticado, rol y cambio obligatorio. Los usuarios autenticados son enviados a `/administrador`, `/docente` o `/estudiante`; un rol incorrecto termina en `/sin-autorizacion`, y una cuenta temporal queda limitada a `/cambiar-contrasena` hasta completar el cambio.

## Fuerza bruta y limitacion de tasa

Los intentos fallidos se cuentan en el usuario. Al alcanzar `MAX_INTENTOS_LOGIN`, la cuenta se bloquea durante `MINUTOS_BLOQUEO_LOGIN`; un bloqueo vencido se limpia automaticamente y un acceso correcto reinicia el estado. `express-rate-limit` protege además `POST /api/autenticacion/iniciar-sesion` por origen de red.

## Cambio de contrasena

Requiere un access token y la clave actual. La confirmacion debe coincidir, la nueva clave debe cumplir la politica y no puede reutilizar la vigente. Al completar el cambio se actualiza `contrasena_actualizada_en`, se desactiva `debe_cambiar_contrasena`, se revocan todas las sesiones, se borra la cookie y el usuario debe iniciar sesion nuevamente.

## Pruebas de integracion

Las pruebas HTTP ordinarias simulan los servicios y no modifican PostgreSQL. Las pruebas de ciclo completo usan exclusivamente `DATABASE_URL_TEST`, validan que la base sea exactamente `gradia_test` y fallan si la variable falta o apunta a otro nombre. No existe respaldo silencioso hacia `DATABASE_URL`.

`npm run test:unit` ejecuta pruebas aisladas de backend y frontend. Las pruebas React simulan servicios y cubren formularios, restauracion, rutas, roles, cambio obligatorio, logout, almacenamiento efimero y renovacion concurrente sin solicitudes reales. `npm run test:integration` carga `backend/.env.test`, prepara cuentas ficticias, ejecuta los endpoints con PostgreSQL real y limpia solo esos datos. `npm run test` ejecuta ambos grupos.

El cierre de fase 8 valida 129 pruebas backend unitarias/API, 49 pruebas frontend y 33 pruebas de integracion PostgreSQL: 211 aprobadas, 0 fallidas y 0 omitidas.

La estrategia de roles, cambio obligatorio, codigos 401/403 y orden de middlewares se documenta en `docs/CONTROL_ACCESO.md`.

## Auditoria

El servicio registra accion, modulo, usuario, IP, agente de usuario, tabla/registro y cambios anterior/nuevo en `registros_auditoria`. Antes de persistir elimina recursivamente contrasenas, hashes de contrasena, tokens, hashes de token, cookies, cabeceras de autorizacion, secretos JWT y URL de bases. Los valores `BigInt`, `Decimal` y `Date` se convierten a representaciones JSON seguras.

## Variables requeridas

Las variables de seguridad se documentan en `backend/.env.example`: `JWT_SECRET`, `JWT_ACCESS_EXPIRACION`, `REFRESH_TOKEN_DIAS`, `REFRESH_TOKEN_COOKIE`, `MAX_INTENTOS_LOGIN`, `MINUTOS_BLOQUEO_LOGIN` y `BCRYPT_COSTO`. Los archivos versionados solo contienen marcadores; los secretos reales deben permanecer en archivos locales no rastreados.
