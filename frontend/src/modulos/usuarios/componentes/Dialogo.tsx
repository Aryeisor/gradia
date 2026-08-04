import { X } from 'lucide-react';
import { ReactNode } from 'react';

type Props = {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  alCerrar: () => void;
  ancho?: 'normal' | 'amplio';
};

export function Dialogo({ abierto, titulo, descripcion, children, alCerrar, ancho = 'normal' }: Props) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" role="presentation">
      <section
        aria-describedby={descripcion ? 'descripcion-dialogo' : undefined}
        aria-labelledby="titulo-dialogo"
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-md bg-white shadow-2xl ${ancho === 'amplio' ? 'max-w-4xl' : 'max-w-lg'}`}
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gradia-tinta" id="titulo-dialogo">{titulo}</h2>
            {descripcion && <p className="mt-1 text-sm text-slate-600" id="descripcion-dialogo">{descripcion}</p>}
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={alCerrar}
            title="Cerrar"
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
