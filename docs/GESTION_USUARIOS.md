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

Swagger/OpenAPI documenta estos endpoints con seguridad Bearer, exclusividad para `ADMINISTRADOR`, parametros de paginacion/filtros, perfiles condicionales de docente y estudiante, respuestas 200/201 y errores 400, 401, 403, 404, 409, 500 y 503. Los ejemplos usan datos ficticios y no incluyen contrasenas reales, tokens, cookies ni hashes.

## Seguridad y coherencia

La contrasena temporal se valida con la politica existente y se almacena exclusivamente como hash bcrypt. Las respuestas, registros de auditoria y consultas omiten contrasenas, hashes, sesiones y tokens. El rol no forma parte del contrato de edicion general.

La creacion y actualizacion validan que `ADMINISTRADOR` no tenga perfil academico, que `DOCENTE` tenga solo perfil docente y que `ESTUDIANTE` tenga solo perfil estudiantil. Las restricciones unicas de PostgreSQL para correo, documento y codigos se traducen a HTTP 409.

## Estado y sesiones

La desactivacion es logica y revoca todas las sesiones activas sin borrar historial. No se permite la autodesactivacion ni dejar el sistema sin un administrador activo. La reactivacion permite un nuevo inicio de sesion, pero nunca restaura sesiones anteriores.

El restablecimiento administrativo valida y genera un nuevo hash, marca `debe_cambiar_contrasena`, actualiza la fecha de credenciales, reinicia intentos y bloqueo, y revoca todas las sesiones.

## Transacciones y auditoria

Creacion, actualizacion, cambio de estado y restablecimiento se ejecutan en transacciones serializables. La auditoria registra actor, accion, registro afectado, contexto sanitizado y cambios no sensibles. Las acciones son `CREACION_USUARIO`, `ACTUALIZACION_USUARIO`, `ACTIVACION_USUARIO`, `DESACTIVACION_USUARIO` y `RESTABLECIMIENTO_CONTRASENA`.

## Interfaz administrativa

La ruta protegida `/administrador/usuarios` consume exclusivamente la API real y solo esta disponible para el rol `ADMINISTRADOR`. El listado utiliza TanStack Query e incluye busqueda, filtros por rol y estado, paginacion, orden estable y estados de carga, error y resultado vacio.

Desde la misma pantalla se puede consultar el detalle, crear administradores, docentes y estudiantes, editar los campos permitidos, activar o desactivar cuentas y restablecer contrasenas temporales. Los formularios usan React Hook Form y Zod; los campos de perfil cambian segun el rol al crear y el rol permanece visible pero inmutable durante la edicion.

Las mutaciones invalidan las consultas afectadas para refrescar listado y detalle. Las confirmaciones explican la revocacion de sesiones y las restricciones de autodesactivacion y ultimo administrador. Los errores HTTP 400, 401, 403, 404 y 409 se convierten en mensajes seguros sin exponer datos internos.

## Pruebas de interfaz

Las pruebas frontend usan mocks de la capa de hooks y servicios, sin solicitudes reales. Cubren listado, carga, error, estado vacio, busqueda, filtros, paginacion, creacion por cada rol, campos condicionales, conflictos unicos, detalle, edicion, rol inmutable, activacion, desactivacion, confirmaciones, restablecimiento y bloqueo para usuarios no administradores.

La integracion backend con PostgreSQL cubre creacion de administradores, docentes y estudiantes, duplicados, perfil incompatible, listado, busqueda, filtros, actualizacion, activacion/desactivacion, autodesactivacion, proteccion del ultimo administrador, restablecimiento y auditoria sanitizada.

## Limites de esta fase

No se implementan cambio de rol, eliminacion fisica, envio de correos ni modulos academicos. Las pruebas de integracion backend utilizan exclusivamente `gradia_test` y eliminan sus usuarios, sesiones y auditorias tecnicas al finalizar.
