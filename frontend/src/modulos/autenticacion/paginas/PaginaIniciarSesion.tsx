import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, GraduationCap, LoaderCircle, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { esquemaInicioSesion, DatosInicioSesion } from '../esquemas/autenticacion.esquemas';
import { useAutenticacion } from '../hooks/useAutenticacion';
import { rutaInicialPorRol } from '../componentes/rutas-autenticacion';

export function PaginaIniciarSesion() {
  const { iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const mensaje = (ubicacion.state as { mensaje?: string } | null)?.mensaje;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<DatosInicioSesion>({ resolver: zodResolver(esquemaInicioSesion) });

  async function enviar(datos: DatosInicioSesion) {
    setErrorGeneral(null);
    try {
      const usuario = await iniciarSesion(datos);
      navegar(
        usuario.debeCambiarContrasena
          ? '/cambiar-contrasena'
          : rutaInicialPorRol(usuario.rol.codigo),
        { replace: true }
      );
    } catch {
      setErrorGeneral('No fue posible iniciar sesion con las credenciales indicadas.');
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
      <section className="flex min-h-52 flex-col justify-between bg-gradia-tinta px-8 py-8 text-white lg:min-h-screen lg:px-12 lg:py-12">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-gradia-azul">
            <GraduationCap aria-hidden="true" className="h-6 w-6" />
          </span>
          Gradia
        </div>
        <div className="max-w-md py-8 lg:py-0">
          <h1 className="text-3xl font-bold sm:text-4xl">Gestion academica en un solo lugar</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Acceda con la cuenta asignada por la institucion.
          </p>
        </div>
        <p className="hidden text-sm text-slate-400 lg:block">Sistema de gestion academica</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold text-gradia-azul">Acceso institucional</p>
          <h2 className="mt-2 text-3xl font-bold text-gradia-tinta">Iniciar sesion</h2>
          <p className="mt-2 text-sm text-slate-600">Ingrese su correo y contrasena.</p>

          {mensaje && (
            <div className="mt-6 border-l-4 border-gradia-verde bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
              {mensaje}
            </div>
          )}
          {errorGeneral && (
            <div className="mt-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {errorGeneral}
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmit(enviar)} noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="correo">Correo</label>
              <input
                {...register('correo')}
                aria-describedby={errors.correo ? 'error-correo' : undefined}
                aria-invalid={Boolean(errors.correo)}
                autoComplete="username"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-gradia-azul focus:ring-2 focus:ring-blue-100"
                id="correo"
                inputMode="email"
                type="email"
              />
              {errors.correo && <p className="mt-1 text-sm text-red-700" id="error-correo">{errors.correo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="contrasena">Contrasena</label>
              <div className="relative mt-2">
                <input
                  {...register('contrasena')}
                  aria-describedby={errors.contrasena ? 'error-contrasena' : undefined}
                  aria-invalid={Boolean(errors.contrasena)}
                  autoComplete="current-password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 pr-11 outline-none focus:border-gradia-azul focus:ring-2 focus:ring-blue-100"
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                />
                <button
                  aria-label={mostrarContrasena ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-gradia-tinta"
                  onClick={() => setMostrarContrasena((actual) => !actual)}
                  title={mostrarContrasena ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  type="button"
                >
                  {mostrarContrasena ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                </button>
              </div>
              {errors.contrasena && <p className="mt-1 text-sm text-red-700" id="error-contrasena">{errors.contrasena.message}</p>}
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradia-azul px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <LogIn aria-hidden="true" className="h-5 w-5" />}
              {isSubmitting ? 'Ingresando' : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
