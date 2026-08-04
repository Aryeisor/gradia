import { GraduationCap, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../modulos/autenticacion/hooks/useAutenticacion';

export function NavegacionPrincipal() {
  const { usuario, cerrarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [cerrando, setCerrando] = useState(false);

  async function salir() {
    setCerrando(true);
    await cerrarSesion();
    navegar('/iniciar-sesion', { replace: true });
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="flex items-center gap-2 font-bold text-gradia-tinta" to="/">
          <GraduationCap className="h-6 w-6 text-gradia-azul" />
          Gradia
        </Link>
        <div className="flex items-center gap-4">
          {usuario?.rol.codigo === 'ADMINISTRADOR' && (
            <div className="hidden items-center gap-1 md:flex">
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-gradia-tinta" to="/administrador">
                <LayoutDashboard className="h-4 w-4" />Panel
              </Link>
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-gradia-tinta" to="/administrador/usuarios">
                <Users className="h-4 w-4" />Usuarios
              </Link>
            </div>
          )}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gradia-tinta">
              {usuario ? `${usuario.nombres} ${usuario.apellidos}` : ''}
            </p>
            <p className="text-xs text-slate-500">{usuario?.rol.nombre}</p>
          </div>
          <button
            aria-label="Cerrar sesion"
            className="grid h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-red-700 disabled:opacity-50"
            disabled={cerrando}
            onClick={() => void salir()}
            title="Cerrar sesion"
            type="button"
          >
            <LogOut aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </header>
  );
}
