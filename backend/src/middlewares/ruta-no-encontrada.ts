import { Request, Response } from 'express';

export function rutaNoEncontrada(_req: Request, res: Response) {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada',
    errores: []
  });
}
