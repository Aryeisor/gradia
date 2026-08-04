import { Eye, KeyRound, Pencil, Power, PowerOff } from 'lucide-react';
import { UsuarioResumen } from '../tipos/usuarios.tipos';

type Props = {
  usuarios: UsuarioResumen[];
  cargando: boolean;
  error: boolean;
  alReintentar: () => void;
  alAccion: (accion: 'detalle' | 'editar' | 'estado' | 'contrasena', usuario: UsuarioResumen) => void;
};

const formatoFecha = (valor: string | null) => valor
  ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(valor))
  : 'Sin ingreso';

const codigoPerfil = (usuario: UsuarioResumen) => usuario.docente?.codigoDocente ?? usuario.estudiante?.codigoEstudiante ?? '—';

export function TablaUsuarios({ usuarios, cargando, error, alReintentar, alAccion }: Props) {
  if (cargando) return <div className="border-y border-slate-200 py-14 text-center text-sm text-slate-600" role="status">Cargando usuarios...</div>;
  if (error) return (
    <div className="border-y border-red-200 bg-red-50 py-10 text-center" role="alert">
      <p className="text-sm text-red-800">No fue posible consultar los usuarios.</p>
      <button className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-800" onClick={alReintentar} type="button">Reintentar</button>
    </div>
  );
  if (usuarios.length === 0) return <div className="border-y border-slate-200 py-14 text-center text-sm text-slate-600">No hay usuarios que coincidan con los filtros.</div>;

  return (
    <div className="overflow-x-auto border-y border-slate-200">
      <table className="min-w-[1050px] w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
          <tr>
            {['Nombre', 'Documento', 'Correo', 'Rol', 'Código', 'Estado', 'Último acceso', 'Acciones'].map((titulo) => <th className="px-3 py-3 font-semibold" key={titulo}>{titulo}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {usuarios.map((usuario) => (
            <tr className="hover:bg-slate-50" key={usuario.id}>
              <td className="px-3 py-3 font-semibold text-gradia-tinta">{usuario.nombres} {usuario.apellidos}</td>
              <td className="px-3 py-3"><span className="block text-xs text-slate-500">{usuario.tipoDocumento}</span>{usuario.numeroDocumento}</td>
              <td className="px-3 py-3 text-slate-700">{usuario.correo}</td>
              <td className="px-3 py-3"><span className="rounded-sm bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{usuario.rol.nombre}</span></td>
              <td className="px-3 py-3 font-mono text-xs">{codigoPerfil(usuario)}</td>
              <td className="px-3 py-3"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${usuario.estado ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{usuario.estado ? 'Activo' : 'Inactivo'}</span></td>
              <td className="px-3 py-3 text-xs text-slate-600">{formatoFecha(usuario.ultimoAcceso)}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <BotonAccion etiqueta="Ver detalle" onClick={() => alAccion('detalle', usuario)}><Eye className="h-4 w-4" /></BotonAccion>
                  <BotonAccion etiqueta="Editar usuario" onClick={() => alAccion('editar', usuario)}><Pencil className="h-4 w-4" /></BotonAccion>
                  <BotonAccion etiqueta={usuario.estado ? 'Desactivar usuario' : 'Activar usuario'} onClick={() => alAccion('estado', usuario)}>{usuario.estado ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</BotonAccion>
                  <BotonAccion etiqueta="Restablecer contraseña" onClick={() => alAccion('contrasena', usuario)}><KeyRound className="h-4 w-4" /></BotonAccion>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BotonAccion({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={etiqueta} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-200 hover:text-gradia-tinta" onClick={onClick} title={etiqueta} type="button">{children}</button>;
}
