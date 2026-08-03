import bcrypt from 'bcrypt';
import { ErrorValidacion } from '../../../compartido/errores/error-aplicacion.js';
import { entorno } from '../../../configuracion/entorno.js';

const MAXIMO_BYTES_BCRYPT = 72;
const MARCADORES_INSEGUROS = /(cambiar|reemplazar|password|123456|administrador|qwerty|contrasena|contraseña|gradia)/i;

/** Valida la entrada exacta; nunca recorta ni modifica silenciosamente la contrasena. */
export function validarPoliticaContrasena(contrasena: string): void {
  if (!contrasena || contrasena.trim().length === 0) {
    throw new ErrorValidacion('La contrasena no puede estar vacia');
  }
  if (contrasena !== contrasena.trim()) {
    throw new ErrorValidacion('La contrasena no puede comenzar ni terminar con espacios');
  }
  if (Array.from(contrasena).length < 12) {
    throw new ErrorValidacion('La contrasena debe tener al menos 12 caracteres');
  }
  if (Buffer.byteLength(contrasena, 'utf8') > MAXIMO_BYTES_BCRYPT) {
    throw new ErrorValidacion('La contrasena supera el maximo de 72 bytes compatible con bcrypt');
  }
  if (MARCADORES_INSEGUROS.test(contrasena)) {
    throw new ErrorValidacion('La contrasena contiene un valor evidentemente inseguro');
  }
}

export async function generarHashContrasena(contrasena: string): Promise<string> {
  validarPoliticaContrasena(contrasena);
  return bcrypt.hash(contrasena, entorno.BCRYPT_COSTO);
}

export async function compararContrasena(contrasena: string, hashInterno: string): Promise<boolean> {
  if (!contrasena || !hashInterno) return false;
  return bcrypt.compare(contrasena, hashInterno);
}
