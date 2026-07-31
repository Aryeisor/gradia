import { Router } from 'express';
import { rutasSalud } from '../modulos/salud/salud.rutas.js';

export const rutasApi = Router();

rutasApi.use('/salud', rutasSalud);
