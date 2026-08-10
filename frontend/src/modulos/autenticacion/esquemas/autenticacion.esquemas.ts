import { z } from 'zod';

export const esquemaInicioSesion = z.object({
  correo: z.string().trim().email('Ingrese un correo válido').max(150)
    .transform((valor) => valor.toLowerCase()),
  contrasena: z.string().min(1, 'La contraseña es obligatoria').max(72)
});

const contrasenaNueva = z.string()
  .min(12, 'Debe contener al menos 12 caracteres')
  .max(72, 'No puede superar 72 caracteres')
  .refine((valor) => valor === valor.trim(), 'No puede iniciar ni terminar con espacios')
  .refine(
    (valor) => !/(cambiar|reemplazar|password|123456|administrador|qwerty|contrasena|gradia)/i.test(valor),
    'Contiene un valor inseguro'
  );

export const esquemaCambioContrasena = z.object({
  contrasenaActual: z.string().min(1, 'La contraseña actual es obligatoria').max(72),
  contrasenaNueva,
  confirmacionContrasena: z.string().min(1, 'Confirme la nueva contraseña').max(72)
}).superRefine((datos, contexto) => {
  if (datos.contrasenaNueva !== datos.confirmacionContrasena) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmacionContrasena'],
      message: 'La confirmación no coincide con la nueva contraseña'
    });
  }
});

export type DatosInicioSesion = z.infer<typeof esquemaInicioSesion>;
export type DatosCambioContrasena = z.infer<typeof esquemaCambioContrasena>;
