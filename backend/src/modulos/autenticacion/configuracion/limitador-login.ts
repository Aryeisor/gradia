import { rateLimit } from 'express-rate-limit';
import { entorno } from '../../../configuracion/entorno.js';
import { ErrorLimiteSolicitudes } from '../../../compartido/errores/error-aplicacion.js';

/** Preparado para el futuro POST /api/autenticacion/login; aun no se conecta a rutas. */
export function crearLimitadorLogin() {
  return rateLimit({
    windowMs: entorno.MINUTOS_BLOQUEO_LOGIN * 60 * 1000,
    limit: entorno.MAX_INTENTOS_LOGIN,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, _res, next) => next(new ErrorLimiteSolicitudes('Demasiados intentos de inicio de sesion. Intente mas tarde.'))
  });
}
