import { describe, expect, it } from 'vitest';
import { obtenerOpcionesCookieRefresh } from '../src/modulos/autenticacion/utilidades/cookie-refresh.js';

describe('cookie de renovacion', () => {
  it('siempre es HttpOnly y limita su ruta', () => {
    const opciones = obtenerOpcionesCookieRefresh({ NODE_ENV: 'test', REFRESH_TOKEN_DIAS: 7 });
    expect(opciones).toMatchObject({ httpOnly: true, secure: false, sameSite: 'lax', path: '/api/autenticacion' });
    expect(opciones.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('es Secure en produccion', () => {
    expect(obtenerOpcionesCookieRefresh({ NODE_ENV: 'production', REFRESH_TOKEN_DIAS: 7 }).secure).toBe(true);
  });
});
