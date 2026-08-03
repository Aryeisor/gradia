import { Router } from 'express';
import { rutasSalud } from '../modulos/salud/salud.rutas.js';
import { crearRutasAutenticacion } from '../modulos/autenticacion/autenticacion.rutas.js';
import { crearRutasUsuarios } from '../modulos/usuarios/usuarios.rutas.js';

export function crearRutasApi() {
  const rutasApi = Router();
  rutasApi.use('/salud', rutasSalud);
  rutasApi.use('/autenticacion', crearRutasAutenticacion());
  rutasApi.use('/usuarios', crearRutasUsuarios());
  return rutasApi;
}
