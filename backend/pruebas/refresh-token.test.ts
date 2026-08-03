import { describe, expect, it } from 'vitest';
import { calcularExpiracionRefreshToken, compararRefreshTokenConHash, generarHashRefreshToken, generarRefreshToken, validarFormatoRefreshToken } from '../src/modulos/autenticacion/servicios/refresh-token.servicio.js';

describe('refresh token opaco', () => {
  it('genera tokens criptograficos distintos y con formato valido', () => {
    const primero = generarRefreshToken();
    const segundo = generarRefreshToken();
    expect(validarFormatoRefreshToken(primero)).toBe(true);
    expect(primero).not.toBe(segundo);
  });

  it('produce un hash determinista y permite comparacion segura', () => {
    const token = generarRefreshToken();
    expect(generarHashRefreshToken(token)).toBe(generarHashRefreshToken(token));
    expect(compararRefreshTokenConHash(token, generarHashRefreshToken(token))).toBe(true);
    expect(compararRefreshTokenConHash(generarRefreshToken(), generarHashRefreshToken(token))).toBe(false);
  });

  it('calcula la expiracion sin mutar la fecha base', () => {
    const base = new Date('2026-08-02T10:00:00.000Z');
    expect(calcularExpiracionRefreshToken(base, 7).toISOString()).toBe('2026-08-09T10:00:00.000Z');
    expect(base.toISOString()).toBe('2026-08-02T10:00:00.000Z');
  });
});
