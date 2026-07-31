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
