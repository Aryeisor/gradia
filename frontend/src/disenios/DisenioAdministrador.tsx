import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { NavegacionAdministrador } from '../componentes/navegacion/NavegacionAdministrador';

export function DisenioAdministrador() {
  const [menuContraido, setMenuContraido] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavegacionAdministrador
        contraido={menuContraido}
        alAlternarContraido={() => setMenuContraido((valor) => !valor)}
      />
      <main className={`px-4 py-8 transition-[margin] sm:px-6 ${menuContraido ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <Outlet />
      </main>
    </div>
  );
}
