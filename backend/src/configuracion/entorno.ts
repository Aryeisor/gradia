import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const esquemaEntorno = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  ORIGEN_FRONTEND: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRACION: z.string().default('8h'),
  ADMIN_INICIAL_CORREO: z.string().email().optional(),
  ADMIN_INICIAL_CONTRASENA: z.string().min(8).optional()
});

const resultado = esquemaEntorno.safeParse(process.env);

if (!resultado.success) {
  const errores = resultado.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Variables de entorno invalidas: ${errores}`);
}

export const entorno = resultado.data;
