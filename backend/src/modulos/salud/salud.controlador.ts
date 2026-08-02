import { Request, Response } from 'express';
import { verificarSalud } from './salud.servicio.js';
import { responderError, responderExito } from '../../compartido/respuestas/respuesta-api.js';

export async function consultarSalud(_req: Request, res: Response) {
  const resultado = await verificarSalud();

  if (!resultado.baseDatosConectada) {
    return responderError(res, 503, 'La API esta disponible, pero no fue posible conectar con PostgreSQL', {
      datos: { api: 'operativa', baseDatos: 'desconectada' }
    });
  }

  return responderExito(res, 'Servicios de Gradia disponibles', {
    api: 'operativa',
    baseDatos: 'conectada'
  });
}
