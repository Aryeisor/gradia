import { Prisma } from '@prisma/client';
import {
  ErrorConflicto,
  ErrorNoEncontrado,
  ErrorValidacion
} from '../../compartido/errores/error-aplicacion.js';
import { validarCoherenciaUsuarioPerfil } from '../../compartido/validaciones/validaciones-coherencia-academica.js';
import { prisma } from '../../infraestructura/prisma/cliente-prisma.js';
import { generarHashContrasena } from '../autenticacion/servicios/contrasenas.servicio.js';
import { registrarAuditoriaSeguridad } from '../autenticacion/servicios/auditoria-seguridad.servicio.js';
import { revocarSesionesUsuario } from '../autenticacion/servicios/sesiones.servicio.js';
import {
  ConsultaUsuarios,
  EntradaActualizarUsuario,
  EntradaCambiarEstadoUsuario,
  EntradaCrearUsuario,
  EntradaRestablecerContrasena
} from './usuarios.esquemas.js';
import { ContextoAdministracionUsuario } from './usuarios.tipos.js';

const seleccionUsuarioResumen = {
  id: true,
  nombres: true,
  apellidos: true,
  tipoDocumento: true,
  numeroDocumento: true,
  correo: true,
  estado: true,
  ultimoAcceso: true,
  debeCambiarContrasena: true,
  creadoEn: true,
  actualizadoEn: true,
  rol: { select: { codigo: true, nombre: true } },
  docente: { select: { id: true, codigoDocente: true, especialidad: true, estado: true } },
  estudiante: { select: { id: true, codigoEstudiante: true, estado: true } }
} satisfies Prisma.UsuarioSelect;

const seleccionUsuarioDetalle = {
  ...seleccionUsuarioResumen,
  docente: {
    select: {
      id: true,
      codigoDocente: true,
      especialidad: true,
      telefono: true,
      estado: true,
      creadoEn: true,
      actualizadoEn: true
    }
  },
  estudiante: {
    select: {
      id: true,
      codigoEstudiante: true,
      fechaNacimiento: true,
      telefono: true,
      direccion: true,
      estado: true,
      creadoEn: true,
      actualizadoEn: true
    }
  }
} satisfies Prisma.UsuarioSelect;

function esErrorPrisma(error: unknown, codigo: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === codigo;
}

function convertirErrorPersistencia(error: unknown): never {
  if (esErrorPrisma(error, 'P2002')) {
    throw new ErrorConflicto('Ya existe un usuario o perfil con uno de los datos unicos indicados');
  }
  if (esErrorPrisma(error, 'P2034')) {
    throw new ErrorConflicto('La operacion coincidio con otra actualizacion. Intente nuevamente');
  }
  throw error;
}

function fechaDesdeDia(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

function datosAuditoriaUsuario(usuario: Prisma.UsuarioGetPayload<{ select: typeof seleccionUsuarioDetalle }>) {
  return {
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    tipoDocumento: usuario.tipoDocumento,
    numeroDocumento: usuario.numeroDocumento,
    correo: usuario.correo,
    estado: usuario.estado,
    debeCambiarContrasena: usuario.debeCambiarContrasena,
    rol: usuario.rol.codigo,
    docente: usuario.docente,
    estudiante: usuario.estudiante
  };
}

function asegurarCamposPerfilCompatibles(
  rol: string,
  perfil: NonNullable<EntradaActualizarUsuario['perfil']>
): void {
  const campos = Object.keys(perfil);
  if (rol === 'ADMINISTRADOR' && campos.length > 0) {
    throw new ErrorValidacion('Un administrador no tiene perfil docente ni estudiantil');
  }
  const camposDocente = new Set(['codigoDocente', 'especialidad', 'telefono']);
  const camposEstudiante = new Set(['codigoEstudiante', 'fechaNacimiento', 'telefono', 'direccion']);
  const permitidos = rol === 'DOCENTE' ? camposDocente : rol === 'ESTUDIANTE' ? camposEstudiante : new Set<string>();
  if (campos.some((campo) => !permitidos.has(campo))) {
    throw new ErrorValidacion('Los datos del perfil no son compatibles con el rol actual');
  }
}

export async function listarUsuarios(consulta: ConsultaUsuarios) {
  const where: Prisma.UsuarioWhereInput = {
    ...(consulta.rol ? { rol: { codigo: consulta.rol } } : {}),
    ...(consulta.estado === undefined ? {} : { estado: consulta.estado }),
    ...(consulta.buscar
      ? {
          OR: [
            { nombres: { contains: consulta.buscar, mode: 'insensitive' } },
            { apellidos: { contains: consulta.buscar, mode: 'insensitive' } },
            { correo: { contains: consulta.buscar, mode: 'insensitive' } },
            { numeroDocumento: { contains: consulta.buscar, mode: 'insensitive' } },
            { docente: { is: { codigoDocente: { contains: consulta.buscar, mode: 'insensitive' } } } },
            { estudiante: { is: { codigoEstudiante: { contains: consulta.buscar, mode: 'insensitive' } } } }
          ]
        }
      : {})
  };
  const omitir = (consulta.pagina - 1) * consulta.limite;
  const [total, usuarios] = await prisma.$transaction([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      select: seleccionUsuarioResumen,
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }, { id: 'asc' }],
      skip: omitir,
      take: consulta.limite
    })
  ]);
  return {
    usuarios,
    paginacion: {
      pagina: consulta.pagina,
      limite: consulta.limite,
      total,
      totalPaginas: total === 0 ? 0 : Math.ceil(total / consulta.limite)
    }
  };
}

export async function consultarUsuario(idUsuario: bigint) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: seleccionUsuarioDetalle
  });
  if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');
  return usuario;
}

export async function crearUsuario(
  entrada: EntradaCrearUsuario,
  contexto: ContextoAdministracionUsuario
) {
  const contrasenaHash = await generarHashContrasena(entrada.contrasenaTemporal);
  try {
    return await prisma.$transaction(async (tx) => {
      const rol = await tx.rol.findUnique({
        where: { codigo: entrada.rol },
        select: { id: true, estado: true }
      });
      if (!rol || !rol.estado) throw new ErrorConflicto('El rol indicado no esta disponible');

      const usuario = await tx.usuario.create({
        data: {
          idRol: rol.id,
          nombres: entrada.nombres,
          apellidos: entrada.apellidos,
          tipoDocumento: entrada.tipoDocumento,
          numeroDocumento: entrada.numeroDocumento,
          correo: entrada.correo,
          contrasenaHash,
          debeCambiarContrasena: true,
          contrasenaActualizadaEn: new Date(),
          ...(entrada.rol === 'DOCENTE'
            ? {
                docente: {
                  create: {
                    codigoDocente: entrada.perfil.codigoDocente,
                    especialidad: entrada.perfil.especialidad,
                    telefono: entrada.perfil.telefono
                  }
                }
              }
            : {}),
          ...(entrada.rol === 'ESTUDIANTE'
            ? {
                estudiante: {
                  create: {
                    codigoEstudiante: entrada.perfil.codigoEstudiante,
                    fechaNacimiento: fechaDesdeDia(entrada.perfil.fechaNacimiento),
                    telefono: entrada.perfil.telefono,
                    direccion: entrada.perfil.direccion
                  }
                }
              }
            : {})
        },
        select: seleccionUsuarioDetalle
      });
      await validarCoherenciaUsuarioPerfil(tx, usuario.id);
      await registrarAuditoriaSeguridad(tx, {
        accion: 'CREACION_USUARIO',
        modulo: 'USUARIOS',
        idUsuario: contexto.idAdministrador,
        direccionIp: contexto.direccionIp,
        agenteUsuario: contexto.agenteUsuario,
        tablaAfectada: 'usuarios',
        idRegistro: usuario.id,
        datosNuevos: datosAuditoriaUsuario(usuario)
      });
      return usuario;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    convertirErrorPersistencia(error);
  }
}

export async function actualizarUsuario(
  idUsuario: bigint,
  entrada: EntradaActualizarUsuario,
  contexto: ContextoAdministracionUsuario
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const anterior = await tx.usuario.findUnique({
        where: { id: idUsuario },
        select: seleccionUsuarioDetalle
      });
      if (!anterior) throw new ErrorNoEncontrado('Usuario no encontrado');
      if (entrada.perfil) asegurarCamposPerfilCompatibles(anterior.rol.codigo, entrada.perfil);

      await tx.usuario.update({
        where: { id: idUsuario },
        data: {
          nombres: entrada.nombres,
          apellidos: entrada.apellidos,
          tipoDocumento: entrada.tipoDocumento,
          numeroDocumento: entrada.numeroDocumento,
          correo: entrada.correo
        }
      });
      if (entrada.perfil && anterior.rol.codigo === 'DOCENTE') {
        if (!anterior.docente) throw new ErrorConflicto('El usuario no tiene el perfil docente requerido');
        await tx.docente.update({
          where: { idUsuario },
          data: {
            codigoDocente: entrada.perfil.codigoDocente,
            especialidad: entrada.perfil.especialidad,
            telefono: entrada.perfil.telefono
          }
        });
      }
      if (entrada.perfil && anterior.rol.codigo === 'ESTUDIANTE') {
        if (!anterior.estudiante) throw new ErrorConflicto('El usuario no tiene el perfil estudiantil requerido');
        await tx.estudiante.update({
          where: { idUsuario },
          data: {
            codigoEstudiante: entrada.perfil.codigoEstudiante,
            fechaNacimiento: entrada.perfil.fechaNacimiento
              ? fechaDesdeDia(entrada.perfil.fechaNacimiento)
              : undefined,
            telefono: entrada.perfil.telefono,
            direccion: entrada.perfil.direccion
          }
        });
      }
      await validarCoherenciaUsuarioPerfil(tx, idUsuario);
      const actualizado = await tx.usuario.findUniqueOrThrow({
        where: { id: idUsuario },
        select: seleccionUsuarioDetalle
      });
      await registrarAuditoriaSeguridad(tx, {
        accion: 'ACTUALIZACION_USUARIO',
        modulo: 'USUARIOS',
        idUsuario: contexto.idAdministrador,
        direccionIp: contexto.direccionIp,
        agenteUsuario: contexto.agenteUsuario,
        tablaAfectada: 'usuarios',
        idRegistro: idUsuario,
        datosAnteriores: datosAuditoriaUsuario(anterior),
        datosNuevos: datosAuditoriaUsuario(actualizado)
      });
      return actualizado;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    convertirErrorPersistencia(error);
  }
}

export async function cambiarEstadoUsuario(
  idUsuario: bigint,
  entrada: EntradaCambiarEstadoUsuario,
  contexto: ContextoAdministracionUsuario
) {
  if (!entrada.estado && idUsuario === contexto.idAdministrador) {
    throw new ErrorConflicto('Un administrador no puede desactivar su propia cuenta');
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({
        where: { id: idUsuario },
        select: { id: true, estado: true, rol: { select: { codigo: true } } }
      });
      if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');

      if (!entrada.estado && usuario.estado && usuario.rol.codigo === 'ADMINISTRADOR') {
        const administradoresActivos = await tx.usuario.count({
          where: { estado: true, rol: { codigo: 'ADMINISTRADOR' } }
        });
        if (administradoresActivos <= 1) {
          throw new ErrorConflicto('Debe permanecer al menos un administrador activo');
        }
      }

      const actualizado = await tx.usuario.update({
        where: { id: idUsuario },
        data: { estado: entrada.estado },
        select: seleccionUsuarioDetalle
      });
      const sesionesRevocadas = entrada.estado
        ? 0
        : await revocarSesionesUsuario(tx, idUsuario, 'USUARIO_DESACTIVADO');
      await registrarAuditoriaSeguridad(tx, {
        accion: entrada.estado ? 'ACTIVACION_USUARIO' : 'DESACTIVACION_USUARIO',
        modulo: 'USUARIOS',
        idUsuario: contexto.idAdministrador,
        direccionIp: contexto.direccionIp,
        agenteUsuario: contexto.agenteUsuario,
        tablaAfectada: 'usuarios',
        idRegistro: idUsuario,
        datosAnteriores: { estado: usuario.estado },
        datosNuevos: { estado: entrada.estado, motivo: entrada.motivo, sesionesRevocadas }
      });
      return actualizado;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    convertirErrorPersistencia(error);
  }
}

export async function restablecerContrasenaUsuario(
  idUsuario: bigint,
  entrada: EntradaRestablecerContrasena,
  contexto: ContextoAdministracionUsuario
) {
  const contrasenaHash = await generarHashContrasena(entrada.contrasenaTemporal);
  const ahora = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({ where: { id: idUsuario }, select: { id: true } });
      if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');
      await tx.usuario.update({
        where: { id: idUsuario },
        data: {
          contrasenaHash,
          debeCambiarContrasena: true,
          contrasenaActualizadaEn: ahora,
          intentosFallidos: 0,
          bloqueadoHasta: null
        }
      });
      const sesionesRevocadas = await revocarSesionesUsuario(
        tx,
        idUsuario,
        'RESTABLECIMIENTO_ADMINISTRATIVO',
        ahora
      );
      await registrarAuditoriaSeguridad(tx, {
        accion: 'RESTABLECIMIENTO_CONTRASENA',
        modulo: 'USUARIOS',
        idUsuario: contexto.idAdministrador,
        direccionIp: contexto.direccionIp,
        agenteUsuario: contexto.agenteUsuario,
        tablaAfectada: 'usuarios',
        idRegistro: idUsuario,
        datosNuevos: {
          debeCambiarContrasena: true,
          contrasenaActualizadaEn: ahora,
          intentosFallidos: 0,
          bloqueadoHasta: null,
          sesionesRevocadas
        }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    convertirErrorPersistencia(error);
  }
}
