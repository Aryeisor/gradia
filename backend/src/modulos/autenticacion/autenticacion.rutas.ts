import { Router } from 'express';
import { manejadorAsincrono } from '../../compartido/utilidades/manejador-asincrono.js';
import { cambiarContrasenaControlador, cerrarSesionControlador, cerrarTodasControlador, iniciarSesionControlador, renovarControlador, yoControlador } from './autenticacion.controlador.js';
import { crearLimitadorLogin } from './configuracion/limitador-login.js';
import { autenticar } from './autenticacion.middleware.js';

export function crearRutasAutenticacion() {
  const rutasAutenticacion = Router();
  rutasAutenticacion.post('/iniciar-sesion', crearLimitadorLogin(), manejadorAsincrono(iniciarSesionControlador));
  rutasAutenticacion.post('/renovar', manejadorAsincrono(renovarControlador));
  rutasAutenticacion.get('/yo', autenticar, manejadorAsincrono(yoControlador));
  rutasAutenticacion.post('/cerrar-sesion', autenticar, manejadorAsincrono(cerrarSesionControlador));
  rutasAutenticacion.post('/cerrar-todas', autenticar, manejadorAsincrono(cerrarTodasControlador));
  rutasAutenticacion.patch('/cambiar-contrasena', autenticar, manejadorAsincrono(cambiarContrasenaControlador));
  return rutasAutenticacion;
}
