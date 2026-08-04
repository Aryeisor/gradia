import { CodigoRol } from './tipos/autenticacion.tipos.js';

export type ContextoSolicitud = {
  direccionIp?: string;
  agenteUsuario?: string;
};

export type UsuarioAutenticadoSeguro = {
  id: bigint;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: { codigo: CodigoRol; nombre: string };
  debeCambiarContrasena: boolean;
};

export type UsuarioActualSeguro = UsuarioAutenticadoSeguro & {
  estudiante: null | {
    id: bigint;
    codigoEstudiante: string;
    estado: string;
  };
  docente: null | {
    id: bigint;
    codigoDocente: string;
    especialidad: string | null;
    estado: string;
  };
};
