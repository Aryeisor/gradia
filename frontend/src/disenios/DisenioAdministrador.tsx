import { Outlet } from 'react-router-dom';
import { NavegacionPrincipal } from '../componentes/navegacion/NavegacionPrincipal';

export function DisenioAdministrador() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavegacionPrincipal perfil="Administrador" />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
