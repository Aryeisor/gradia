import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  DatosCambioContrasena,
  esquemaCambioContrasena
} from '../esquemas/autenticacion.esquemas';
import { useAutenticacion } from '../hooks/useAutenticacion';

type CampoContrasenaProps = {
  id: keyof DatosCambioContrasena;
  etiqueta: string;
  error?: string;
  registro: ReturnType<ReturnType<typeof useForm<DatosCambioContrasena>>['register']>;
  autoComplete: string;
};

function CampoContrasena({ id, etiqueta, error, registro, autoComplete }: CampoContrasenaProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-800" htmlFor={id}>{etiqueta}</label>
      <div className="relative mt-2">
        <input
          {...registro}
          aria-describedby={error ? `error-${id}` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 pr-11 outline-none focus:border-gradia-azul focus:ring-2 focus:ring-blue-100"
          id={id}
          type={visible ? 'text' : 'password'}
        />
        <button
          aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-gradia-tinta"
          onClick={() => setVisible((actual) => !actual)}
          type="button"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-700" id={`error-${id}`}>{error}</p>}
    </div>
  );
}

export function PaginaCambiarContrasena() {
  const { cambiarContrasena, usuario } = useAutenticacion();
  const navegar = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<DatosCambioContrasena>({ resolver: zodResolver(esquemaCambioContrasena) });

  async function enviar(datos: DatosCambioContrasena) {
    setErrorGeneral(null);
    try {
      await cambiarContrasena(datos);
      navegar('/iniciar-sesion', {
        replace: true,
        state: { mensaje: 'Contraseña actualizada. Inicie sesión nuevamente.' }
      });
    } catch {
      setErrorGeneral('No fue posible actualizar la contraseña. Revise los datos e intente nuevamente.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4 font-semibold text-gradia-tinta">
          <GraduationCap aria-hidden="true" className="h-6 w-6 text-gradia-azul" />
          Gradia
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:py-16">
        <section>
          <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-100 text-gradia-azul">
            <LockKeyhole aria-hidden="true" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-bold text-gradia-tinta">Cambiar contraseña</h1>
          <p className="mt-3 max-w-xl leading-7 text-slate-600">
            {usuario?.debeCambiarContrasena
              ? 'Debe establecer una nueva contraseña antes de continuar.'
              : 'Actualice la contraseña de su cuenta.'}
          </p>
          <div className="mt-8 border-l-4 border-gradia-azul bg-white px-5 py-4">
            <h2 className="font-semibold text-gradia-tinta">Requisitos</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Al menos 12 caracteres.</li>
              <li>Sin espacios al inicio o al final.</li>
              <li>No utilice valores evidentes o institucionales.</li>
              <li>La confirmación debe coincidir.</li>
            </ul>
          </div>
        </section>

        <section className="self-start border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {errorGeneral && (
            <div className="mb-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {errorGeneral}
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit(enviar)} noValidate>
            <CampoContrasena
              autoComplete="current-password"
              error={errors.contrasenaActual?.message}
              etiqueta="Contraseña actual"
              id="contrasenaActual"
              registro={register('contrasenaActual')}
            />
            <CampoContrasena
              autoComplete="new-password"
              error={errors.contrasenaNueva?.message}
              etiqueta="Nueva contraseña"
              id="contrasenaNueva"
              registro={register('contrasenaNueva')}
            />
            <CampoContrasena
              autoComplete="new-password"
              error={errors.confirmacionContrasena?.message}
              etiqueta="Confirmar contraseña"
              id="confirmacionContrasena"
              registro={register('confirmacionContrasena')}
            />
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradia-azul px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
              {isSubmitting ? 'Actualizando' : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
