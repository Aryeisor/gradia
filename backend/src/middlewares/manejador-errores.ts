import { NextFunction, Request, Response } from 'express';
import { logger } from '../configuracion/logger.js';

export function manejadorErrores(error: Error, _req: Request, res: Response, _next: NextFunction) {
  void _next;
  logger.error({ error }, 'Error no controlado');
  res.status(500).json({
    exito: false,
    mensaje: 'Ocurrio un error interno',
    errores: []
  });
}
