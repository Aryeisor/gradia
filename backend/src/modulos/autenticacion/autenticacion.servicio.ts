import { Prisma } from '@prisma/client';
import { ErrorConflicto, ErrorNoAutenticado } from '../../compartido/errores/error-aplicacion.js';
import { prisma } from '../../infraestructura/prisma/cliente-prisma.js';
import { EntradaCambiarContrasena, EntradaIniciarSesion } from './autenticacion.esquemas.js';
import { CodigoRol, codigosRol, PayloadTokenAcceso } from './tipos/autenticacion.tipos.js';
import { ContextoSolicitud, UsuarioActualSeguro, UsuarioAutenticadoSeguro } from './autenticacion.tipos.js';
import { compararContrasena, generarHashContrasena, validarPoliticaContrasena } from './servicios/contrasenas.servicio.js';
import { generarTokenAcceso } from './servicios/jwt.servicio.js';
import { asegurarUsuarioNoBloqueado, registrarIntentoFallido } from './servicios/proteccion-login.servicio.js';
import { calcularExpiracionRefreshToken, generarHashRefreshToken, generarRefreshToken, validarFormatoRefreshToken } from './servicios/refresh-token.servicio.js';
import { registrarAuditoriaSeguridad } from './servicios/auditoria-seguridad.servicio.js';
import { rotarSesion, sesionEstaActiva } from './servicios/sesiones.servicio.js';

const HASH_COMPARACION_USUARIO_INEXISTENTE = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.yrxZ9DU7YOb0vV9JZb6fUMlJBWZKXrK';
const MENSAJE_CREDENCIALES = 'Correo o contrasena incorrectos';

const seleccionUsuarioSeguro = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  debeCambiarContrasena: true,
  rol: { select: { codigo: true, nombre: true } }
} satisfies Prisma.UsuarioSelect;

function codigoRolSeguro(codigo: string): CodigoRol {
  if (!codigosRol.includes(codigo as CodigoRol)) throw new ErrorNoAutenticado('La cuenta no tiene un rol valido');
  return codigo as CodigoRol;
}

function transformarUsuarioSeguro(usuario: Prisma.UsuarioGetPayload<{ select: typeof seleccionUsuarioSeguro }>): UsuarioAutenticadoSeguro {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    debeCambiarContrasena: usuario.debeCambiarContrasena,
    rol: { codigo: codigoRolSeguro(usuario.rol.codigo), nombre: usuario.rol.nombre }
  };
}

async function asegurarSesionDeAccesoActiva(payload: PayloadTokenAcceso): Promise<void> {
  const sesion = await prisma.sesionAutenticacion.findUnique({
    where: { id: BigInt(payload.sid) },
    select: {
      idUsuario: true,
      fechaRevocacion: true,
      fechaExpiracion: true,
      usuario: { select: { estado: true, rol: { select: { codigo: true } } } }
    }
  });
  if (
    !sesion || sesion.idUsuario !== BigInt(payload.sub) ||
    sesion.usuario.rol.codigo !== payload.rol || !sesionEstaActiva(sesion)
  ) {
    throw new ErrorNoAutenticado();
  }
}

export async function iniciarSesion(
  entrada: EntradaIniciarSesion,
  contexto: ContextoSolicitud
): Promise<{ tokenAcceso: string; refreshToken: string; usuario: UsuarioAutenticadoSeguro }> {
  const usuario = await prisma.usuario.findUnique({
    where: { correo: entrada.correo },
    select: { ...seleccionUsuarioSeguro, contrasenaHash: true, estado: true, bloqueadoHasta: true }
  });

  if (!usuario) {
    await compararContrasena(entrada.contrasena, HASH_COMPARACION_USUARIO_INEXISTENTE);
    throw new ErrorNoAutenticado(MENSAJE_CREDENCIALES);
  }
  if (!usuario.estado) throw new ErrorNoAutenticado(MENSAJE_CREDENCIALES);

  try {
    await asegurarUsuarioNoBloqueado(prisma, usuario.id);
  } catch {
    throw new ErrorConflicto('No fue posible iniciar sesion en este momento');
  }

  const contrasenaCorrecta = await compararContrasena(entrada.contrasena, usuario.contrasenaHash);
  if (!contrasenaCorrecta) {
    await prisma.$transaction(async (tx) => {
      const proteccion = await registrarIntentoFallido(tx, usuario.id);
      const bloqueada = proteccion.bloqueadoHasta !== null;
      await registrarAuditoriaSeguridad(tx, {
        accion: bloqueada ? 'BLOQUEO_CUENTA' : 'INICIO_SESION_FALLIDO',
        modulo: 'AUTENTICACION',
        idUsuario: usuario.id,
        direccionIp: contexto.direccionIp,
        agenteUsuario: contexto.agenteUsuario,
        tablaAfectada: 'usuarios',
        idRegistro: usuario.id,
        datosNuevos: {
          resultado: 'fallido',
          motivo: 'credenciales_invalidas',
          intentosFallidos: proteccion.intentosFallidos,
          bloqueada
        }
      });
    });
    throw new ErrorNoAutenticado(MENSAJE_CREDENCIALES);
  }

  const refreshToken = generarRefreshToken();
  const tokenHash = generarHashRefreshToken(refreshToken);
  const fechaExpiracion = calcularExpiracionRefreshToken();
  const ahora = new Date();

  const sesion = await prisma.$transaction(async (tx) => {
    const creada = await tx.sesionAutenticacion.create({
      data: {
        idUsuario: usuario.id,
        tokenHash,
        fechaExpiracion,
        direccionIp: contexto.direccionIp,
        agenteUsuario: contexto.agenteUsuario
      },
      select: { id: true }
    });
    await tx.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: ahora, intentosFallidos: 0, bloqueadoHasta: null }
    });
    await registrarAuditoriaSeguridad(tx, {
      accion: 'INICIO_SESION', modulo: 'AUTENTICACION', idUsuario: usuario.id,
      direccionIp: contexto.direccionIp, agenteUsuario: contexto.agenteUsuario,
      tablaAfectada: 'sesiones_autenticacion', idRegistro: creada.id,
      datosNuevos: { resultado: 'exitoso' }
    });
    return creada;
  });

  const codigoRol = codigoRolSeguro(usuario.rol.codigo);
  return {
    refreshToken,
    tokenAcceso: generarTokenAcceso({ idUsuario: usuario.id, codigoRol, idSesion: sesion.id }),
    usuario: transformarUsuarioSeguro(usuario)
  };
}

export async function renovarAutenticacion(
  refreshTokenActual: string,
  contexto: ContextoSolicitud
): Promise<{ tokenAcceso: string; refreshToken: string }> {
  if (!validarFormatoRefreshToken(refreshTokenActual)) throw new ErrorNoAutenticado('Sesion de renovacion invalida');
  const nuevoRefreshToken = generarRefreshToken();
  const nuevaSesion = await rotarSesion(prisma, {
    tokenHashActual: generarHashRefreshToken(refreshTokenActual),
    nuevoTokenHash: generarHashRefreshToken(nuevoRefreshToken),
    nuevaFechaExpiracion: calcularExpiracionRefreshToken(),
    direccionIp: contexto.direccionIp,
    agenteUsuario: contexto.agenteUsuario
  });
  const usuario = await prisma.usuario.findUnique({
    where: { id: nuevaSesion.idUsuario }, select: { estado: true, rol: { select: { codigo: true } } }
  });
  if (!usuario?.estado) throw new ErrorNoAutenticado('La cuenta no esta disponible');

  await registrarAuditoriaSeguridad(prisma, {
    accion: 'RENOVACION_SESION', modulo: 'AUTENTICACION', idUsuario: nuevaSesion.idUsuario,
    direccionIp: contexto.direccionIp, agenteUsuario: contexto.agenteUsuario,
    tablaAfectada: 'sesiones_autenticacion', idRegistro: nuevaSesion.id
  });
  return {
    refreshToken: nuevoRefreshToken,
    tokenAcceso: generarTokenAcceso({
      idUsuario: nuevaSesion.idUsuario,
      codigoRol: codigoRolSeguro(usuario.rol.codigo),
      idSesion: nuevaSesion.id
    })
  };
}

export async function consultarUsuarioActual(payload: PayloadTokenAcceso): Promise<UsuarioActualSeguro> {
  const idUsuario = BigInt(payload.sub);
  const idSesion = BigInt(payload.sid);
  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: {
      ...seleccionUsuarioSeguro,
      estado: true,
      estudiante: { select: { id: true, codigoEstudiante: true, estado: true } },
      docente: { select: { id: true, codigoDocente: true, especialidad: true, estado: true } },
      sesionesAutenticacion: {
        where: { id: idSesion },
        select: { fechaRevocacion: true, fechaExpiracion: true }
      }
    }
  });
  const sesion = usuario?.sesionesAutenticacion[0];
  if (!usuario?.estado || !sesion || !sesionEstaActiva(sesion)) throw new ErrorNoAutenticado();
  if (usuario.rol.codigo !== payload.rol) throw new ErrorNoAutenticado('El rol de la sesion ya no es valido');
  const { estado: _estado, sesionesAutenticacion: _sesiones, ...datos } = usuario;
  void _estado;
  void _sesiones;
  return {
    ...transformarUsuarioSeguro(datos),
    estudiante: datos.estudiante ? { ...datos.estudiante, estado: datos.estudiante.estado.toString() } : null,
    docente: datos.docente ? { ...datos.docente, estado: datos.docente.estado.toString() } : null
  };
}

export async function cerrarSesionActual(payload: PayloadTokenAcceso, contexto: ContextoSolicitud): Promise<void> {
  const idSesion = BigInt(payload.sid);
  const idUsuario = BigInt(payload.sub);
  await prisma.$transaction(async (tx) => {
    await tx.sesionAutenticacion.updateMany({
      where: { id: idSesion, idUsuario, fechaRevocacion: null },
      data: { fechaRevocacion: new Date(), motivoRevocacion: 'CIERRE_SESION' }
    });
    await registrarAuditoriaSeguridad(tx, {
      accion: 'CIERRE_SESION', modulo: 'AUTENTICACION', idUsuario,
      direccionIp: contexto.direccionIp, agenteUsuario: contexto.agenteUsuario,
      tablaAfectada: 'sesiones_autenticacion', idRegistro: idSesion
    });
  });
}

export async function cerrarTodasLasSesiones(payload: PayloadTokenAcceso, contexto: ContextoSolicitud): Promise<void> {
  const idUsuario = BigInt(payload.sub);
  await asegurarSesionDeAccesoActiva(payload);
  await prisma.$transaction(async (tx) => {
    await tx.sesionAutenticacion.updateMany({
      where: { idUsuario, fechaRevocacion: null },
      data: { fechaRevocacion: new Date(), motivoRevocacion: 'CIERRE_TODAS_SESIONES' }
    });
    await registrarAuditoriaSeguridad(tx, {
      accion: 'CIERRE_TODAS_SESIONES', modulo: 'AUTENTICACION', idUsuario,
      direccionIp: contexto.direccionIp, agenteUsuario: contexto.agenteUsuario,
      tablaAfectada: 'sesiones_autenticacion', datosNuevos: { todasRevocadas: true }
    });
  });
}

export async function cambiarContrasena(
  payload: PayloadTokenAcceso,
  entrada: EntradaCambiarContrasena,
  contexto: ContextoSolicitud
): Promise<void> {
  const idUsuario = BigInt(payload.sub);
  await asegurarSesionDeAccesoActiva(payload);
  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario }, select: { contrasenaHash: true, estado: true, debeCambiarContrasena: true }
  });
  if (!usuario?.estado) throw new ErrorNoAutenticado();
  if (!(await compararContrasena(entrada.contrasenaActual, usuario.contrasenaHash))) {
    throw new ErrorNoAutenticado('La contrasena actual no es correcta');
  }
  validarPoliticaContrasena(entrada.contrasenaNueva);
  if (await compararContrasena(entrada.contrasenaNueva, usuario.contrasenaHash)) {
    throw new ErrorConflicto('La nueva contrasena debe ser diferente de la actual');
  }
  const nuevoHash = await generarHashContrasena(entrada.contrasenaNueva);
  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: idUsuario },
      data: { contrasenaHash: nuevoHash, contrasenaActualizadaEn: ahora, debeCambiarContrasena: false }
    });
    await tx.sesionAutenticacion.updateMany({
      where: { idUsuario, fechaRevocacion: null },
      data: { fechaRevocacion: ahora, motivoRevocacion: 'CAMBIO_CONTRASENA' }
    });
    await registrarAuditoriaSeguridad(tx, {
      accion: 'CAMBIO_CONTRASENA', modulo: 'AUTENTICACION', idUsuario,
      direccionIp: contexto.direccionIp, agenteUsuario: contexto.agenteUsuario,
      tablaAfectada: 'usuarios', idRegistro: idUsuario,
      datosAnteriores: { debeCambiarContrasena: usuario.debeCambiarContrasena },
      datosNuevos: { debeCambiarContrasena: false, sesionesRevocadas: true }
    });
  });
}
