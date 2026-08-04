import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  DatosRestablecerContrasena,
  esquemaRestablecerContrasena
} from '../esquemas/usuarios.esquemas';

type Props = {
  enviando: boolean;
  errorGeneral?: string | null;
  alCancelar: () => void;
  alEnviar: (datos: DatosRestablecerContrasena) => Promise<void>;
};

export function FormularioRestablecerContrasena({ enviando, errorGeneral, alCancelar, alEnviar }: Props) {
  const [mostrar, setMostrar] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<DatosRestablecerContrasena>({ resolver: zodResolver(esquemaRestablecerContrasena) });
  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(alEnviar)}>
      <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Se revocarán todas las sesiones del usuario y deberá cambiar esta contraseña en su siguiente ingreso.
      </div>
      {errorGeneral && <p className="text-sm text-red-700" role="alert">{errorGeneral}</p>}
      <p className="text-xs text-slate-600">Use al menos 12 caracteres. Evite palabras comunes, marcadores temporales y espacios en los extremos.</p>
      {(['contrasenaTemporal', 'confirmacionContrasena'] as const).map((nombre, indice) => (
        <label className="block text-sm font-medium text-slate-800" key={nombre}>
          {indice === 0 ? 'Contraseña temporal' : 'Confirmación'}
          <span className="relative mt-1.5 block">
            <input {...register(nombre)} className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-gradia-azul focus:ring-2 focus:ring-blue-100" type={mostrar ? 'text' : 'password'} />
            {indice === 0 && <button aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500" onClick={() => setMostrar((valor) => !valor)} type="button">{mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
          </span>
          {errors[nombre] && <span className="mt-1 block text-xs text-red-700">{errors[nombre]?.message}</span>}
        </label>
      ))}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" disabled={enviando} onClick={alCancelar} type="button">Cancelar</button>
        <button className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={enviando} type="submit">{enviando && <LoaderCircle className="h-4 w-4 animate-spin" />}Restablecer contraseña</button>
      </div>
    </form>
  );
}
