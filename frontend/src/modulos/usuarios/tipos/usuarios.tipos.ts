import { CodigoRol, Id } from '../../autenticacion/tipos/autenticacion.tipos';

export type EstadoFiltro = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';
export type RolFiltro = 'TODOS' | CodigoRol;

export type RolUsuario = {
  codigo: CodigoRol;
  nombre: string;
};

export type PerfilDocente = {
  id: Id;
  codigoDocente: string;
  especialidad: string | null;
  telefono?: string | null;
  estado: string;
  creadoEn?: string;
  actualizadoEn?: string;
};

export type PerfilEstudiante = {
  id: Id;
  codigoEstudiante: string;
  fechaNacimiento?: string;
  telefono?: string | null;
  direccion?: string | null;
  estado: string;
  creadoEn?: string;
  actualizadoEn?: string;
};

export type UsuarioResumen = {
  id: Id;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  estado: boolean;
  ultimoAcceso: string | null;
  debeCambiarContrasena: boolean;
  creadoEn: string;
  actualizadoEn: string;
  rol: RolUsuario;
  docente: PerfilDocente | null;
  estudiante: PerfilEstudiante | null;
};

export type UsuarioDetalle = UsuarioResumen;

export type ConsultaUsuarios = {
  pagina: number;
  limite: number;
  buscar: string;
  rol: RolFiltro;
  estado: EstadoFiltro;
};

export type ResultadoUsuarios = {
  usuarios: UsuarioResumen[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
};

export type EntradaCrearUsuario = {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  contrasenaTemporal: string;
  rol: CodigoRol;
  perfil?: EntradaPerfilDocente | EntradaPerfilEstudiante;
};

export type EntradaPerfilDocente = {
  codigoDocente: string;
  especialidad: string | null;
  telefono: string | null;
};

export type EntradaPerfilEstudiante = {
  codigoEstudiante: string;
  fechaNacimiento: string;
  telefono: string | null;
  direccion: string | null;
};

export type EntradaActualizarUsuario = Omit<EntradaCrearUsuario, 'contrasenaTemporal' | 'rol'>;

export type EntradaEstadoUsuario = {
  estado: boolean;
  motivo: string;
};

export type EntradaRestablecerContrasena = {
  contrasenaTemporal: string;
  confirmacionContrasena: string;
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
  errores?: Array<{ campo?: string; mensaje?: string }>;
};
