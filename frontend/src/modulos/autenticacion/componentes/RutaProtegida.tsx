import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { EstadoInicialAutenticacion } from './EstadoInicialAutenticacion';

export function RutaProtegida() {
  const { estado, usuario } = useAutenticacion();
  const ubicacion = useLocation();
  if (estado === 'inicializando') return <EstadoInicialAutenticacion />;
  if (estado === 'no_autenticado' || !usuario) {
    return <Navigate replace state={{ desde: ubicacion.pathname }} to="/iniciar-sesion" />;
  }
  if (usuario.debeCambiarContrasena) {
    return <Navigate replace to="/cambiar-contrasena" />;
  }
  return <Outlet />;
}
