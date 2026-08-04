import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  DatosFormularioUsuario,
  esquemaCrearUsuario,
  esquemaFormularioUsuario
} from '../esquemas/usuarios.esquemas';
import { UsuarioDetalle } from '../tipos/usuarios.tipos';

type Props = {
  modo: 'crear' | 'editar';
  usuario?: UsuarioDetalle;
  enviando: boolean;
  errorGeneral?: string | null;
  alCancelar: () => void;
  alEnviar: (datos: DatosFormularioUsuario) => Promise<void>;
};

const clasesInput = 'mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gradia-azul focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500';

function valoresUsuario(usuario?: UsuarioDetalle): DatosFormularioUsuario {
  return {
    nombres: usuario?.nombres ?? '',
    apellidos: usuario?.apellidos ?? '',
    tipoDocumento: usuario?.tipoDocumento ?? '',
    numeroDocumento: usuario?.numeroDocumento ?? '',
    correo: usuario?.correo ?? '',
    rol: usuario?.rol.codigo ?? 'DOCENTE',
    contrasenaTemporal: '',
    confirmacionContrasena: '',
    codigoDocente: usuario?.docente?.codigoDocente ?? '',
    especialidad: usuario?.docente?.especialidad ?? '',
    telefono: usuario?.docente?.telefono ?? usuario?.estudiante?.telefono ?? '',
    codigoEstudiante: usuario?.estudiante?.codigoEstudiante ?? '',
    fechaNacimiento: usuario?.estudiante?.fechaNacimiento?.slice(0, 10) ?? '',
    direccion: usuario?.estudiante?.direccion ?? ''
  };
}

export function FormularioUsuario({ modo, usuario, enviando, errorGeneral, alCancelar, alEnviar }: Props) {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<DatosFormularioUsuario>({
    resolver: zodResolver(modo === 'crear' ? esquemaCrearUsuario : esquemaFormularioUsuario),
    defaultValues: valoresUsuario(usuario)
  });
  useEffect(() => reset(valoresUsuario(usuario)), [reset, usuario]);
  const rol = watch('rol');

  const campo = (nombre: keyof DatosFormularioUsuario, etiqueta: string, tipo = 'text') => (
    <label className="block text-sm font-medium text-slate-800">
      {etiqueta}
      <input
        {...register(nombre)}
        aria-invalid={Boolean(errors[nombre])}
        className={clasesInput}
        type={tipo}
      />
      {errors[nombre] && <span className="mt-1 block text-xs text-red-700">{errors[nombre]?.message}</span>}
    </label>
  );

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(alEnviar)}>
      {errorGeneral && <div className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{errorGeneral}</div>}
      <fieldset>
        <legend className="text-sm font-bold text-gradia-tinta">Datos de acceso e identificación</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {campo('nombres', 'Nombres')}
          {campo('apellidos', 'Apellidos')}
          {campo('tipoDocumento', 'Tipo de documento')}
          {campo('numeroDocumento', 'Número de documento')}
          <div className="sm:col-span-2">{campo('correo', 'Correo institucional', 'email')}</div>
          <div className="block text-sm font-medium text-slate-800">
            <label htmlFor="rol-usuario">Rol</label>
            <select
              id="rol-usuario"
              aria-describedby={modo === 'editar' ? 'ayuda-rol-usuario' : undefined}
              {...register('rol')}
              className={clasesInput}
              disabled={modo === 'editar'}
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="DOCENTE">Docente</option>
              <option value="ESTUDIANTE">Estudiante</option>
            </select>
            {modo === 'editar' && (
              <span id="ayuda-rol-usuario" className="mt-1 block text-xs text-slate-500">
                El rol no puede modificarse desde la edición general.
              </span>
            )}
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            {modo === 'crear' ? 'La cuenta deberá cambiar su contraseña en el primer ingreso.' : `Estado: ${usuario?.estado ? 'activo' : 'inactivo'}`}
          </div>
        </div>
      </fieldset>

      {rol === 'DOCENTE' && (
        <fieldset>
          <legend className="text-sm font-bold text-gradia-tinta">Perfil docente</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {campo('codigoDocente', 'Código docente')}
            {campo('especialidad', 'Especialidad')}
            {campo('telefono', 'Teléfono', 'tel')}
          </div>
        </fieldset>
      )}

      {rol === 'ESTUDIANTE' && (
        <fieldset>
          <legend className="text-sm font-bold text-gradia-tinta">Perfil estudiante</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {campo('codigoEstudiante', 'Código estudiantil')}
            {campo('fechaNacimiento', 'Fecha de nacimiento', 'date')}
            {campo('telefono', 'Teléfono', 'tel')}
            {campo('direccion', 'Dirección')}
          </div>
        </fieldset>
      )}

      {modo === 'crear' && (
        <fieldset>
          <legend className="text-sm font-bold text-gradia-tinta">Contraseña temporal</legend>
          <p className="mt-1 text-xs text-slate-600">Mínimo 12 caracteres, sin marcadores comunes ni espacios en los extremos.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-800">
              Contraseña temporal
              <span className="relative mt-1.5 block">
                <input {...register('contrasenaTemporal')} className={`${clasesInput} mt-0 pr-10`} type={mostrarContrasena ? 'text' : 'password'} />
                <button aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500" onClick={() => setMostrarContrasena((valor) => !valor)} type="button">
                  {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              {errors.contrasenaTemporal && <span className="mt-1 block text-xs text-red-700">{errors.contrasenaTemporal.message}</span>}
            </label>
            {campo('confirmacionContrasena', 'Confirmación', mostrarContrasena ? 'text' : 'password')}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={enviando} onClick={alCancelar} type="button">Cancelar</button>
        <button className="flex items-center justify-center gap-2 rounded-md bg-gradia-azul px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={enviando} type="submit">
          {enviando ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {enviando ? 'Guardando' : modo === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
