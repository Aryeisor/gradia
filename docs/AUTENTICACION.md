# Autenticacion y seguridad

Este documento describe la API backend de autenticacion. No incluye middleware global por roles, administracion de usuarios, recuperacion por correo ni pantallas frontend.

## Endpoints

| Metodo | Ruta | Autenticacion | Resultado |
| --- | --- | --- | --- |
| POST | `/api/autenticacion/iniciar-sesion` | Credenciales JSON | Access token y cookie refresh |
| POST | `/api/autenticacion/renovar` | Cookie refresh | Rotacion y access token nuevo |
| GET | `/api/autenticacion/yo` | Bearer access token | Usuario, rol y perfil academico |
| POST | `/api/autenticacion/cerrar-sesion` | Bearer access token | Revoca la sesion actual |
| POST | `/api/autenticacion/cerrar-todas` | Bearer access token | Revoca todas las sesiones |
| PATCH | `/api/autenticacion/cambiar-contrasena` | Bearer access token | Cambia la clave y exige nuevo login |

Las respuestas exitosas usan `{ exito, mensaje, datos? }`. Los errores usan `{ exito: false, mensaje, errores, codigo? }` con 400, 401, 409, 429, 500 o 503 segun corresponda. El login usa mensajes genericos para no revelar si un correo existe.

## Contrasenas

La entrada se valida sin recortarla ni modificarla: exige entre 12 caracteres y 72 bytes UTF-8, rechaza espacios al inicio o final y marcadores evidentemente inseguros. Los hashes se generan con bcrypt y el costo `BCRYPT_COSTO`; ni contrasenas ni hashes se escriben en logs o respuestas.

## Access token

El access token es JWT firmado con HS256 y `JWT_SECRET`. Su duracion proviene de `JWT_ACCESS_EXPIRACION`. El payload se valida de forma estricta y solo contiene `sub` (usuario), `rol` (`ADMINISTRADOR`, `DOCENTE` o `ESTUDIANTE`), `sid` (sesion), `tipo: access`, `iat` y `exp`. No incorpora correo, datos personales ni secretos.

## Refresh token y sesiones

El refresh token es opaco, no un JWT. Se genera con 48 bytes criptograficamente aleatorios y solo su SHA-256 se almacena en `sesiones_autenticacion`. El token en texto plano existe unicamente para entregarlo al cliente. La rotacion crea una nueva sesion y revoca/enlaza la anterior dentro de una transaccion.

La reutilizacion de una sesion revocada o reemplazada se considera un incidente: se revocan las sesiones activas del usuario, se registra auditoria sanitizada y se devuelve un error operacional. Una sesion solo es activa si no esta revocada, no vencio y el usuario sigue activo. La limpieza futura esta acotada a sesiones vencidas y revocadas, en lotes y sin dependencias históricas.

## Cookie

La cookie usa el nombre `REFRESH_TOKEN_COOKIE`, `HttpOnly`, `SameSite=Lax`, ruta `/api/autenticacion`, duracion derivada de `REFRESH_TOKEN_DIAS` y `Secure` en produccion. Por tanto, JavaScript del navegador no puede leerla. CORS acepta credenciales exclusivamente desde `ORIGEN_FRONTEND`.

## Fuerza bruta y limitacion de tasa

Los intentos fallidos se cuentan en el usuario. Al alcanzar `MAX_INTENTOS_LOGIN`, la cuenta se bloquea durante `MINUTOS_BLOQUEO_LOGIN`; un bloqueo vencido se limpia automaticamente y un acceso correcto reinicia el estado. `express-rate-limit` protege además `POST /api/autenticacion/iniciar-sesion` por origen de red.

## Cambio de contrasena

Requiere un access token y la clave actual. La confirmacion debe coincidir, la nueva clave debe cumplir la politica y no puede reutilizar la vigente. Al completar el cambio se actualiza `contrasena_actualizada_en`, se desactiva `debe_cambiar_contrasena`, se revocan todas las sesiones, se borra la cookie y el usuario debe iniciar sesion nuevamente.

## Pruebas de integracion

Las pruebas HTTP ordinarias simulan los servicios y no modifican PostgreSQL. Las pruebas de ciclo completo usan exclusivamente `DATABASE_URL_TEST`, validan que la base sea exactamente `gradia_test` y fallan si la variable falta o apunta a otro nombre. No existe respaldo silencioso hacia `DATABASE_URL`.

`npm run test:unit` ejecuta pruebas aisladas. `npm run test:integration` carga `backend/.env.test`, prepara cuentas ficticias, ejecuta los seis endpoints con PostgreSQL real y limpia solo esos datos. `npm run test` ejecuta ambos grupos. El detalle y la auditoria de la fase estan en `docs/ESTABILIZACION_AUTENTICACION.md`.

## Auditoria

El servicio registra accion, modulo, usuario, IP, agente de usuario, tabla/registro y cambios anterior/nuevo en `registros_auditoria`. Antes de persistir elimina recursivamente contrasenas, hashes de contrasena, tokens, hashes de token, cookies, cabeceras de autorizacion, secretos JWT y URL de bases. Los valores `BigInt`, `Decimal` y `Date` se convierten a representaciones JSON seguras.

## Variables requeridas

Las variables de seguridad se documentan en `backend/.env.example`: `JWT_SECRET`, `JWT_ACCESS_EXPIRACION`, `REFRESH_TOKEN_DIAS`, `REFRESH_TOKEN_COOKIE`, `MAX_INTENTOS_LOGIN`, `MINUTOS_BLOQUEO_LOGIN` y `BCRYPT_COSTO`. Los archivos versionados solo contienen marcadores; los secretos reales deben permanecer en archivos locales no rastreados.
