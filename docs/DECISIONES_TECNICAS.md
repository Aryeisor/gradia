# Decisiones tecnicas

## Monorepositorio

Se usa npm workspaces para aislar frontend y backend, manteniendo scripts comunes en la raiz.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios, TanStack Query y Tailwind CSS.
- Backend: Node.js, Express, TypeScript, Prisma ORM, JWT, bcrypt, Zod, CORS, Helmet y Pino.
- Base de datos: PostgreSQL.

## Modelo academico

Gradia separa areas academicas y asignaturas. Las actividades evaluativas y calificaciones se registran sobre asignaturas configuradas en `detalle_plan_estudio`, no directamente sobre areas.

## Matriculas

`matriculas` no almacena `id_anio_academico`; el ano se consulta mediante `matricula -> grupo -> anio_academico`. La regla de matricula activa por estudiante y ano se implementara transaccionalmente en el servicio.

## Asignaciones academicas

`asignaciones_academicas` usa `id_detalle_plan_estudio` para identificar la asignatura dentro del plan de estudios. PostgreSQL aplica indices parciales para evitar duplicados activos y mas de un docente principal activo por asignatura y grupo.

## Restricciones parciales

Algunas reglas basadas en estado activo requieren indices unicos parciales de PostgreSQL o validaciones transaccionales en servicios. La migracion inicial incluye indices parciales para ano academico activo y asignaciones academicas activas.

## Frontera PostgreSQL y servicios

PostgreSQL conserva integridad referencial, unicidad, checks e indices parciales. Los servicios validan reglas que cruzan relaciones o dependen de estado y tiempo: compatibilidad rol/perfil, area del plan, grado y plan del grupo, vigencia de asignaciones y periodos, escala de notas y matricula activa por ano. La ultima regla debe ejecutarse dentro de la misma transaccion que cree la matricula.

## Contrato JSON

Los identificadores `BigInt` y los decimales de Prisma viajan como strings. Las fechas viajan en ISO 8601. La conversion es explicita en la capa de respuestas para conservar precision y evitar cambios globales al runtime.

## Disponibilidad

Un HTTP 503 valido de `/api/salud` significa que la API esta operativa y PostgreSQL desconectado. Error de red, timeout o ausencia de respuesta significa API no disponible. Axios conserva su comportamiento normal para otros codigos.

## Compilacion y ciclo de vida

La configuracion de produccion usa `tsconfig.build.json`; el build elimina artefactos anteriores y no incluye pruebas, seeders ni migraciones. El cierre controlado es idempotente y desconecta Prisma antes de terminar el proceso.

## Fase funcional

La arquitectura previa dio paso a la autenticacion backend hasta fase 3: inicio de sesion, JWT de acceso, refresh tokens opacos, sesiones, rotacion, revocacion y cambio de contrasena. La autorizacion global por roles y el CRUD administrativo de usuarios aun no estan implementados.

## Identificadores de rol

La autorizacion futura utilizara `roles.codigo`, no el nombre visible. Esto evita que cambios de presentacion rompan reglas de acceso.

## Sesiones renovables

`sesiones_autenticacion` prepara rotacion y revocacion de refresh tokens. Solo persiste un hash unico, nunca el token en texto plano. La sesion conserva expiracion, revocacion, reemplazo, ultimo uso, IP y agente de usuario. El historial no se elimina en cascada.

La sesion se considera activa cuando no esta revocada, no ha expirado y el usuario permanece activo. Los servicios de autenticacion aplican esta regla al renovar tokens y validar operaciones protegidas de la fase 3.

## Politica de credenciales

El entorno define expiracion del access token, dias del refresh token, nombre de cookie, limite y duracion de bloqueo, y costo bcrypt. Los servicios generan JWT, cookies HttpOnly y hashes bcrypt o SHA-256 según el tipo de credencial, sin persistir tokens refresh en texto plano.
