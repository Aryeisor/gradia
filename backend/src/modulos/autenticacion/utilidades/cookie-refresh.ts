import { CookieOptions, Response } from 'express';
import { entorno } from '../../../configuracion/entorno.js';

type ConfiguracionCookieRefresh = Pick<typeof entorno, 'NODE_ENV' | 'REFRESH_TOKEN_DIAS'>;

export function obtenerOpcionesCookieRefresh(configuracion: ConfiguracionCookieRefresh = entorno): CookieOptions {
  return {
    httpOnly: true,
    secure: configuracion.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/autenticacion',
    maxAge: configuracion.REFRESH_TOKEN_DIAS * 24 * 60 * 60 * 1000
  };
}

export function configurarCookieRefresh(res: Response, token: string): void {
  res.cookie(entorno.REFRESH_TOKEN_COOKIE, token, obtenerOpcionesCookieRefresh());
}

export function borrarCookieRefresh(res: Response): void {
  const opciones = { ...obtenerOpcionesCookieRefresh() };
  delete opciones.maxAge;
  res.clearCookie(entorno.REFRESH_TOKEN_COOKIE, opciones);
}
