-- Codigo estable de autorizacion para roles existentes.
ALTER TABLE "roles" ADD COLUMN "codigo" VARCHAR(30);

UPDATE "roles" SET "codigo" = 'ADMINISTRADOR' WHERE "nombre" = 'Administrador';
UPDATE "roles" SET "codigo" = 'DOCENTE' WHERE "nombre" = 'Docente';
UPDATE "roles" SET "codigo" = 'ESTUDIANTE' WHERE "nombre" = 'Estudiante';

ALTER TABLE "roles" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "roles_codigo_key" ON "roles"("codigo");

-- Estado de seguridad de las cuentas.
ALTER TABLE "usuarios"
  ADD COLUMN "debe_cambiar_contrasena" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "contrasena_actualizada_en" TIMESTAMP(3),
  ADD COLUMN "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bloqueado_hasta" TIMESTAMP(3),
  ADD CONSTRAINT "usuarios_intentos_fallidos_check" CHECK ("intentos_fallidos" >= 0);

-- Solo se almacena un hash no reversible del refresh token.
CREATE TABLE "sesiones_autenticacion" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_usuario" BIGINT NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "fecha_expiracion" TIMESTAMP(3) NOT NULL,
  "fecha_revocacion" TIMESTAMP(3),
  "motivo_revocacion" TEXT,
  "id_sesion_reemplazo" BIGINT,
  "direccion_ip" VARCHAR(50),
  "agente_usuario" TEXT,
  "ultimo_uso_en" TIMESTAMP(3),
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sesiones_autenticacion_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "sesiones_autenticacion_id_sesion_reemplazo_fkey"
    FOREIGN KEY ("id_sesion_reemplazo") REFERENCES "sesiones_autenticacion"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sesiones_autenticacion_token_hash_key" ON "sesiones_autenticacion"("token_hash");
CREATE INDEX "sesiones_autenticacion_id_usuario_idx" ON "sesiones_autenticacion"("id_usuario");
CREATE INDEX "sesiones_autenticacion_fecha_expiracion_idx" ON "sesiones_autenticacion"("fecha_expiracion");
CREATE INDEX "sesiones_autenticacion_usuario_revocacion_expiracion_idx"
  ON "sesiones_autenticacion"("id_usuario", "fecha_revocacion", "fecha_expiracion");
