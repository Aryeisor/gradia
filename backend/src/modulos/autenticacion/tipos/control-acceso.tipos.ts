import { CodigoRol } from './autenticacion.tipos.js';

export interface UsuarioAutenticado {
  id: bigint;
  rol: CodigoRol;
  idSesion: bigint;
  debeCambiarContrasena: boolean;
}
