CREATE TYPE "EstadoEstudiante" AS ENUM ('ACTIVO', 'RETIRADO', 'GRADUADO');
CREATE TYPE "EstadoDocente" AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE "EstadoAnioAcademico" AS ENUM ('PLANEADO', 'ACTIVO', 'FINALIZADO');
CREATE TYPE "EstadoPeriodoAcademico" AS ENUM ('PENDIENTE', 'ABIERTO', 'CERRADO');
CREATE TYPE "EstadoPlanEstudio" AS ENUM ('BORRADOR', 'ACTIVO', 'FINALIZADO');
CREATE TYPE "ModalidadEvaluacion" AS ENUM ('INTEGRADA', 'DESGLOSADA');
CREATE TYPE "JornadaGrupo" AS ENUM ('MANANA', 'TARDE', 'UNICA');
CREATE TYPE "EstadoMatricula" AS ENUM ('ACTIVA', 'RETIRADA', 'CANCELADA', 'FINALIZADA');
CREATE TYPE "TipoAsignacion" AS ENUM ('PRINCIPAL', 'APOYO');
CREATE TYPE "EstadoAsignacion" AS ENUM ('ACTIVA', 'FINALIZADA', 'REEMPLAZADA');
CREATE TYPE "EstadoActividad" AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');
CREATE TYPE "EstadoCalificacion" AS ENUM ('BORRADOR', 'PUBLICADA');

CREATE TABLE "roles" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(50) NOT NULL UNIQUE,
  "descripcion" TEXT,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "usuarios" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_rol" BIGINT NOT NULL,
  "nombres" VARCHAR(100) NOT NULL,
  "apellidos" VARCHAR(100) NOT NULL,
  "tipo_documento" VARCHAR(30) NOT NULL,
  "numero_documento" VARCHAR(30) NOT NULL UNIQUE,
  "correo" VARCHAR(150) NOT NULL UNIQUE,
  "contrasena_hash" VARCHAR(255) NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "ultimo_acceso" TIMESTAMP(3),
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "estudiantes" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_usuario" BIGINT NOT NULL UNIQUE,
  "codigo_estudiante" VARCHAR(30) NOT NULL UNIQUE,
  "fecha_nacimiento" DATE NOT NULL,
  "telefono" VARCHAR(30),
  "direccion" VARCHAR(200),
  "estado" "EstadoEstudiante" NOT NULL DEFAULT 'ACTIVO',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "estudiantes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "docentes" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_usuario" BIGINT NOT NULL UNIQUE,
  "codigo_docente" VARCHAR(30) NOT NULL UNIQUE,
  "especialidad" VARCHAR(150),
  "telefono" VARCHAR(30),
  "estado" "EstadoDocente" NOT NULL DEFAULT 'ACTIVO',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "docentes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "niveles_educativos" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(80) NOT NULL UNIQUE,
  "descripcion" TEXT,
  "orden" INTEGER NOT NULL UNIQUE,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "grados" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_nivel_educativo" BIGINT NOT NULL,
  "nombre" VARCHAR(50) NOT NULL,
  "numero_grado" INTEGER NOT NULL UNIQUE,
  "orden" INTEGER NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "grados_id_nivel_educativo_fkey" FOREIGN KEY ("id_nivel_educativo") REFERENCES "niveles_educativos"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "anios_academicos" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(20) NOT NULL UNIQUE,
  "fecha_inicio" DATE NOT NULL,
  "fecha_fin" DATE NOT NULL,
  "estado" "EstadoAnioAcademico" NOT NULL DEFAULT 'PLANEADO',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "anios_academicos_unico_activo" ON "anios_academicos" ("estado") WHERE "estado" = 'ACTIVO';

CREATE TABLE "periodos_academicos" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_anio_academico" BIGINT NOT NULL,
  "nombre" VARCHAR(50) NOT NULL,
  "numero_periodo" INTEGER NOT NULL,
  "fecha_inicio" DATE NOT NULL,
  "fecha_fin" DATE NOT NULL,
  "porcentaje" NUMERIC(5,2) NOT NULL,
  "estado" "EstadoPeriodoAcademico" NOT NULL DEFAULT 'PENDIENTE',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "periodos_academicos_id_anio_academico_fkey" FOREIGN KEY ("id_anio_academico") REFERENCES "anios_academicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "periodos_academicos_porcentaje_check" CHECK ("porcentaje" > 0 AND "porcentaje" <= 100),
  CONSTRAINT "periodos_academicos_anio_numero_key" UNIQUE ("id_anio_academico", "numero_periodo")
);

CREATE TABLE "areas_academicas" (
  "id" BIGSERIAL PRIMARY KEY,
  "codigo" VARCHAR(20) NOT NULL UNIQUE,
  "nombre" VARCHAR(100) NOT NULL UNIQUE,
  "descripcion" TEXT,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "asignaturas" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_area_academica" BIGINT NOT NULL,
  "codigo" VARCHAR(20) NOT NULL UNIQUE,
  "nombre" VARCHAR(100) NOT NULL,
  "descripcion" TEXT,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asignaturas_id_area_academica_fkey" FOREIGN KEY ("id_area_academica") REFERENCES "areas_academicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "planes_estudio" (
  "id" BIGSERIAL PRIMARY KEY,
  "nombre" VARCHAR(150) NOT NULL,
  "version" VARCHAR(30) NOT NULL,
  "descripcion" TEXT,
  "fecha_inicio_vigencia" DATE NOT NULL,
  "fecha_fin_vigencia" DATE,
  "estado" "EstadoPlanEstudio" NOT NULL DEFAULT 'BORRADOR',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "planes_estudio_nombre_version_key" UNIQUE ("nombre", "version")
);

CREATE TABLE "areas_plan_estudio" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_plan_estudio" BIGINT NOT NULL,
  "id_grado" BIGINT NOT NULL,
  "id_area_academica" BIGINT NOT NULL,
  "modalidad_evaluacion" "ModalidadEvaluacion" NOT NULL,
  "calcular_nota_area" BOOLEAN NOT NULL DEFAULT true,
  "mostrar_area_boletin" BOOLEAN NOT NULL DEFAULT true,
  "orden_visualizacion" INTEGER NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "areas_plan_estudio_id_plan_estudio_fkey" FOREIGN KEY ("id_plan_estudio") REFERENCES "planes_estudio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "areas_plan_estudio_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "grados"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "areas_plan_estudio_id_area_academica_fkey" FOREIGN KEY ("id_area_academica") REFERENCES "areas_academicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "areas_plan_estudio_plan_grado_area_key" UNIQUE ("id_plan_estudio", "id_grado", "id_area_academica")
);

CREATE TABLE "detalle_plan_estudio" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_area_plan_estudio" BIGINT NOT NULL,
  "id_asignatura" BIGINT NOT NULL,
  "intensidad_horaria_semanal" INTEGER NOT NULL,
  "porcentaje_area" NUMERIC(5,2),
  "obligatoria" BOOLEAN NOT NULL DEFAULT true,
  "calificable" BOOLEAN NOT NULL DEFAULT true,
  "mostrar_en_boletin" BOOLEAN NOT NULL DEFAULT true,
  "orden_visualizacion" INTEGER NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "detalle_plan_estudio_id_area_plan_estudio_fkey" FOREIGN KEY ("id_area_plan_estudio") REFERENCES "areas_plan_estudio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "detalle_plan_estudio_id_asignatura_fkey" FOREIGN KEY ("id_asignatura") REFERENCES "asignaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "detalle_plan_estudio_area_asignatura_key" UNIQUE ("id_area_plan_estudio", "id_asignatura"),
  CONSTRAINT "detalle_plan_estudio_intensidad_check" CHECK ("intensidad_horaria_semanal" > 0),
  CONSTRAINT "detalle_plan_estudio_porcentaje_check" CHECK ("porcentaje_area" IS NULL OR ("porcentaje_area" >= 0 AND "porcentaje_area" <= 100))
);

CREATE TABLE "grupos" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_grado" BIGINT NOT NULL,
  "id_anio_academico" BIGINT NOT NULL,
  "id_plan_estudio" BIGINT NOT NULL,
  "id_docente_director" BIGINT,
  "nombre" VARCHAR(20) NOT NULL,
  "jornada" "JornadaGrupo" NOT NULL,
  "cupo_maximo" INTEGER NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "grupos_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "grados"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "grupos_id_anio_academico_fkey" FOREIGN KEY ("id_anio_academico") REFERENCES "anios_academicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "grupos_id_plan_estudio_fkey" FOREIGN KEY ("id_plan_estudio") REFERENCES "planes_estudio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "grupos_id_docente_director_fkey" FOREIGN KEY ("id_docente_director") REFERENCES "docentes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "grupos_grado_anio_nombre_key" UNIQUE ("id_grado", "id_anio_academico", "nombre"),
  CONSTRAINT "grupos_cupo_maximo_check" CHECK ("cupo_maximo" > 0)
);

CREATE TABLE "matriculas" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_estudiante" BIGINT NOT NULL,
  "id_grupo" BIGINT NOT NULL,
  "fecha_matricula" DATE NOT NULL,
  "fecha_retiro" DATE,
  "motivo_retiro" TEXT,
  "estado" "EstadoMatricula" NOT NULL DEFAULT 'ACTIVA',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "matriculas_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "matriculas_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "matriculas_id_estudiante_idx" ON "matriculas" ("id_estudiante");
CREATE INDEX "matriculas_id_grupo_idx" ON "matriculas" ("id_grupo");

CREATE TABLE "asignaciones_academicas" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_docente" BIGINT NOT NULL,
  "id_detalle_plan_estudio" BIGINT NOT NULL,
  "id_grupo" BIGINT NOT NULL,
  "tipo_asignacion" "TipoAsignacion" NOT NULL,
  "fecha_inicio" DATE NOT NULL,
  "fecha_fin" DATE,
  "estado" "EstadoAsignacion" NOT NULL DEFAULT 'ACTIVA',
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asignaciones_academicas_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "docentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asignaciones_academicas_id_detalle_plan_estudio_fkey" FOREIGN KEY ("id_detalle_plan_estudio") REFERENCES "detalle_plan_estudio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asignaciones_academicas_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "asignaciones_academicas_id_docente_idx" ON "asignaciones_academicas" ("id_docente");
CREATE INDEX "asignaciones_academicas_id_detalle_plan_estudio_idx" ON "asignaciones_academicas" ("id_detalle_plan_estudio");
CREATE INDEX "asignaciones_academicas_id_grupo_idx" ON "asignaciones_academicas" ("id_grupo");
CREATE UNIQUE INDEX "asignaciones_academicas_unica_activa" ON "asignaciones_academicas" ("id_docente", "id_detalle_plan_estudio", "id_grupo", "tipo_asignacion") WHERE "estado" = 'ACTIVA';
CREATE UNIQUE INDEX "asignaciones_academicas_docente_principal_activo" ON "asignaciones_academicas" ("id_detalle_plan_estudio", "id_grupo") WHERE "estado" = 'ACTIVA' AND "tipo_asignacion" = 'PRINCIPAL';

CREATE TABLE "actividades_evaluativas" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_asignacion_academica" BIGINT NOT NULL,
  "id_periodo_academico" BIGINT NOT NULL,
  "nombre" VARCHAR(150) NOT NULL,
  "descripcion" TEXT,
  "fecha_actividad" DATE NOT NULL,
  "porcentaje" NUMERIC(5,2) NOT NULL,
  "estado" "EstadoActividad" NOT NULL DEFAULT 'BORRADOR',
  "creado_por" BIGINT NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "actividades_evaluativas_id_asignacion_academica_fkey" FOREIGN KEY ("id_asignacion_academica") REFERENCES "asignaciones_academicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "actividades_evaluativas_id_periodo_academico_fkey" FOREIGN KEY ("id_periodo_academico") REFERENCES "periodos_academicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "actividades_evaluativas_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "actividades_evaluativas_porcentaje_check" CHECK ("porcentaje" > 0 AND "porcentaje" <= 100)
);

CREATE INDEX "actividades_evaluativas_asignacion_periodo_idx" ON "actividades_evaluativas" ("id_asignacion_academica", "id_periodo_academico");

CREATE TABLE "calificaciones" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_actividad_evaluativa" BIGINT NOT NULL,
  "id_estudiante" BIGINT NOT NULL,
  "nota" NUMERIC(5,2) NOT NULL,
  "observacion" TEXT,
  "estado" "EstadoCalificacion" NOT NULL DEFAULT 'BORRADOR',
  "registrada_por" BIGINT NOT NULL,
  "modificada_por" BIGINT,
  "fecha_publicacion" TIMESTAMP(3),
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "calificaciones_id_actividad_evaluativa_fkey" FOREIGN KEY ("id_actividad_evaluativa") REFERENCES "actividades_evaluativas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "calificaciones_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "calificaciones_registrada_por_fkey" FOREIGN KEY ("registrada_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "calificaciones_modificada_por_fkey" FOREIGN KEY ("modificada_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "calificaciones_actividad_estudiante_key" UNIQUE ("id_actividad_evaluativa", "id_estudiante")
);

CREATE TABLE "configuraciones_academicas" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_anio_academico" BIGINT NOT NULL UNIQUE,
  "nota_minima" NUMERIC(5,2) NOT NULL,
  "nota_maxima" NUMERIC(5,2) NOT NULL,
  "nota_aprobacion" NUMERIC(5,2) NOT NULL,
  "cantidad_decimales" INTEGER NOT NULL,
  "estado" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "configuraciones_academicas_id_anio_academico_fkey" FOREIGN KEY ("id_anio_academico") REFERENCES "anios_academicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "configuraciones_academicas_notas_check" CHECK ("nota_minima" < "nota_maxima" AND "nota_aprobacion" >= "nota_minima" AND "nota_aprobacion" <= "nota_maxima"),
  CONSTRAINT "configuraciones_academicas_decimales_check" CHECK ("cantidad_decimales" >= 0 AND "cantidad_decimales" <= 4)
);

CREATE TABLE "historial_calificaciones" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_calificacion" BIGINT NOT NULL,
  "nota_anterior" NUMERIC(5,2) NOT NULL,
  "nota_nueva" NUMERIC(5,2) NOT NULL,
  "motivo" TEXT NOT NULL,
  "id_usuario" BIGINT NOT NULL,
  "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "historial_calificaciones_id_calificacion_fkey" FOREIGN KEY ("id_calificacion") REFERENCES "calificaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "historial_calificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "registros_auditoria" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_usuario" BIGINT,
  "accion" VARCHAR(100) NOT NULL,
  "modulo" VARCHAR(100) NOT NULL,
  "tabla_afectada" VARCHAR(100) NOT NULL,
  "id_registro" BIGINT,
  "datos_anteriores" JSONB,
  "datos_nuevos" JSONB,
  "direccion_ip" VARCHAR(50),
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "registros_auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "registros_auditoria_tabla_registro_idx" ON "registros_auditoria" ("tabla_afectada", "id_registro");
