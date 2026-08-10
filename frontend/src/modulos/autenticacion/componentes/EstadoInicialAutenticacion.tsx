import { GraduationCap, LoaderCircle } from 'lucide-react';

export function EstadoInicialAutenticacion() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-gradia-azul text-white">
          <GraduationCap aria-hidden="true" className="h-7 w-7" />
        </span>
        <div>
          <p className="font-semibold text-gradia-tinta">Gradia</p>
          <p className="mt-1 text-sm text-slate-600">Restaurando sesión</p>
        </div>
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-gradia-azul" />
      </div>
    </main>
  );
}
