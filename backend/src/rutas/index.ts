import { Router } from 'express';
import { rutasSalud } from '../modulos/salud/salud.rutas.js';
import { rutasAutenticacion } from '../modulos/autenticacion/autenticacion.rutas.js';

export const rutasApi = Router();

rutasApi.use('/salud', rutasSalud);
rutasApi.use('/autenticacion', rutasAutenticacion);
