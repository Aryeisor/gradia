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
    <main className="login-shell">
      <section className="login-institutional-panel">
        <div className="login-brand">
          <span className="login-brand-mark">
            <GraduationCap aria-hidden="true" className="h-7 w-7" />
          </span>
          <span>Gradia</span>
        </div>

        <div className="login-panel-copy">
          <p className="login-kicker login-kicker--inverse">
            Acceso institucional
          </p>
          <h1 className="login-panel-title">
            Gestion academica clara, segura y centralizada
          </h1>
          <p className="login-panel-description">
            Ingrese con la cuenta asignada por la institucion para continuar con sus procesos
            academicos.
          </p>
        </div>

        <p className="login-panel-footer">
          Sistema de gestion academica
        </p>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div>
            <p className="login-kicker">Inicio de sesion</p>
            <h2 className="login-card-title">Iniciar sesion</h2>
            <p className="login-card-description">
              Bienvenido de nuevo. Ingrese su correo institucional y contraseña para acceder a
              Gradia.
            </p>
          </div>

          {mensaje && (
            <div className="login-alert login-alert--success" role="status">
              {mensaje}
            </div>
          )}
          {errorGeneral && (
            <div className="login-alert login-alert--error" role="alert">
              {errorGeneral}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit(enviar)} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="correo">Correo</label>
              <input
                {...register('correo')}
                aria-describedby={errors.correo ? 'error-correo' : undefined}
                aria-invalid={Boolean(errors.correo)}
                autoComplete="username"
                className="login-input"
                id="correo"
                inputMode="email"
                type="email"
              />
              {errors.correo && <p className="login-error" id="error-correo">{errors.correo.message}</p>}
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="contrasena">Contraseña</label>
              <div className="login-password-control">
                <input
                  {...register('contrasena')}
                  aria-describedby={errors.contrasena ? 'error-contrasena' : undefined}
                  aria-invalid={Boolean(errors.contrasena)}
                  autoComplete="current-password"
                  className="login-input login-input--password"
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                />
                <button
                  aria-label={mostrarContrasena ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  className="login-password-toggle"
                  onClick={() => setMostrarContrasena((actual) => !actual)}
                  title={mostrarContrasena ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  type="button"
                >
                  {mostrarContrasena ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                </button>
              </div>
              {errors.contrasena && <p className="login-error" id="error-contrasena">{errors.contrasena.message}</p>}
            </div>

            <button
              className="login-submit"
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
