import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ErrorAplicacion } from '../compartido/errores/error-aplicacion.js';
import { responderError } from '../compartido/respuestas/respuesta-api.js';
import { logger } from '../configuracion/logger.js';

function normalizarError(error: unknown): ErrorAplicacion {
  if (error instanceof ErrorAplicacion) return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new ErrorAplicacion('Ya existe un registro con los datos indicados', 409, {
        codigoInterno: 'REGISTRO_DUPLICADO',
        causa: error
      });
    }
    if (error.code === 'P2025') {
      return new ErrorAplicacion('El recurso solicitado no existe', 404, {
        codigoInterno: 'REGISTRO_NO_ENCONTRADO',
        causa: error
      });
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new ErrorAplicacion('No fue posible conectar con el servicio de datos', 503, {
      codigoInterno: 'BASE_DATOS_NO_DISPONIBLE',
      causa: error
    });
  }
  return new ErrorAplicacion('Ocurrio un error interno', 500, {
    codigoInterno: 'ERROR_INTERNO',
    esOperacional: false,
    causa: error
  });
}

export function manejadorErrores(error: unknown, req: Request, res: Response, _next: NextFunction) {
  void _next;
  const errorApi = normalizarError(error);
  const contexto = { error, metodo: req.method, ruta: req.originalUrl };
  if (errorApi.esOperacional) logger.warn(contexto, errorApi.message);
  else logger.error(contexto, 'Error no controlado');

  return responderError(res, errorApi.codigoHttp, errorApi.message, {
    errores: errorApi.detalles
      ? Array.isArray(errorApi.detalles)
        ? errorApi.detalles
        : [errorApi.detalles]
      : [],
    codigo: errorApi.codigoInterno
  });
}
