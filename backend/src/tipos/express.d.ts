import type { UsuarioAutenticado } from '../modulos/autenticacion/tipos/control-acceso.tipos.js';

declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: UsuarioAutenticado;
    }
  }
}

export {};
