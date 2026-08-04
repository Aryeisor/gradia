import { Navigate, Outlet } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { EstadoInicialAutenticacion } from './EstadoInicialAutenticacion';

export function RutaCambioContrasena() {
  const { estado, usuario } = useAutenticacion();
  if (estado === 'inicializando') return <EstadoInicialAutenticacion />;
  if (estado === 'no_autenticado' || !usuario) {
    return <Navigate replace to="/iniciar-sesion" />;
  }
  return <Outlet />;
}
