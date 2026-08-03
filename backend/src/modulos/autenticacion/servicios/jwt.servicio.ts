import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { ErrorNoAutenticado } from '../../../compartido/errores/error-aplicacion.js';
import { entorno } from '../../../configuracion/entorno.js';
import { CodigoRol, codigosRol, PayloadTokenAcceso } from '../tipos/autenticacion.tipos.js';

const esquemaPayloadAcceso = z.object({
  sub: z.string().regex(/^\d+$/),
  rol: z.enum(codigosRol),
  sid: z.string().regex(/^\d+$/),
  tipo: z.literal('access'),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive()
}).strict();

export function generarTokenAcceso(datos: {
  idUsuario: bigint | string;
  codigoRol: CodigoRol;
  idSesion: bigint | string;
}): string {
  return jwt.sign(
    { rol: datos.codigoRol, sid: datos.idSesion.toString(), tipo: 'access' },
    entorno.JWT_SECRET,
    {
      subject: datos.idUsuario.toString(),
      expiresIn: entorno.JWT_ACCESS_EXPIRACION as SignOptions['expiresIn'],
      algorithm: 'HS256'
    }
  );
}

export function validarTokenAcceso(token: string): PayloadTokenAcceso {
  try {
    const payload = jwt.verify(token, entorno.JWT_SECRET, { algorithms: ['HS256'] });
    return esquemaPayloadAcceso.parse(payload);
  } catch {
    throw new ErrorNoAutenticado('Token de acceso invalido o vencido');
  }
}
