import { Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ErrorNoAutenticado, ErrorValidacion } from '../../compartido/errores/error-aplicacion.js';
import { responderExito } from '../../compartido/respuestas/respuesta-api.js';
import { entorno } from '../../configuracion/entorno.js';
import { esquemaCambiarContrasena, esquemaIniciarSesion } from './autenticacion.esquemas.js';
import { SolicitudAutenticada } from './autenticacion.tipos.js';
import { borrarCookieRefresh, configurarCookieRefresh } from './utilidades/cookie-refresh.js';
import { cambiarContrasena, cerrarSesionActual, cerrarTodasLasSesiones, consultarUsuarioActual, iniciarSesion, renovarAutenticacion } from './autenticacion.servicio.js';

function validarEntrada<T>(esquema: ZodSchema<T>, valor: unknown): T {
  try {
    return esquema.parse(valor);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ErrorValidacion('Los datos enviados no son validos', error.issues.map((issue) => ({
        campo: issue.path.join('.'), mensaje: issue.message
      })));
    }
    throw error;
  }
}

function contexto(req: Request) {
  return { direccionIp: req.ip, agenteUsuario: req.get('user-agent') };
}

function payload(req: Request) {
  return (req as SolicitudAutenticada).autenticacion;
}

export async function iniciarSesionControlador(req: Request, res: Response) {
  const entrada = validarEntrada(esquemaIniciarSesion, req.body);
  const resultado = await iniciarSesion(entrada, contexto(req));
  configurarCookieRefresh(res, resultado.refreshToken);
  return responderExito(res, 'Inicio de sesion correcto', {
    tokenAcceso: resultado.tokenAcceso,
    usuario: resultado.usuario
  });
}

export async function renovarControlador(req: Request, res: Response) {
  const token = req.cookies?.[entorno.REFRESH_TOKEN_COOKIE];
  if (typeof token !== 'string') {
    borrarCookieRefresh(res);
    throw new ErrorNoAutenticado('No existe una sesion de renovacion');
  }
  try {
    const resultado = await renovarAutenticacion(token, contexto(req));
    configurarCookieRefresh(res, resultado.refreshToken);
    return responderExito(res, 'Sesion renovada correctamente', { tokenAcceso: resultado.tokenAcceso });
  } catch (error) {
    borrarCookieRefresh(res);
    throw error;
  }
}

export async function yoControlador(req: Request, res: Response) {
  const usuario = await consultarUsuarioActual(payload(req));
  return responderExito(res, 'Usuario autenticado', { usuario });
}

export async function cerrarSesionControlador(req: Request, res: Response) {
  await cerrarSesionActual(payload(req), contexto(req));
  borrarCookieRefresh(res);
  return responderExito(res, 'Sesion cerrada correctamente');
}

export async function cerrarTodasControlador(req: Request, res: Response) {
  await cerrarTodasLasSesiones(payload(req), contexto(req));
  borrarCookieRefresh(res);
  return responderExito(res, 'Todas las sesiones fueron cerradas');
}

export async function cambiarContrasenaControlador(req: Request, res: Response) {
  const entrada = validarEntrada(esquemaCambiarContrasena, req.body);
  await cambiarContrasena(payload(req), entrada, contexto(req));
  borrarCookieRefresh(res);
  return responderExito(res, 'Contrasena actualizada. Inicie sesion nuevamente');
}
