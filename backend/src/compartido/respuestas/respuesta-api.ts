import { Response } from 'express';
import { serializarDatos } from './serializar-datos.js';

export function responderExito(
  res: Response,
  mensaje: string,
  datos?: unknown,
  codigoHttp = 200
) {
  return res.status(codigoHttp).json(
    serializarDatos({
      exito: true,
      mensaje,
      ...(datos === undefined ? {} : { datos })
    })
  );
}

export function responderError(
  res: Response,
  codigoHttp: number,
  mensaje: string,
  opciones: { errores?: unknown[]; codigo?: string; datos?: unknown } = {}
) {
  return res.status(codigoHttp).json(
    serializarDatos({
      exito: false,
      mensaje,
      ...(opciones.datos === undefined ? {} : { datos: opciones.datos }),
      errores: opciones.errores ?? [],
      ...(opciones.codigo ? { codigo: opciones.codigo } : {})
    })
  );
}
