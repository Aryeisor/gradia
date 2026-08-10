import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorNoAutenticado, ErrorValidacion } from '../../compartido/errores/error-aplicacion.js';
import { responderExito } from '../../compartido/respuestas/respuesta-api.js';
import {
  esquemaActualizarUsuario,
  esquemaCambiarEstadoUsuario,
  esquemaConsultaUsuarios,
  esquemaCrearUsuario,
  esquemaParametrosUsuario,
  esquemaRestablecerContrasena
} from './usuarios.esquemas.js';
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  consultarUsuario,
  crearUsuario,
  listarUsuarios,
  restablecerContrasenaUsuario
} from './usuarios.servicio.js';
import { ContextoAdministracionUsuario } from './usuarios.tipos.js';

function validarEntrada<T>(esquema: { parse(valor: unknown): T }, valor: unknown): T {
  try {
    return esquema.parse(valor);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ErrorValidacion(
        'Los datos enviados no son válidos',
        error.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }))
      );
    }
    throw error;
  }
}

function contexto(req: Request): ContextoAdministracionUsuario {
  if (!req.usuarioAutenticado) {
    throw new ErrorNoAutenticado('Autenticación requerida', 'AUTENTICACION_REQUERIDA');
  }
  return {
    idAdministrador: req.usuarioAutenticado.id,
    direccionIp: req.ip,
    agenteUsuario: req.get('user-agent')
  };
}

function idUsuario(req: Request): bigint {
  return validarEntrada(esquemaParametrosUsuario, req.params).id;
}

export async function listarUsuariosControlador(req: Request, res: Response) {
  const consulta = validarEntrada(esquemaConsultaUsuarios, req.query);
  const resultado = await listarUsuarios(consulta);
  return responderExito(res, 'Usuarios consultados correctamente', resultado);
}

export async function consultarUsuarioControlador(req: Request, res: Response) {
  const usuario = await consultarUsuario(idUsuario(req));
  return responderExito(res, 'Usuario consultado correctamente', { usuario });
}

export async function crearUsuarioControlador(req: Request, res: Response) {
  const entrada = validarEntrada(esquemaCrearUsuario, req.body);
  const usuario = await crearUsuario(entrada, contexto(req));
  return responderExito(res, 'Usuario creado correctamente', { usuario }, 201);
}

export async function actualizarUsuarioControlador(req: Request, res: Response) {
  const entrada = validarEntrada(esquemaActualizarUsuario, req.body);
  const usuario = await actualizarUsuario(idUsuario(req), entrada, contexto(req));
  return responderExito(res, 'Usuario actualizado correctamente', { usuario });
}

export async function cambiarEstadoUsuarioControlador(req: Request, res: Response) {
  const entrada = validarEntrada(esquemaCambiarEstadoUsuario, req.body);
  const usuario = await cambiarEstadoUsuario(idUsuario(req), entrada, contexto(req));
  return responderExito(
    res,
    entrada.estado ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente',
    { usuario }
  );
}

export async function restablecerContrasenaControlador(req: Request, res: Response) {
  const entrada = validarEntrada(esquemaRestablecerContrasena, req.body);
  await restablecerContrasenaUsuario(idUsuario(req), entrada, contexto(req));
  return responderExito(res, 'Contraseña restablecida. El usuario deberá cambiarla al iniciar sesión');
}
