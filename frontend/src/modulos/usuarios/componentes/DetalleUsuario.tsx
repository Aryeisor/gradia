import { UsuarioDetalle } from '../tipos/usuarios.tipos';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return <div><dt className="text-xs font-semibold uppercase text-slate-500">{etiqueta}</dt><dd className="mt-1 text-sm text-slate-900">{valor || '—'}</dd></div>;
}

const fecha = (valor?: string | null) => valor
  ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(valor))
  : 'Sin registro';

export function DetalleUsuario({ usuario }: { usuario: UsuarioDetalle }) {
  return (
    <div className="space-y-6">
      <dl className="grid gap-5 sm:grid-cols-2">
        <Dato etiqueta="Nombre completo" valor={`${usuario.nombres} ${usuario.apellidos}`} />
        <Dato etiqueta="Rol" valor={usuario.rol.nombre} />
        <Dato etiqueta="Documento" valor={`${usuario.tipoDocumento} ${usuario.numeroDocumento}`} />
        <Dato etiqueta="Correo" valor={usuario.correo} />
        <Dato etiqueta="Estado" valor={usuario.estado ? 'Activo' : 'Inactivo'} />
        <Dato etiqueta="Cambio de contraseña" valor={usuario.debeCambiarContrasena ? 'Pendiente' : 'Completado'} />
        <Dato etiqueta="Último acceso" valor={fecha(usuario.ultimoAcceso)} />
        <Dato etiqueta="Creado" valor={fecha(usuario.creadoEn)} />
      </dl>
      {usuario.docente && (
        <section className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-bold text-gradia-tinta">Perfil docente</h3>
          <dl className="mt-3 grid gap-5 sm:grid-cols-2">
            <Dato etiqueta="Código docente" valor={usuario.docente.codigoDocente} />
            <Dato etiqueta="Especialidad" valor={usuario.docente.especialidad} />
            <Dato etiqueta="Teléfono" valor={usuario.docente.telefono} />
          </dl>
        </section>
      )}
      {usuario.estudiante && (
        <section className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-bold text-gradia-tinta">Perfil estudiante</h3>
          <dl className="mt-3 grid gap-5 sm:grid-cols-2">
            <Dato etiqueta="Código estudiantil" valor={usuario.estudiante.codigoEstudiante} />
            <Dato etiqueta="Fecha de nacimiento" valor={usuario.estudiante.fechaNacimiento?.slice(0, 10)} />
            <Dato etiqueta="Teléfono" valor={usuario.estudiante.telefono} />
            <Dato etiqueta="Dirección" valor={usuario.estudiante.direccion} />
          </dl>
        </section>
      )}
    </div>
  );
}
