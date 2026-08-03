# Gestion administrativa de usuarios

## Objetivo

El modulo `/api/usuarios` permite que un administrador autenticado gestione cuentas sin eliminar historial, cambiar roles ni exponer credenciales. Todas sus rutas aplican, en este orden, `autenticar`, `exigirContrasenaActualizada` y `autorizarRoles("ADMINISTRADOR")`.

## Endpoints

- `GET /api/usuarios`: listado paginado, busqueda por identidad o codigo y filtros de rol y estado.
- `GET /api/usuarios/:id`: detalle seguro con rol y perfil docente o estudiantil.
- `POST /api/usuarios`: creacion transaccional de la cuenta y, cuando corresponde, su unico perfil.
- `PATCH /api/usuarios/:id`: edicion de datos generales y campos compatibles del perfil actual.
- `PATCH /api/usuarios/:id/estado`: activacion o desactivacion logica.
- `POST /api/usuarios/:id/restablecer-contrasena`: asignacion de una contrasena temporal.

## Seguridad y coherencia

La contrasena temporal se valida con la politica existente y se almacena exclusivamente como hash bcrypt. Las respuestas, registros de auditoria y consultas omiten contrasenas, hashes, sesiones y tokens. El rol no forma parte del contrato de edicion general.

La creacion y actualizacion validan que `ADMINISTRADOR` no tenga perfil academico, que `DOCENTE` tenga solo perfil docente y que `ESTUDIANTE` tenga solo perfil estudiantil. Las restricciones unicas de PostgreSQL para correo, documento y codigos se traducen a HTTP 409.

## Estado y sesiones

La desactivacion es logica y revoca todas las sesiones activas sin borrar historial. No se permite la autodesactivacion ni dejar el sistema sin un administrador activo. La reactivacion permite un nuevo inicio de sesion, pero nunca restaura sesiones anteriores.

El restablecimiento administrativo valida y genera un nuevo hash, marca `debe_cambiar_contrasena`, actualiza la fecha de credenciales, reinicia intentos y bloqueo, y revoca todas las sesiones.

## Transacciones y auditoria

Creacion, actualizacion, cambio de estado y restablecimiento se ejecutan en transacciones serializables. La auditoria registra actor, accion, registro afectado, contexto sanitizado y cambios no sensibles. Las acciones son `CREACION_USUARIO`, `ACTUALIZACION_USUARIO`, `ACTIVACION_USUARIO`, `DESACTIVACION_USUARIO` y `RESTABLECIMIENTO_CONTRASENA`.

## Limites de esta fase

No se implementan cambio de rol, eliminacion fisica, envio de correos, frontend ni modulos academicos. Las pruebas de integracion utilizan exclusivamente `gradia_test` y eliminan sus usuarios, sesiones y auditorias tecnicas al finalizar.
