import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { entorno } from '../../../configuracion/entorno.js';

const BYTES_ENTROPIA = 48;
const PATRON_TOKEN = /^[A-Za-z0-9_-]{64}$/;

export function generarRefreshToken(): string {
  return randomBytes(BYTES_ENTROPIA).toString('base64url');
}

export function validarFormatoRefreshToken(token: string): boolean {
  return PATRON_TOKEN.test(token);
}

export function generarHashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function compararRefreshTokenConHash(token: string, hashEsperado: string): boolean {
  if (!validarFormatoRefreshToken(token) || !/^[a-f0-9]{64}$/.test(hashEsperado)) return false;
  const hashRecibido = Buffer.from(generarHashRefreshToken(token), 'hex');
  const hashGuardado = Buffer.from(hashEsperado, 'hex');
  return timingSafeEqual(hashRecibido, hashGuardado);
}

export function calcularExpiracionRefreshToken(desde = new Date(), dias = entorno.REFRESH_TOKEN_DIAS): Date {
  return new Date(desde.getTime() + dias * 24 * 60 * 60 * 1000);
}
