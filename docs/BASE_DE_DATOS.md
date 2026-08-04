# Base de datos de Gradia

La base de datos se llama `gradia` y usa PostgreSQL. Las tablas y columnas fisicas estan en espanol, con `snake_case`, sin tildes, sin espacios, sin `ñ` y sin caracteres especiales.

## Tablas

La estructura actual contiene 22 tablas funcionales y 23 tablas si se cuenta `_prisma_migrations`.

1. `roles`: roles de acceso.
2. `usuarios`: cuentas del sistema.
3. `estudiantes`: perfil academico de estudiante.
4. `docentes`: perfil academico de docente.
5. `niveles_educativos`: niveles institucionales.
6. `grados`: grados relacionados con niveles.
7. `anios_academicos`: vigencias academicas.
8. `periodos_academicos`: periodos de cada ano.
9. `areas_academicas`: agrupaciones generales del conocimiento.
10. `asignaturas`: materias calificables asociadas a areas.
11. `planes_estudio`: versiones de plan curricular.
12. `areas_plan_estudio`: areas configuradas por plan y grado.
13. `detalle_plan_estudio`: asignaturas de cada area del plan.
14. `grupos`: grupos por grado, ano academico y plan.
15. `matriculas`: estudiantes en grupos; el ano se obtiene por `matricula -> grupo -> anio_academico`.
16. `asignaciones_academicas`: docentes asignados a un detalle de plan y grupo.
17. `actividades_evaluativas`: actividades por asignacion y periodo.
18. `calificaciones`: notas por estudiante y actividad.
19. `configuraciones_academicas`: escala de notas por ano.
20. `historial_calificaciones`: cambios de notas.
21. `registros_auditoria`: bitacora de operaciones sensibles.
22. `sesiones_autenticacion`: sesiones renovables; conserva hash, expiracion, revocacion y rotacion.

## Relaciones principales

```text
roles 1 -> N usuarios
usuarios 1 -> 1 estudiantes
usuarios 1 -> 1 docentes
niveles_educativos 1 -> N grados
anios_academicos 1 -> N periodos_academicos
areas_academicas 1 -> N asignaturas
planes_estudio 1 -> N areas_plan_estudio
grados 1 -> N areas_plan_estudio
areas_plan_estudio 1 -> N detalle_plan_estudio
asignaturas 1 -> N detalle_plan_estudio
grupos 1 -> N matriculas
docentes 1 -> N asignaciones_academicas
detalle_plan_estudio 1 -> N asignaciones_academicas
asignaciones_academicas 1 -> N actividades_evaluativas
actividades_evaluativas 1 -> N calificaciones
calificaciones 1 -> N historial_calificaciones
usuarios 1 -> N sesiones_autenticacion
sesiones_autenticacion 1 -> N sesiones_autenticacion reemplazadas
```

## Identidad y seguridad

- `roles.codigo` es el identificador estable de autorizacion: `ADMINISTRADOR`, `DOCENTE` o `ESTUDIANTE`. `nombre` se conserva para presentacion.
- `usuarios.debe_cambiar_contrasena` indica si debe renovarse la credencial antes del uso normal.
- `usuarios.contrasena_actualizada_en` registra el ultimo cambio de credencial.
- `usuarios.intentos_fallidos` nunca puede ser negativo.
- `usuarios.bloqueado_hasta` permite bloqueos temporales.
- `sesiones_autenticacion.token_hash` es unico. Nunca se almacena el refresh token en texto plano.
- Una sesion activa no tiene fecha de revocacion, no ha expirado y pertenece a un usuario activo.
- La relacion de reemplazo permite auditar la rotacion; las relaciones usan `Restrict` o `SetNull`, no borrado en cascada.

## Restricciones en PostgreSQL

- Correo unico por usuario.
- Numero de documento unico.
- Codigo de estudiante unico.
- Codigo de docente unico.
- Codigo de area unico.
- Codigo de asignatura unico.
- Un solo ano academico activo mediante indice unico parcial.
- Una sola calificacion por estudiante y actividad.
- Una configuracion academica por ano.
- Una combinacion unica de plan, grado y area.
- Una combinacion unica de area del plan y asignatura.
- Una asignacion academica activa identica mediante indice unico parcial.
- Un docente principal activo por asignatura configurada y grupo mediante indice unico parcial.
- Checks basicos para porcentajes, intensidad horaria, cupo maximo y escala de notas.

## Reglas aplicadas desde servicios

- Una matricula activa por estudiante y ano academico, consultando el ano por medio del grupo.
- Fechas de periodos dentro del ano academico.
- Suma de porcentajes de periodos antes de activar o finalizar la configuracion.
- Suma de `porcentaje_area` igual a 100 antes de activar un plan.
- Coherencia entre grado del grupo y grado configurado en el plan.
- Rango de nota segun `configuraciones_academicas`.
- Suma de porcentajes de actividades por asignacion y periodo.
- Coherencia entre rol de usuario y perfil de estudiante o docente.
- Coherencia de area entre asignatura y area del plan.
- Estado activo de docente, grupo, detalle, asignacion, estudiante y matricula cuando aplique.
- Pertenencia del periodo al ano del grupo y estado abierto del periodo.
- Unicidad de calificacion y retiro del estudiante respecto de la fecha de actividad.

## Indices de consulta

La migracion `ajustes_arquitectura_pre_autenticacion` agrega indices no destructivos para las relaciones de usuarios, grados, asignaturas, areas y detalles del plan, grupos, calificaciones, historial y auditoria. No se duplicaron los indices existentes de matriculas ni los indices compuestos cuyo primer campo ya cubre periodos, planes, detalles o grados.

La migracion `autenticacion_estructura_sesiones` agrega unicidad para `roles.codigo` y `sesiones_autenticacion.token_hash`, ademas de indices por usuario, expiracion y sesiones activas por usuario.

## Politica de eliminacion

No se usa eliminacion en cascada indiscriminada. Los registros academicos se conservan con `Restrict` o `SetNull` cuando corresponde. Usuarios, estudiantes, docentes, planes, matriculas, asignaciones, actividades, calificaciones e historiales deben preservarse.

## Estado de cierre fase 8

- `gradia`: 3 migraciones aplicadas, 22 tablas funcionales, 23 contando `_prisma_migrations`; datos de desarrollo conservados.
- `gradia_test`: misma estructura y 3 migraciones; despues de la suite queda con cero usuarios, cero sesiones y cero registros de auditoria tecnicos.
- No existen migraciones nuevas para la gestion visual de usuarios ni para el cierre de fase 8.
