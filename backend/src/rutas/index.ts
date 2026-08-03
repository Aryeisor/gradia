import { Router } from 'express';
import { rutasSalud } from '../modulos/salud/salud.rutas.js';
import { crearRutasAutenticacion } from '../modulos/autenticacion/autenticacion.rutas.js';

export function crearRutasApi() {
  const rutasApi = Router();
  rutasApi.use('/salud', rutasSalud);
  rutasApi.use('/autenticacion', crearRutasAutenticacion());
  return rutasApi;
}
