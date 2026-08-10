import { z } from 'zod';

const texto = (maximo: number) => z.string().trim().min(1).max(maximo);
const textoOpcional = (maximo: number) => z.string().trim().max(maximo).nullable().optional();
const correo = z.string().trim().email().max(150).transform((valor) => valor.toLowerCase());
const codigoRol = z.enum(['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE']);

const perfilDocenteCreacion = z.object({
  codigoDocente: texto(30),
  especialidad: textoOpcional(150),
  telefono: textoOpcional(30)
}).strict();

const fechaNacimiento = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe usar el formato YYYY-MM-DD')
  .refine((valor) => {
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
  }, 'La fecha de nacimiento no es válida');

const perfilEstudianteCreacion = z.object({
  codigoEstudiante: texto(30),
  fechaNacimiento,
  telefono: textoOpcional(30),
  direccion: textoOpcional(200)
}).strict();

const entradaGeneralCreacion = {
  nombres: texto(100),
  apellidos: texto(100),
  tipoDocumento: texto(30),
  numeroDocumento: texto(30),
  correo,
  contrasenaTemporal: z.string().min(1).max(72)
};

export const esquemaCrearUsuario = z.discriminatedUnion('rol', [
  z.object({
    ...entradaGeneralCreacion,
    rol: z.literal('ADMINISTRADOR'),
    perfil: z.object({}).strict().optional()
  }).strict(),
  z.object({
    ...entradaGeneralCreacion,
    rol: z.literal('DOCENTE'),
    perfil: perfilDocenteCreacion
  }).strict(),
  z.object({
    ...entradaGeneralCreacion,
    rol: z.literal('ESTUDIANTE'),
    perfil: perfilEstudianteCreacion
  }).strict()
]);

const perfilEdicion = z.object({
  codigoDocente: texto(30).optional(),
  especialidad: textoOpcional(150),
  codigoEstudiante: texto(30).optional(),
  fechaNacimiento: fechaNacimiento.optional(),
  telefono: textoOpcional(30),
  direccion: textoOpcional(200)
}).strict();

export const esquemaActualizarUsuario = z.object({
  nombres: texto(100).optional(),
  apellidos: texto(100).optional(),
  tipoDocumento: texto(30).optional(),
  numeroDocumento: texto(30).optional(),
  correo: correo.optional(),
  perfil: perfilEdicion.optional()
}).strict().refine(
  (datos) => Object.keys(datos).some((clave) => clave !== 'perfil') ||
    (datos.perfil !== undefined && Object.keys(datos.perfil).length > 0),
  { message: 'Debe indicar al menos un campo para actualizar' }
);

export const esquemaCambiarEstadoUsuario = z.object({
  estado: z.boolean(),
  motivo: texto(500)
}).strict();

export const esquemaRestablecerContrasena = z.object({
  contrasenaTemporal: z.string().min(1).max(72),
  confirmacionContrasena: z.string().min(1).max(72)
}).strict().superRefine((datos, contexto) => {
  if (datos.contrasenaTemporal !== datos.confirmacionContrasena) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmacionContrasena'],
      message: 'La confirmación no coincide con la contraseña temporal'
    });
  }
});

export const esquemaParametrosUsuario = z.object({
  id: z.string().regex(/^\d+$/, 'El identificador no es válido').transform((valor) => BigInt(valor))
}).strict().refine(
  (datos) => datos.id > 0n && datos.id <= 9_223_372_036_854_775_807n,
  { message: 'El identificador no es válido', path: ['id'] }
);

export const esquemaConsultaUsuarios = z.object({
  pagina: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  buscar: z.string().trim().max(150).optional().transform((valor) => valor || undefined),
  rol: codigoRol.optional(),
  estado: z.enum(['true', 'false']).transform((valor) => valor === 'true').optional()
}).strict();

export type EntradaCrearUsuario = z.infer<typeof esquemaCrearUsuario>;
export type EntradaActualizarUsuario = z.infer<typeof esquemaActualizarUsuario>;
export type EntradaCambiarEstadoUsuario = z.infer<typeof esquemaCambiarEstadoUsuario>;
export type EntradaRestablecerContrasena = z.infer<typeof esquemaRestablecerContrasena>;
export type ConsultaUsuarios = z.infer<typeof esquemaConsultaUsuarios>;
