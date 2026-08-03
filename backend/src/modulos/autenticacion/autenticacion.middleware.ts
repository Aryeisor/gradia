import { NextFunction, Request, Response } from 'express';
import { ErrorNoAutenticado } from '../../compartido/errores/error-aplicacion.js';
import { validarTokenAcceso } from './servicios/jwt.servicio.js';
import { SolicitudAutenticada } from './autenticacion.tipos.js';

export function validarAccessTokenInterno(req: Request, _res: Response, next: NextFunction): void {
  void _res;
  try {
    const autorizacion = req.header('authorization');
    if (!autorizacion?.startsWith('Bearer ')) throw new ErrorNoAutenticado();
    const token = autorizacion.slice(7).trim();
    if (!token) throw new ErrorNoAutenticado();
    (req as SolicitudAutenticada).autenticacion = validarTokenAcceso(token);
    next();
  } catch (error) {
    next(error);
  }
}
