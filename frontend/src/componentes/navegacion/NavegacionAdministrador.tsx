import { GraduationCap, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../modulos/autenticacion/hooks/useAutenticacion';
import { ConfirmacionCerrarSesion } from './ConfirmacionCerrarSesion';
import { menuAdministrador } from './menu-administrador';

type Props = {
  contraido: boolean;
  alAlternarContraido: () => void;
};

export function NavegacionAdministrador({ contraido, alAlternarContraido }: Props) {
  const { usuario, cerrarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [cerrando, setCerrando] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const nombreUsuario = usuario ? `${usuario.nombres} ${usuario.apellidos}` : '';

  async function salir() {
    setCerrando(true);
    await cerrarSesion();
    setConfirmandoSalida(false);
    navegar('/iniciar-sesion', { replace: true });
  }

  const contenidoMenu = (
    <>
      <div className={`flex h-16 items-center gap-3 border-b border-slate-200 px-4 ${contraido ? 'lg:justify-center' : ''}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradia-azul text-white">
          <GraduationCap aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className={contraido ? 'lg:sr-only' : ''}>
          <p className="font-bold leading-tight text-gradia-tinta">Gradia</p>
          <p className="text-xs font-medium text-slate-500">Administrador</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Navegación del administrador">
        <div className="space-y-6">
          {menuAdministrador.map((grupo) => (
            <section key={grupo.titulo}>
              <h2 className={`px-2 text-xs font-bold uppercase tracking-wide text-slate-400 ${contraido ? 'lg:sr-only' : ''}`}>
                {grupo.titulo}
              </h2>
              <div className="mt-2 space-y-1">
                {grupo.elementos.map((elemento) => {
                  const Icono = elemento.icono;
                  const etiqueta = elemento.habilitado ? elemento.etiqueta : `${elemento.etiqueta} - Próximamente`;

                  if (!elemento.habilitado || !elemento.ruta) {
                    return (
                      <button
                        aria-label={etiqueta}
                        className={`flex w-full cursor-not-allowed items-center gap-3 rounded-md px-2 py-2 text-left text-sm font-semibold text-slate-400 ${contraido ? 'lg:justify-center' : ''}`}
                        disabled
                        key={elemento.etiqueta}
                        title={etiqueta}
                        type="button"
                      >
                        <Icono aria-hidden="true" className="h-4 w-4 shrink-0" />
                        <span className={`min-w-0 flex-1 truncate ${contraido ? 'lg:sr-only' : ''}`}>{elemento.etiqueta}</span>
                        <span className={`rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500 ${contraido ? 'lg:sr-only' : ''}`}>
                          Próximamente
                        </span>
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      aria-label={elemento.etiqueta}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold transition ${contraido ? 'lg:justify-center' : ''} ${
                          isActive
                            ? 'bg-blue-50 text-gradia-azul'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-gradia-tinta'
                        }`
                      }
                      end={elemento.ruta === '/administrador'}
                      key={elemento.etiqueta}
                      onClick={() => setMenuMovilAbierto(false)}
                      title={elemento.etiqueta}
                      to={elemento.ruta}
                    >
                      <Icono aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className={contraido ? 'lg:sr-only' : ''}>{elemento.etiqueta}</span>
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {menuMovilAbierto && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setMenuMovilAbierto(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform lg:z-40 lg:shadow-none ${
          menuMovilAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${contraido ? 'lg:w-20' : 'lg:w-72'}`}
      >
        <div className="absolute right-3 top-3 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setMenuMovilAbierto(false)}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {contenidoMenu}
      </aside>

      <header className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur transition-[margin] ${contraido ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Abrir menú"
              className="grid h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-gradia-tinta lg:hidden"
              onClick={() => setMenuMovilAbierto(true)}
              type="button"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              aria-label={contraido ? 'Expandir menú lateral' : 'Ocultar menú lateral'}
              className="hidden h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-gradia-tinta lg:grid"
              onClick={alAlternarContraido}
              title={contraido ? 'Expandir menú lateral' : 'Ocultar menú lateral'}
              type="button"
            >
              {contraido ? <PanelLeftOpen aria-hidden="true" className="h-5 w-5" /> : <PanelLeftClose aria-hidden="true" className="h-5 w-5" />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-500">Consola administrativa</p>
              <p className="truncate text-lg font-bold text-gradia-tinta">Gestión institucional</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gradia-tinta">{nombreUsuario}</p>
              <p className="text-xs text-slate-500">{usuario?.rol.nombre}</p>
            </div>
            <button
              aria-label="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              disabled={cerrando}
              onClick={() => setConfirmandoSalida(true)}
              title="Cerrar sesión"
              type="button"
            >
              <LogOut aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <ConfirmacionCerrarSesion
        abierto={confirmandoSalida}
        cerrando={cerrando}
        alCancelar={() => setConfirmandoSalida(false)}
        alConfirmar={() => void salir()}
      />
    </>
  );
}
