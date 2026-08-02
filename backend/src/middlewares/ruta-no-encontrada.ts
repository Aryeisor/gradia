import { NextFunction, Request, Response } from 'express';
import { ErrorNoEncontrado } from '../compartido/errores/error-aplicacion.js';

export function rutaNoEncontrada(_req: Request, _res: Response, next: NextFunction) {
  next(new ErrorNoEncontrado('Ruta no encontrada'));
}
