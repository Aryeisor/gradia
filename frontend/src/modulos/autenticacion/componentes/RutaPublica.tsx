import { Navigate, Outlet } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { EstadoInicialAutenticacion } from './EstadoInicialAutenticacion';
import { rutaInicialPorRol } from './rutas-autenticacion';

export function RutaPublica() {
  const { estado, usuario } = useAutenticacion();
  if (estado === 'inicializando') return <EstadoInicialAutenticacion />;
  if (estado === 'autenticado' && usuario) {
    return <Navigate replace to={
      usuario.debeCambiarContrasena
        ? '/cambiar-contrasena'
        : rutaInicialPorRol(usuario.rol.codigo)
    } />;
  }
  return <Outlet />;
}
