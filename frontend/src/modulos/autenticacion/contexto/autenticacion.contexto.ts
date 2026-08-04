import { createContext } from 'react';
import {
  CredencialesInicioSesion,
  EntradaCambioContrasena,
  EstadoAutenticacion,
  UsuarioAutenticado
} from '../tipos/autenticacion.tipos';

export type ValorAutenticacion = {
  estado: EstadoAutenticacion;
  usuario: UsuarioAutenticado | null;
  iniciarSesion: (credenciales: CredencialesInicioSesion) => Promise<UsuarioAutenticado>;
  cambiarContrasena: (entrada: EntradaCambioContrasena) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cerrarTodasLasSesiones: () => Promise<void>;
};

export const AutenticacionContexto = createContext<ValorAutenticacion | null>(null);
