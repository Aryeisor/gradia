import { z } from 'zod';

const correo = z.string().trim().email().max(150).transform((valor) => valor.toLowerCase());

export const esquemaIniciarSesion = z.object({
  correo,
  contrasena: z.string().min(1).max(72)
}).strict();

export const esquemaCambiarContrasena = z.object({
  contrasenaActual: z.string().min(1).max(72),
  contrasenaNueva: z.string().min(1).max(72),
  confirmacionContrasena: z.string().min(1).max(72)
}).strict().superRefine((datos, contexto) => {
  if (datos.contrasenaNueva !== datos.confirmacionContrasena) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmacionContrasena'],
      message: 'La confirmacion no coincide con la nueva contrasena'
    });
  }
});

export type EntradaIniciarSesion = z.infer<typeof esquemaIniciarSesion>;
export type EntradaCambiarContrasena = z.infer<typeof esquemaCambiarContrasena>;
