import { Navigate, Outlet } from 'react-router-dom';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { CodigoRol } from '../tipos/autenticacion.tipos';

type Props = {
  roles: CodigoRol[];
};

export function RutaPorRol({ roles }: Props) {
  const { usuario } = useAutenticacion();
  if (!usuario) return <Navigate replace to="/iniciar-sesion" />;
  if (!roles.includes(usuario.rol.codigo)) {
    return <Navigate replace to="/sin-autorizacion" />;
  }
  return <Outlet />;
}
