import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const ejecutar = process.env.EJECUTAR_PRUEBAS_DB === 'true';
const prisma = new PrismaClient();

describe.skipIf(!ejecutar)('verificaciones de base de datos', () => {
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
  });

  it('confirma datos iniciales idempotentes del seeder', async () => {
    await expect(prisma.rol.count()).resolves.toBeGreaterThanOrEqual(3);
    await expect(prisma.nivelEducativo.count()).resolves.toBeGreaterThanOrEqual(3);
    await expect(prisma.grado.count()).resolves.toBeGreaterThanOrEqual(11);
    await expect(prisma.areaAcademica.count()).resolves.toBeGreaterThanOrEqual(7);
    await expect(prisma.asignatura.count()).resolves.toBeGreaterThanOrEqual(10);
  });
});
