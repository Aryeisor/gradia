import { Router } from 'express';
import { manejadorAsincrono } from '../../compartido/utilidades/manejador-asincrono.js';
import {
  autenticar,
  autorizarRoles,
  exigirContrasenaActualizada
} from '../autenticacion/autenticacion.middleware.js';
import {
  actualizarUsuarioControlador,
  cambiarEstadoUsuarioControlador,
  consultarUsuarioControlador,
  crearUsuarioControlador,
  listarUsuariosControlador,
  restablecerContrasenaControlador
} from './usuarios.controlador.js';

export function crearRutasUsuarios() {
  const rutasUsuarios = Router();
  rutasUsuarios.use(
    autenticar,
    exigirContrasenaActualizada,
    autorizarRoles('ADMINISTRADOR')
  );
  rutasUsuarios.get('/', manejadorAsincrono(listarUsuariosControlador));
  rutasUsuarios.post('/', manejadorAsincrono(crearUsuarioControlador));
  rutasUsuarios.get('/:id', manejadorAsincrono(consultarUsuarioControlador));
  rutasUsuarios.patch('/:id', manejadorAsincrono(actualizarUsuarioControlador));
  rutasUsuarios.patch('/:id/estado', manejadorAsincrono(cambiarEstadoUsuarioControlador));
  rutasUsuarios.post(
    '/:id/restablecer-contrasena',
    manejadorAsincrono(restablecerContrasenaControlador)
  );
  return rutasUsuarios;
}
