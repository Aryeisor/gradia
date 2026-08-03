import { NextFunction, Request, Response } from 'express';
import {
  ErrorNoAutenticado,
  ErrorSinPermisos
} from '../../compartido/errores/error-aplicacion.js';
import { prisma } from '../../infraestructura/prisma/cliente-prisma.js';
import { validarTokenAcceso } from './servicios/jwt.servicio.js';
import { CodigoRol, esCodigoRol } from './tipos/autenticacion.tipos.js';
import { UsuarioAutenticado } from './tipos/control-acceso.tipos.js';

function extraerBearer(req: Request): string {
  const autorizacion = req.header('authorization');
  if (!autorizacion) {
    throw new ErrorNoAutenticado('Autenticacion requerida', 'AUTENTICACION_REQUERIDA');
  }
  const coincidencia = /^Bearer ([^\s]+)$/.exec(autorizacion);
  if (!coincidencia) {
    throw new ErrorNoAutenticado('La cabecera de autenticacion no es valida', 'TOKEN_INVALIDO');
  }
  return coincidencia[1];
}

function convertirIdentificador(valor: string): bigint {
  try {
    const id = BigInt(valor);
    if (id <= 0n) throw new Error();
    return id;
  } catch {
    throw new ErrorNoAutenticado('El token de acceso no es valido', 'TOKEN_INVALIDO');
  }
}

function contrasenaCambioDespuesDeEmision(fecha: Date | null, emitidoEnSegundos: number): boolean {
  if (!fecha) return false;
  // JWT pierde los milisegundos: el segundo de emision se trata como una unidad indivisible.
  const primerMilisegundoPosterior = (emitidoEnSegundos + 1) * 1000;
  return fecha.getTime() >= primerMilisegundoPosterior;
}

export async function resolverUsuarioAutenticado(token: string): Promise<UsuarioAutenticado> {
  const payload = validarTokenAcceso(token);
  const idUsuario = convertirIdentificador(payload.sub);
  const idSesion = convertirIdentificador(payload.sid);

  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: {
      id: true,
      estado: true,
      debeCambiarContrasena: true,
      contrasenaActualizadaEn: true,
      rol: { select: { codigo: true } }
    }
  });
  if (!usuario || !usuario.estado) {
    throw new ErrorNoAutenticado('La cuenta no esta disponible', 'USUARIO_INACTIVO');
  }
  if (!esCodigoRol(usuario.rol.codigo)) {
    throw new ErrorNoAutenticado('La cuenta no tiene un rol valido', 'CREDENCIALES_DESACTUALIZADAS');
  }

  const sesion = await prisma.sesionAutenticacion.findUnique({
    where: { id: idSesion },
    select: { id: true, idUsuario: true, fechaRevocacion: true, fechaExpiracion: true }
  });
  if (
    !sesion ||
    sesion.idUsuario !== idUsuario ||
    sesion.fechaRevocacion !== null ||
    sesion.fechaExpiracion <= new Date()
  ) {
    throw new ErrorNoAutenticado('La sesion no es valida', 'SESION_INVALIDA');
  }
  if (contrasenaCambioDespuesDeEmision(usuario.contrasenaActualizadaEn, payload.iat)) {
    throw new ErrorNoAutenticado(
      'Las credenciales cambiaron. Inicie sesion nuevamente',
      'CREDENCIALES_DESACTUALIZADAS'
    );
  }

  return {
    id: usuario.id,
    rol: usuario.rol.codigo,
    idSesion: sesion.id,
    debeCambiarContrasena: usuario.debeCambiarContrasena
  };
}

export async function autenticar(req: Request, _res: Response, next: NextFunction): Promise<void> {
  void _res;
  try {
    req.usuarioAutenticado = await resolverUsuarioAutenticado(extraerBearer(req));
    next();
  } catch (error) {
    next(error);
  }
}

export function autorizarRoles(...rolesPermitidos: CodigoRol[]) {
  const permitidos = new Set<CodigoRol>(rolesPermitidos);
  return (req: Request, _res: Response, next: NextFunction): void => {
    void _res;
    if (!req.usuarioAutenticado) {
      next(new ErrorNoAutenticado('Autenticacion requerida', 'AUTENTICACION_REQUERIDA'));
      return;
    }
    if (!permitidos.has(req.usuarioAutenticado.rol)) {
      next(new ErrorSinPermisos('El rol actual no permite realizar esta accion', 'ROL_NO_AUTORIZADO'));
      return;
    }
    next();
  };
}

export function exigirContrasenaActualizada(req: Request, _res: Response, next: NextFunction): void {
  void _res;
  if (!req.usuarioAutenticado) {
    next(new ErrorNoAutenticado('Autenticacion requerida', 'AUTENTICACION_REQUERIDA'));
    return;
  }
  if (req.usuarioAutenticado.debeCambiarContrasena) {
    next(new ErrorSinPermisos(
      'Debe cambiar la contrasena antes de continuar',
      'CAMBIO_CONTRASENA_REQUERIDO'
    ));
    return;
  }
  next();
}
