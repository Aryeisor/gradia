export type Id = string;

export type CodigoRol = 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE';

export type EstadoAutenticacion = 'inicializando' | 'autenticado' | 'no_autenticado';

export type UsuarioAutenticado = {
  id: Id;
  nombres: string;
  apellidos: string;
  correo: string;
  debeCambiarContrasena: boolean;
  rol: {
    codigo: CodigoRol;
    nombre: string;
  };
  docente?: null | {
    id: Id;
    codigoDocente: string;
    especialidad: string | null;
    estado: string;
  };
  estudiante?: null | {
    id: Id;
    codigoEstudiante: string;
    estado: string;
  };
};

export type RespuestaApi<T> = {
  exito: boolean;
  mensaje: string;
  datos: T;
};

export type ErrorApi = {
  exito: false;
  mensaje: string;
  codigo?: string;
  errores: Array<{ campo?: string; mensaje?: string }>;
};

export type CredencialesInicioSesion = {
  correo: string;
  contrasena: string;
};

export type EntradaCambioContrasena = {
  contrasenaActual: string;
  contrasenaNueva: string;
  confirmacionContrasena: string;
};
