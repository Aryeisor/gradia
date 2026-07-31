import { Router } from 'express';
import { consultarSalud } from './salud.controlador.js';

export const rutasSalud = Router();

/**
 * @openapi
 * /api/salud:
 *   get:
 *     summary: Verifica API y conexion con PostgreSQL.
 */
rutasSalud.get('/', consultarSalud);
