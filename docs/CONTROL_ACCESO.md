# Control de acceso - fase 4

## Objetivo

La fase 4 centraliza autenticacion, vigencia de sesion, rol actual y cambio obligatorio de contrasena en middlewares reutilizables de Express. No incorpora gestion de usuarios ni rutas academicas.

## Middleware `autenticar`

`autenticar` exige una cabecera con el formato exacto `Bearer <token>`. El servicio JWT valida firma HS256, expiracion y un payload estricto de tipo `access` con `sub`, `sid`, `rol`, `iat` y `exp`. `sub` y `sid` deben representar identificadores positivos.

Despues de validar criptograficamente el token, el middleware consulta PostgreSQL en este orden:

1. Obtiene el usuario, su estado, el indicador de cambio de contrasena, la fecha de actualizacion y su rol actual.
2. Obtiene la sesion indicada por `sid`.
3. Comprueba que la sesion pertenezca al usuario de `sub`.
4. Rechaza sesiones inexistentes, revocadas o vencidas.
5. Rechaza usuarios inexistentes, inactivos o con un rol fuera del catalogo estable.
6. Rechaza access tokens anteriores a un cambio de contrasena.

La firma del JWT no basta para conceder acceso. PostgreSQL es la fuente actual de verdad para usuario, sesion, rol y estado de credenciales.

## Precision del cambio de contrasena

El claim `iat` tiene precision de segundos y PostgreSQL conserva milisegundos. Para evitar invalidar un token emitido legitimamente en el mismo segundo, ese segundo se considera indivisible: la credencial se considera posterior cuando `contrasena_actualizada_en` es igual o posterior al primer milisegundo del segundo siguiente a `iat`. La tolerancia maxima es menor de un segundo.

## Rol vigente

El claim `rol` describe el contexto al emitir el token, pero no autoriza. `req.usuarioAutenticado.rol` siempre se construye con `roles.codigo` consultado en PostgreSQL. Si un administrador pasa a docente, el mismo token deja de autorizar rutas exclusivas de administrador y puede continuar solo donde el rol docente vigente este permitido.

## Tipos de Express

`src/tipos/express.d.ts` amplía `Express.Request` con `usuarioAutenticado`. La interfaz se define una sola vez en `tipos/control-acceso.tipos.ts` y contiene exclusivamente:

```typescript
{
  id: bigint;
  rol: 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE';
  idSesion: bigint;
  debeCambiarContrasena: boolean;
}
```

No contiene contrasenas, hashes, tokens ni cookies.

## Autorizacion y cambio obligatorio

`autorizarRoles(...roles)` se ejecuta despues de `autenticar`. Sin identidad devuelve 401; con un rol vigente no permitido devuelve 403 `ROL_NO_AUTORIZADO`.

`exigirContrasenaActualizada` devuelve 403 `CAMBIO_CONTRASENA_REQUERIDO` cuando el indicador sigue activo. No se aplica a los cuatro endpoints que deben permanecer disponibles:

- `GET /api/autenticacion/yo`
- `PATCH /api/autenticacion/cambiar-contrasena`
- `POST /api/autenticacion/cerrar-sesion`
- `POST /api/autenticacion/cerrar-todas`

Las rutas protegidas generales siguen este orden:

```text
autenticar
  -> exigirContrasenaActualizada
  -> autorizarRoles(...)
  -> controlador
```

Login y renovacion siguen siendo publicos respecto del access token. La renovacion mantiene su validacion mediante cookie HttpOnly y sesion de refresh.

## Codigos de error

Los rechazos 401 utilizan `AUTENTICACION_REQUERIDA`, `TOKEN_INVALIDO`, `TOKEN_VENCIDO`, `SESION_INVALIDA`, `USUARIO_INACTIVO` o `CREDENCIALES_DESACTUALIZADAS`. Los rechazos 403 utilizan `ROL_NO_AUTORIZADO` o `CAMBIO_CONTRASENA_REQUERIDO`. Las respuestas no incluyen claims, tokens, identificadores de sesion ni detalles de PostgreSQL.

401 indica que no existe una identidad vigente. 403 indica que la identidad ya fue verificada, pero su rol o estado de cambio obligatorio no permite la operacion.

## Pruebas

Las pruebas unitarias cubren formato Bearer, errores JWT, identificadores, usuario, sesion, cambio de credenciales, identidad segura, roles y cambio obligatorio. Las rutas de roles usadas por las pruebas viven solo en una aplicacion Express construida dentro del archivo de integracion; no se registran en `app.ts`, Swagger ni el router de produccion.

La integracion usa exclusivamente `DATABASE_URL_TEST`, exige el nombre `gradia_test`, crea usuarios ficticios de los tres roles y limpia usuarios, sesiones y auditorias por prefijo tecnico. Tambien comprueba cambios de rol en PostgreSQL, aislamiento entre cuentas y los cuatro endpoints permitidos.

## Limitaciones y siguiente fase

La aplicacion todavia no expone CRUD de usuarios ni rutas academicas protegidas por rol. La proxima fase es la gestion administrativa de usuarios, reutilizando estos middlewares sin cambiar sus contratos de seguridad.
