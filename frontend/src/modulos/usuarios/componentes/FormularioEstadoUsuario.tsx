import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { DatosEstadoUsuario, esquemaEstadoUsuario } from '../esquemas/usuarios.esquemas';
import { UsuarioResumen } from '../tipos/usuarios.tipos';

type Props = {
  usuario: UsuarioResumen;
  enviando: boolean;
  errorGeneral?: string | null;
  alCancelar: () => void;
  alEnviar: (datos: DatosEstadoUsuario) => Promise<void>;
};

export function FormularioEstadoUsuario({ usuario, enviando, errorGeneral, alCancelar, alEnviar }: Props) {
  const activar = !usuario.estado;
  const { register, handleSubmit, formState: { errors } } = useForm<DatosEstadoUsuario>({ resolver: zodResolver(esquemaEstadoUsuario) });
  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(alEnviar)}>
      <div className={`border-l-4 px-4 py-3 text-sm ${activar ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-amber-500 bg-amber-50 text-amber-950'}`}>
        {activar
          ? 'La cuenta podrá iniciar sesión nuevamente. Las sesiones anteriores no se restaurarán.'
          : 'La cuenta perderá acceso y todas sus sesiones activas serán revocadas. No se elimina el historial.'}
      </div>
      {!activar && usuario.rol.codigo === 'ADMINISTRADOR' && <p className="text-sm text-slate-700">El backend impedirá la autodesactivación y conservará siempre al menos un administrador activo.</p>}
      {errorGeneral && <p className="text-sm text-red-700" role="alert">{errorGeneral}</p>}
      <label className="block text-sm font-medium text-slate-800">
        Motivo
        <textarea {...register('motivo')} className="mt-1.5 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-gradia-azul focus:ring-2 focus:ring-blue-100" />
        {errors.motivo && <span className="mt-1 block text-xs text-red-700">{errors.motivo.message}</span>}
      </label>
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" disabled={enviando} onClick={alCancelar} type="button">Cancelar</button>
        <button className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${activar ? 'bg-emerald-700' : 'bg-red-700'}`} disabled={enviando} type="submit">
          {enviando && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {activar ? 'Confirmar activación' : 'Confirmar desactivación'}
        </button>
      </div>
    </form>
  );
}
