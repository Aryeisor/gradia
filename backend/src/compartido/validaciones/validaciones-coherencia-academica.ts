import {
  EstadoActividad,
  EstadoAsignacion,
  EstadoEstudiante,
  EstadoMatricula,
  EstadoPeriodoAcademico,
  Prisma
} from '@prisma/client';
import { ErrorConflicto, ErrorNoEncontrado, ErrorValidacion } from '../errores/error-aplicacion.js';

export type ClientePrismaTransaccional = Prisma.TransactionClient;

/** Garantiza que el rol y los perfiles academicos de un usuario sean compatibles. */
export async function validarCoherenciaUsuarioPerfil(
  cliente: ClientePrismaTransaccional,
  idUsuario: bigint
): Promise<void> {
  const usuario = await cliente.usuario.findUnique({
    where: { id: idUsuario },
    include: { rol: true, estudiante: true, docente: true }
  });
  if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');
  if (usuario.estudiante && usuario.docente) {
    throw new ErrorConflicto('Un usuario no puede tener perfiles de estudiante y docente simultaneamente');
  }
  if (usuario.rol.codigo === 'ESTUDIANTE' && (!usuario.estudiante || usuario.docente)) {
    throw new ErrorConflicto('El perfil academico no coincide con el rol Estudiante');
  }
  if (usuario.rol.codigo === 'DOCENTE' && (!usuario.docente || usuario.estudiante)) {
    throw new ErrorConflicto('El perfil academico no coincide con el rol Docente');
  }
  if (usuario.rol.codigo === 'ADMINISTRADOR' && (usuario.estudiante || usuario.docente)) {
    throw new ErrorConflicto('El rol Administrador no debe tener un perfil academico');
  }
}

/** Impide ubicar una asignatura en un area de plan diferente de su area academica. */
export async function validarAsignaturaPerteneceAreaPlan(
  cliente: ClientePrismaTransaccional,
  datos: { idAsignatura: bigint; idAreaPlanEstudio: bigint }
): Promise<void> {
  const [asignatura, areaPlan] = await Promise.all([
    cliente.asignatura.findUnique({ where: { id: datos.idAsignatura }, select: { idAreaAcademica: true } }),
    cliente.areaPlanEstudio.findUnique({
      where: { id: datos.idAreaPlanEstudio },
      select: { idAreaAcademica: true }
    })
  ]);
  if (!asignatura) throw new ErrorNoEncontrado('Asignatura no encontrada');
  if (!areaPlan) throw new ErrorNoEncontrado('Area del plan de estudios no encontrada');
  if (asignatura.idAreaAcademica !== areaPlan.idAreaAcademica) {
    throw new ErrorConflicto('La asignatura no pertenece al area academica configurada en el plan');
  }
}

/** Comprueba que el plan tenga configuracion para el grado del grupo. */
export async function validarGrupoCompatibleConPlan(
  cliente: ClientePrismaTransaccional,
  datos: { idGrupo: bigint; idPlanEstudio: bigint }
): Promise<void> {
  const grupo = await cliente.grupo.findUnique({ where: { id: datos.idGrupo }, select: { idGrado: true } });
  if (!grupo) throw new ErrorNoEncontrado('Grupo no encontrado');
  const areaConfigurada = await cliente.areaPlanEstudio.findFirst({
    where: { idPlanEstudio: datos.idPlanEstudio, idGrado: grupo.idGrado, estado: true },
    select: { id: true }
  });
  if (!areaConfigurada) {
    throw new ErrorConflicto('El plan de estudios no contiene configuracion activa para el grado del grupo');
  }
}

/** Valida docente, grupo y detalle, incluida su coherencia de grado y plan. */
export async function validarCoherenciaAsignacionAcademica(
  cliente: ClientePrismaTransaccional,
  datos: {
    idDocente: bigint;
    idDetallePlanEstudio: bigint;
    idGrupo: bigint;
    requiereAsignaturaCalificable?: boolean;
  }
): Promise<void> {
  const [docente, grupo, detalle] = await Promise.all([
    cliente.docente.findUnique({ where: { id: datos.idDocente }, select: { estado: true } }),
    cliente.grupo.findUnique({
      where: { id: datos.idGrupo },
      select: { estado: true, idGrado: true, idPlanEstudio: true }
    }),
    cliente.detallePlanEstudio.findUnique({
      where: { id: datos.idDetallePlanEstudio },
      select: {
        estado: true,
        calificable: true,
        areaPlanEstudio: { select: { idGrado: true, idPlanEstudio: true, estado: true } }
      }
    })
  ]);
  if (!docente) throw new ErrorNoEncontrado('Docente no encontrado');
  if (!grupo) throw new ErrorNoEncontrado('Grupo no encontrado');
  if (!detalle) throw new ErrorNoEncontrado('Detalle del plan de estudios no encontrado');
  if (docente.estado !== 'ACTIVO') throw new ErrorConflicto('El docente no esta activo');
  if (!grupo.estado) throw new ErrorConflicto('El grupo no esta activo');
  if (!detalle.estado || !detalle.areaPlanEstudio.estado) {
    throw new ErrorConflicto('El detalle del plan de estudios no esta activo');
  }
  if (grupo.idGrado !== detalle.areaPlanEstudio.idGrado) {
    throw new ErrorConflicto('El grado del grupo no coincide con el grado del plan');
  }
  if (grupo.idPlanEstudio !== detalle.areaPlanEstudio.idPlanEstudio) {
    throw new ErrorConflicto('El plan del grupo no coincide con el detalle del plan');
  }
  if (datos.requiereAsignaturaCalificable && !detalle.calificable) {
    throw new ErrorConflicto('La asignatura configurada no es calificable');
  }
}

/** Valida periodo, asignacion y limite acumulado antes de crear una actividad. */
export async function validarCoherenciaActividadEvaluativa(
  cliente: ClientePrismaTransaccional,
  datos: { idAsignacionAcademica: bigint; idPeriodoAcademico: bigint; porcentaje: Prisma.Decimal }
): Promise<void> {
  if (datos.porcentaje.lte(0) || datos.porcentaje.gt(100)) {
    throw new ErrorValidacion('El porcentaje debe ser mayor que 0 y menor o igual que 100');
  }
  const [asignacion, periodo] = await Promise.all([
    cliente.asignacionAcademica.findUnique({
      where: { id: datos.idAsignacionAcademica },
      select: { estado: true, grupo: { select: { idAnioAcademico: true } } }
    }),
    cliente.periodoAcademico.findUnique({
      where: { id: datos.idPeriodoAcademico },
      select: { idAnioAcademico: true, estado: true }
    })
  ]);
  if (!asignacion) throw new ErrorNoEncontrado('Asignacion academica no encontrada');
  if (!periodo) throw new ErrorNoEncontrado('Periodo academico no encontrado');
  if (asignacion.estado !== EstadoAsignacion.ACTIVA) throw new ErrorConflicto('La asignacion no esta activa');
  if (periodo.estado !== EstadoPeriodoAcademico.ABIERTO) throw new ErrorConflicto('El periodo no esta abierto');
  if (asignacion.grupo.idAnioAcademico !== periodo.idAnioAcademico) {
    throw new ErrorConflicto('El periodo no pertenece al ano academico del grupo');
  }
  const acumulado = await cliente.actividadEvaluativa.aggregate({
    where: {
      idAsignacionAcademica: datos.idAsignacionAcademica,
      idPeriodoAcademico: datos.idPeriodoAcademico,
      estado: { not: EstadoActividad.BORRADOR }
    },
    _sum: { porcentaje: true }
  });
  const porcentajeActual = acumulado._sum.porcentaje ?? new Prisma.Decimal(0);
  if (porcentajeActual.plus(datos.porcentaje).gt(100)) {
    throw new ErrorConflicto('La suma de porcentajes de actividades supera el 100 %');
  }
}

/** Valida matricula, actividad, periodo, escala y unicidad antes de registrar una nota. */
export async function validarCoherenciaCalificacion(
  cliente: ClientePrismaTransaccional,
  datos: { idActividadEvaluativa: bigint; idEstudiante: bigint; nota: Prisma.Decimal }
): Promise<void> {
  const [estudiante, actividad, existente] = await Promise.all([
    cliente.estudiante.findUnique({ where: { id: datos.idEstudiante }, select: { estado: true } }),
    cliente.actividadEvaluativa.findUnique({
      where: { id: datos.idActividadEvaluativa },
      select: {
        fechaActividad: true,
        periodoAcademico: { select: { estado: true, idAnioAcademico: true } },
        asignacionAcademica: { select: { estado: true, idGrupo: true } }
      }
    }),
    cliente.calificacion.findUnique({
      where: {
        idActividadEvaluativa_idEstudiante: {
          idActividadEvaluativa: datos.idActividadEvaluativa,
          idEstudiante: datos.idEstudiante
        }
      },
      select: { id: true }
    })
  ]);
  if (!estudiante) throw new ErrorNoEncontrado('Estudiante no encontrado');
  if (!actividad) throw new ErrorNoEncontrado('Actividad evaluativa no encontrada');
  if (estudiante.estado !== EstadoEstudiante.ACTIVO) throw new ErrorConflicto('El estudiante no esta activo');
  if (existente) throw new ErrorConflicto('Ya existe una calificacion para el estudiante y la actividad');
  if (actividad.asignacionAcademica.estado !== EstadoAsignacion.ACTIVA) {
    throw new ErrorConflicto('La actividad no pertenece a una asignacion activa');
  }
  if (actividad.periodoAcademico.estado !== EstadoPeriodoAcademico.ABIERTO) {
    throw new ErrorConflicto('El periodo academico no esta abierto');
  }
  const matricula = await cliente.matricula.findFirst({
    where: {
      idEstudiante: datos.idEstudiante,
      idGrupo: actividad.asignacionAcademica.idGrupo,
      estado: EstadoMatricula.ACTIVA
    },
    select: { fechaRetiro: true }
  });
  if (!matricula) throw new ErrorConflicto('El estudiante no tiene matricula activa en el grupo de la asignacion');
  if (matricula.fechaRetiro && matricula.fechaRetiro < actividad.fechaActividad) {
    throw new ErrorConflicto('El estudiante fue retirado antes de la fecha de la actividad');
  }
  const configuracion = await cliente.configuracionAcademica.findUnique({
    where: { idAnioAcademico: actividad.periodoAcademico.idAnioAcademico },
    select: { notaMinima: true, notaMaxima: true, estado: true }
  });
  if (!configuracion || !configuracion.estado) {
    throw new ErrorConflicto('No existe una configuracion academica activa para el ano');
  }
  if (datos.nota.lt(configuracion.notaMinima) || datos.nota.gt(configuracion.notaMaxima)) {
    throw new ErrorValidacion('La nota esta fuera de la escala academica configurada');
  }
}

/** Debe ejecutarse dentro de la transaccion que crea una matricula. */
export async function validarMatriculaActivaUnicaPorAnio(
  cliente: ClientePrismaTransaccional,
  datos: { idEstudiante: bigint; idGrupoDestino: bigint }
): Promise<void> {
  const grupo = await cliente.grupo.findUnique({
    where: { id: datos.idGrupoDestino },
    select: { idAnioAcademico: true }
  });
  if (!grupo) throw new ErrorNoEncontrado('Grupo de destino no encontrado');
  const matricula = await cliente.matricula.findFirst({
    where: {
      idEstudiante: datos.idEstudiante,
      estado: EstadoMatricula.ACTIVA,
      grupo: { idAnioAcademico: grupo.idAnioAcademico }
    },
    select: { id: true }
  });
  if (matricula) throw new ErrorConflicto('El estudiante ya tiene una matricula activa en el mismo ano academico');
}
