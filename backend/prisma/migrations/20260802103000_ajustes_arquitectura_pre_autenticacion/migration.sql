-- Indices no destructivos para relaciones consultadas frecuentemente por los servicios.
CREATE INDEX "usuarios_id_rol_idx" ON "usuarios"("id_rol");
CREATE INDEX "grados_id_nivel_educativo_idx" ON "grados"("id_nivel_educativo");
CREATE INDEX "asignaturas_id_area_academica_idx" ON "asignaturas"("id_area_academica");
CREATE INDEX "areas_plan_estudio_id_grado_idx" ON "areas_plan_estudio"("id_grado");
CREATE INDEX "areas_plan_estudio_id_area_academica_idx" ON "areas_plan_estudio"("id_area_academica");
CREATE INDEX "detalle_plan_estudio_id_asignatura_idx" ON "detalle_plan_estudio"("id_asignatura");
CREATE INDEX "grupos_id_anio_academico_idx" ON "grupos"("id_anio_academico");
CREATE INDEX "grupos_id_plan_estudio_idx" ON "grupos"("id_plan_estudio");
CREATE INDEX "calificaciones_id_estudiante_idx" ON "calificaciones"("id_estudiante");
CREATE INDEX "historial_calificaciones_id_calificacion_idx" ON "historial_calificaciones"("id_calificacion");
CREATE INDEX "registros_auditoria_id_usuario_idx" ON "registros_auditoria"("id_usuario");
