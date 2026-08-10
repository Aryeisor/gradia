import { z } from 'zod';

const texto = (etiqueta: string, maximo: number) => z.string().trim()
  .min(1, `${etiqueta} es obligatorio`)
  .max(maximo, `${etiqueta} no puede superar ${maximo} caracteres`);

const opcional = (maximo: number) => z.string().trim().max(maximo).optional();

export const esquemaContrasenaTemporal = z.string()
  .min(12, 'Debe contener al menos 12 caracteres')
  .max(72, 'No puede superar 72 caracteres')
  .refine((valor) => valor === valor.trim(), 'No puede iniciar ni terminar con espacios')
  .refine(
    (valor) => !/(cambiar|reemplazar|password|123456|administrador|qwerty|contrasena|gradia)/i.test(valor),
    'Contiene un valor inseguro'
  );

export const esquemaFormularioUsuario = z.object({
  nombres: texto('Los nombres', 100),
  apellidos: texto('Los apellidos', 100),
  tipoDocumento: texto('El tipo de documento', 30),
  numeroDocumento: texto('El número de documento', 30),
  correo: z.string().trim().email('Ingrese un correo válido').max(150),
  rol: z.enum(['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE']),
  contrasenaTemporal: z.string().optional(),
  confirmacionContrasena: z.string().optional(),
  codigoDocente: opcional(30),
  especialidad: opcional(150),
  telefono: opcional(30),
  codigoEstudiante: opcional(30),
  fechaNacimiento: z.string().optional(),
  direccion: opcional(200)
}).superRefine((datos, contexto) => {
  if (datos.rol === 'DOCENTE' && !datos.codigoDocente?.trim()) {
    contexto.addIssue({ code: 'custom', path: ['codigoDocente'], message: 'El código docente es obligatorio' });
  }
  if (datos.rol === 'ESTUDIANTE') {
    if (!datos.codigoEstudiante?.trim()) {
      contexto.addIssue({ code: 'custom', path: ['codigoEstudiante'], message: 'El código estudiantil es obligatorio' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaNacimiento ?? '')) {
      contexto.addIssue({ code: 'custom', path: ['fechaNacimiento'], message: 'La fecha de nacimiento es obligatoria' });
    }
  }
});

export const esquemaCrearUsuario = esquemaFormularioUsuario.superRefine((datos, contexto) => {
  const resultado = esquemaContrasenaTemporal.safeParse(datos.contrasenaTemporal ?? '');
  if (!resultado.success) {
    contexto.addIssue({
      code: 'custom',
      path: ['contrasenaTemporal'],
      message: resultado.error.issues[0]?.message ?? 'La contraseña temporal no es válida'
    });
  }
  if (datos.contrasenaTemporal !== datos.confirmacionContrasena) {
    contexto.addIssue({ code: 'custom', path: ['confirmacionContrasena'], message: 'Las contraseñas no coinciden' });
  }
});

export const esquemaEstadoUsuario = z.object({
  motivo: texto('El motivo', 500)
});

export const esquemaRestablecerContrasena = z.object({
  contrasenaTemporal: esquemaContrasenaTemporal,
  confirmacionContrasena: z.string().min(1, 'Confirme la contraseña temporal')
}).refine((datos) => datos.contrasenaTemporal === datos.confirmacionContrasena, {
  path: ['confirmacionContrasena'],
  message: 'Las contraseñas no coinciden'
});

export type DatosFormularioUsuario = z.infer<typeof esquemaFormularioUsuario>;
export type DatosEstadoUsuario = z.infer<typeof esquemaEstadoUsuario>;
export type DatosRestablecerContrasena = z.infer<typeof esquemaRestablecerContrasena>;
