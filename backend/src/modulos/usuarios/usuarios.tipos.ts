import { CodigoRol } from '../autenticacion/tipos/autenticacion.tipos.js';

export type ContextoAdministracionUsuario = {
  idAdministrador: bigint;
  direccionIp?: string;
  agenteUsuario?: string;
};

export type PerfilUsuarioResumen =
  | { tipo: 'DOCENTE'; id: bigint; codigo: string; especialidad: string | null }
  | { tipo: 'ESTUDIANTE'; id: bigint; codigo: string }
  | null;

export type RolAdministrable = CodigoRol;
