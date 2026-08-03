import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const opcionalVacio = <T extends z.ZodTypeAny>(esquema: T) =>
  z.preprocess((valor) => (valor === '' ? undefined : valor), esquema.optional());

export const esquemaEntorno = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PUERTO: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    ORIGEN_FRONTEND: z.string().url().default('http://localhost:5173'),
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRACION: z.string().regex(/^[1-9]\d*[smhd]$/).default('15m'),
    REFRESH_TOKEN_DIAS: z.coerce.number().int().positive().default(7),
    REFRESH_TOKEN_COOKIE: z.string().min(1).default('gradia_refresh_token'),
    MAX_INTENTOS_LOGIN: z.coerce.number().int().positive().default(5),
    MINUTOS_BLOQUEO_LOGIN: z.coerce.number().int().positive().default(15),
    BCRYPT_COSTO: z.coerce.number().int().min(10).max(14).default(12),
    ADMIN_INICIAL_CORREO: opcionalVacio(z.string().email()),
    ADMIN_INICIAL_CONTRASENA: opcionalVacio(z.string().min(12))
  })
  .superRefine((variables, contexto) => {
    const tieneCorreo = variables.ADMIN_INICIAL_CORREO !== undefined;
    const tieneContrasena = variables.ADMIN_INICIAL_CONTRASENA !== undefined;
    if (tieneCorreo !== tieneContrasena) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: tieneCorreo ? ['ADMIN_INICIAL_CONTRASENA'] : ['ADMIN_INICIAL_CORREO'],
        message: 'El correo y la contrasena del administrador inicial deben definirse juntos'
      });
    }
    if (variables.NODE_ENV === 'production' && variables.ADMIN_INICIAL_CONTRASENA) {
      const marcadorInseguro = /(cambiar|reemplazar|password|123456|administrador)/i;
      if (marcadorInseguro.test(variables.ADMIN_INICIAL_CONTRASENA)) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ADMIN_INICIAL_CONTRASENA'],
          message: 'La contrasena del administrador contiene un marcador inseguro'
        });
      }
    }
  });

export function validarVariablesEntorno(variables: NodeJS.ProcessEnv) {
  return esquemaEntorno.parse(variables);
}

const resultado = esquemaEntorno.safeParse(process.env);

if (!resultado.success) {
  const errores = resultado.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Variables de entorno invalidas: ${errores}`);
}

export const entorno = resultado.data;
