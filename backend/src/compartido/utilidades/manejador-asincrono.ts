import { NextFunction, Request, RequestHandler, Response } from 'express';

type ControladorAsincrono = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown | Promise<unknown>;

/** Propaga al middleware de errores cualquier rechazo de un controlador asincrono. */
export function manejadorAsincrono(controlador: ControladorAsincrono): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(controlador(req, res, next)).catch(next);
  };
}
