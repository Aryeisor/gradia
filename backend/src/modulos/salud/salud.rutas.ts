import { Router } from 'express';
import { consultarSalud } from './salud.controlador.js';
import { manejadorAsincrono } from '../../compartido/utilidades/manejador-asincrono.js';

export const rutasSalud = Router();

/**
 * @openapi
 * /api/salud:
 *   get:
 *     summary: Verifica API y conexion con PostgreSQL.
 */
rutasSalud.get('/', manejadorAsincrono(consultarSalud));
