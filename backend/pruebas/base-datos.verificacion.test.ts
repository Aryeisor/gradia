import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();

afterAll(async () => prisma.$disconnect());

describe('verificaciones de base de datos', () => {
  it('confirma conexion con PostgreSQL y tablas principales', async () => {
    const tablas = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const nombres = tablas.map((tabla) => tabla.table_name);

    expect(nombres).toContain('roles');
    expect(nombres).toContain('usuarios');
    expect(nombres).toContain('estudiantes');
    expect(nombres).toContain('docentes');
    expect(nombres).toContain('areas_academicas');
    expect(nombres).toContain('asignaturas');
    expect(nombres).toContain('asignaciones_academicas');
    expect(nombres).toContain('calificaciones');
    expect(nombres).toContain('sesiones_autenticacion');
    expect(nombres.filter((nombre) => nombre !== '_prisma_migrations')).toHaveLength(22);
  });

  it('confirma datos iniciales idempotentes del seeder', async () => {
    await expect(prisma.rol.count()).resolves.toBe(3);
    await expect(prisma.nivelEducativo.count()).resolves.toBeGreaterThanOrEqual(3);
    await expect(prisma.grado.count()).resolves.toBeGreaterThanOrEqual(11);
    await expect(prisma.areaAcademica.count()).resolves.toBeGreaterThanOrEqual(7);
    await expect(prisma.asignatura.count()).resolves.toBeGreaterThanOrEqual(10);

    const codigos = (await prisma.rol.findMany({ orderBy: { codigo: 'asc' }, select: { codigo: true } }))
      .map((rol) => rol.codigo);
    expect(codigos).toEqual(['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE']);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('confirma campos iniciales de seguridad y sesiones vacias', async () => {
    const [resultado] = await prisma.$queryRaw<Array<{ cantidad: bigint }>>`
      SELECT COUNT(*) AS cantidad
      FROM usuarios
      WHERE intentos_fallidos < 0 OR debe_cambiar_contrasena IS NULL
    `;
    expect(resultado.cantidad).toBe(0n);
    await expect(prisma.sesionAutenticacion.count()).resolves.toBe(0);
  });

  it('confirma relacion usuario-sesiones e indices de seguridad', async () => {
    const restricciones = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'sesiones_autenticacion'
    `;
    const indices = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'sesiones_autenticacion'
    `;

    const nombresRestricciones = restricciones.map((item) => item.constraint_name);
    const nombresIndices = indices.map((item) => item.indexname);
    expect(nombresRestricciones).toContain('sesiones_autenticacion_id_usuario_fkey');
    expect(nombresIndices).toContain('sesiones_autenticacion_token_hash_key');
    expect(nombresIndices).toContain('sesiones_autenticacion_id_usuario_idx');
    expect(nombresIndices).toContain('sesiones_autenticacion_fecha_expiracion_idx');
    expect(nombresIndices).toContain('sesiones_autenticacion_usuario_revocacion_expiracion_idx');
  });
});
