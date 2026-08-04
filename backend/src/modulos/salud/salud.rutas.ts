import { Router } from 'express';
import { consultarSalud } from './salud.controlador.js';
import { manejadorAsincrono } from '../../compartido/utilidades/manejador-asincrono.js';

export const rutasSalud = Router();

/**
 * @openapi
 * /api/salud:
 *   get:
 *     tags: [Salud]
 *     summary: Verifica API y conexion con PostgreSQL.
 *     description: Endpoint publico para comprobar disponibilidad basica sin credenciales.
 *     responses:
 *       '200':
 *         description: API y PostgreSQL disponibles.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - { $ref: '#/components/schemas/RespuestaExitosa' }
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       type: object
 *                       properties:
 *                         api: { type: string, example: operativa }
 *                         baseDatos: { type: string, example: conectada }
 *       '503':
 *         description: Express responde, pero PostgreSQL no esta disponible.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorApi' }
 */
rutasSalud.get('/', manejadorAsincrono(consultarSalud));
