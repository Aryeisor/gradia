import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ErrorConflicto } from '../src/compartido/errores/error-aplicacion.js';
import {
  ClientePrismaTransaccional,
  validarAsignaturaPerteneceAreaPlan,
  validarCoherenciaActividadEvaluativa,
  validarCoherenciaAsignacionAcademica,
  validarCoherenciaCalificacion,
  validarCoherenciaUsuarioPerfil,
  validarGrupoCompatibleConPlan,
  validarMatriculaActivaUnicaPorAnio
} from '../src/compartido/validaciones/validaciones-coherencia-academica.js';

const cliente = (parcial: Record<string, unknown>) => parcial as unknown as ClientePrismaTransaccional;

describe('validaciones de coherencia academica con mocks (sin modificar PostgreSQL)', () => {
  it('acepta una asignatura del area correcta', async () => {
    const db = cliente({ asignatura: { findUnique: vi.fn().mockResolvedValue({ idAreaAcademica: 1n }) }, areaPlanEstudio: { findUnique: vi.fn().mockResolvedValue({ idAreaAcademica: 1n }) } });
    await expect(validarAsignaturaPerteneceAreaPlan(db, { idAsignatura: 1n, idAreaPlanEstudio: 2n })).resolves.toBeUndefined();
  });

  it('rechaza una asignatura de otra area', async () => {
    const db = cliente({ asignatura: { findUnique: vi.fn().mockResolvedValue({ idAreaAcademica: 1n }) }, areaPlanEstudio: { findUnique: vi.fn().mockResolvedValue({ idAreaAcademica: 2n }) } });
    await expect(validarAsignaturaPerteneceAreaPlan(db, { idAsignatura: 1n, idAreaPlanEstudio: 2n })).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it.each([[true, 'compatible'], [false, 'incompatible']] as const)('valida grupo y plan %s', async (compatible, _caso) => {
    void _caso;
    const db = cliente({ grupo: { findUnique: vi.fn().mockResolvedValue({ idGrado: 3n }) }, areaPlanEstudio: { findFirst: vi.fn().mockResolvedValue(compatible ? { id: 1n } : null) } });
    const promesa = validarGrupoCompatibleConPlan(db, { idGrupo: 1n, idPlanEstudio: 2n });
    if (compatible) await expect(promesa).resolves.toBeUndefined(); else await expect(promesa).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it('rechaza una asignacion para un grado incorrecto', async () => {
    const db = cliente({
      docente: { findUnique: vi.fn().mockResolvedValue({ estado: 'ACTIVO' }) },
      grupo: { findUnique: vi.fn().mockResolvedValue({ estado: true, idGrado: 2n, idPlanEstudio: 5n }) },
      detallePlanEstudio: { findUnique: vi.fn().mockResolvedValue({ estado: true, calificable: true, areaPlanEstudio: { idGrado: 3n, idPlanEstudio: 5n, estado: true } }) }
    });
    await expect(validarCoherenciaAsignacionAcademica(db, { idDocente: 1n, idDetallePlanEstudio: 2n, idGrupo: 3n })).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it('rechaza un periodo de otro ano academico', async () => {
    const db = cliente({
      asignacionAcademica: { findUnique: vi.fn().mockResolvedValue({ estado: 'ACTIVA', grupo: { idAnioAcademico: 1n } }) },
      periodoAcademico: { findUnique: vi.fn().mockResolvedValue({ idAnioAcademico: 2n, estado: 'ABIERTO' }) }
    });
    await expect(validarCoherenciaActividadEvaluativa(db, { idAsignacionAcademica: 1n, idPeriodoAcademico: 2n, porcentaje: new Prisma.Decimal(20) })).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it.each([[null, 'sin matricula'], [{ id: 9n }, 'matriculado en otro grupo']] as const)('rechaza estudiante %s', async (matricula, _caso) => {
    void _caso;
    const db = cliente({
      estudiante: { findUnique: vi.fn().mockResolvedValue({ estado: 'ACTIVO' }) },
      actividadEvaluativa: { findUnique: vi.fn().mockResolvedValue({ fechaActividad: new Date(), periodoAcademico: { estado: 'ABIERTO', idAnioAcademico: 1n }, asignacionAcademica: { estado: 'ACTIVA', idGrupo: 5n } }) },
      calificacion: { findUnique: vi.fn().mockResolvedValue(null) },
      matricula: { findFirst: vi.fn().mockResolvedValue(null) }
    });
    void matricula;
    await expect(validarCoherenciaCalificacion(db, { idActividadEvaluativa: 1n, idEstudiante: 2n, nota: new Prisma.Decimal(4) })).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it('rechaza una matricula activa en el mismo ano', async () => {
    const db = cliente({ grupo: { findUnique: vi.fn().mockResolvedValue({ idAnioAcademico: 1n }) }, matricula: { findFirst: vi.fn().mockResolvedValue({ id: 8n }) } });
    await expect(validarMatriculaActivaUnicaPorAnio(db, { idEstudiante: 1n, idGrupoDestino: 2n })).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it('rechaza rol y perfil incompatibles', async () => {
    const db = cliente({ usuario: { findUnique: vi.fn().mockResolvedValue({ rol: { nombre: 'Estudiante' }, estudiante: null, docente: { id: 2n } }) } });
    await expect(validarCoherenciaUsuarioPerfil(db, 1n)).rejects.toBeInstanceOf(ErrorConflicto);
  });
});
