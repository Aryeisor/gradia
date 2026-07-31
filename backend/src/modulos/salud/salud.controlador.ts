import { Request, Response } from 'express';
import { verificarSalud } from './salud.servicio.js';

export async function consultarSalud(_req: Request, res: Response) {
  const resultado = await verificarSalud();

  if (!resultado.baseDatosConectada) {
    return res.status(503).json({
      exito: false,
      mensaje: 'La API esta disponible, pero no fue posible conectar con PostgreSQL',
      errores: []
    });
  }

  return res.json({
    exito: true,
    mensaje: 'Servicios de Gradia disponibles',
    datos: {
      api: 'operativa',
      base_datos: 'conectada'
    }
  });
}
