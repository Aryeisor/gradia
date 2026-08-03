import { Router } from 'express';
import { manejadorAsincrono } from '../../compartido/utilidades/manejador-asincrono.js';
import { cambiarContrasenaControlador, cerrarSesionControlador, cerrarTodasControlador, iniciarSesionControlador, renovarControlador, yoControlador } from './autenticacion.controlador.js';
import { crearLimitadorLogin } from './configuracion/limitador-login.js';
import { validarAccessTokenInterno } from './autenticacion.middleware.js';

export function crearRutasAutenticacion() {
  const rutasAutenticacion = Router();
  rutasAutenticacion.post('/iniciar-sesion', crearLimitadorLogin(), manejadorAsincrono(iniciarSesionControlador));
  rutasAutenticacion.post('/renovar', manejadorAsincrono(renovarControlador));
  rutasAutenticacion.get('/yo', validarAccessTokenInterno, manejadorAsincrono(yoControlador));
  rutasAutenticacion.post('/cerrar-sesion', validarAccessTokenInterno, manejadorAsincrono(cerrarSesionControlador));
  rutasAutenticacion.post('/cerrar-todas', validarAccessTokenInterno, manejadorAsincrono(cerrarTodasControlador));
  rutasAutenticacion.patch('/cambiar-contrasena', validarAccessTokenInterno, manejadorAsincrono(cambiarContrasenaControlador));
  return rutasAutenticacion;
}
