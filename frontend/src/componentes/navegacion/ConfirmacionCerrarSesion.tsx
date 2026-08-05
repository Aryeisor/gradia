import { LogOut } from 'lucide-react';

type Props = {
  abierto: boolean;
  cerrando: boolean;
  alCancelar: () => void;
  alConfirmar: () => void;
};

export function ConfirmacionCerrarSesion({ abierto, cerrando, alCancelar, alConfirmar }: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 px-4" role="presentation">
      <section
        aria-describedby="descripcion-cierre-sesion"
        aria-labelledby="titulo-cierre-sesion"
        aria-modal="true"
        className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-red-50 text-red-700">
            <LogOut aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gradia-tinta" id="titulo-cierre-sesion">
              ¿Cerrar sesión?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600" id="descripcion-cierre-sesion">
              Se cerrará su sesión actual en Gradia. Para volver a ingresar deberá autenticarse
              nuevamente con sus credenciales institucionales.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            disabled={cerrando}
            onClick={alCancelar}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={cerrando}
            onClick={alConfirmar}
            type="button"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {cerrando ? 'Cerrando sesión' : 'Sí, cerrar sesión'}
          </button>
        </div>
      </section>
    </div>
  );
}
