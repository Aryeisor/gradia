import { Plus, Search, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Dialogo } from '../componentes/Dialogo';
import { DetalleUsuario } from '../componentes/DetalleUsuario';
import { FormularioEstadoUsuario } from '../componentes/FormularioEstadoUsuario';
import { FormularioRestablecerContrasena } from '../componentes/FormularioRestablecerContrasena';
import { FormularioUsuario } from '../componentes/FormularioUsuario';
import { TablaUsuarios } from '../componentes/TablaUsuarios';
import {
  useActualizarUsuario,
  useCambiarEstadoUsuario,
  useCrearUsuario,
  useDetalleUsuario,
  useListaUsuarios,
  useRestablecerContrasena
} from '../hooks/useUsuarios';
import { DatosEstadoUsuario, DatosFormularioUsuario, DatosRestablecerContrasena } from '../esquemas/usuarios.esquemas';
import { mensajeErrorUsuarios } from '../servicios/usuarios.servicio';
import { ConsultaUsuarios, EntradaActualizarUsuario, EntradaCrearUsuario, UsuarioResumen } from '../tipos/usuarios.tipos';

type Accion = 'crear' | 'detalle' | 'editar' | 'estado' | 'contrasena' | null;
const consultaInicial: ConsultaUsuarios = { pagina: 1, limite: 10, buscar: '', rol: 'TODOS', estado: 'TODOS' };

function entradaDesdeFormulario(datos: DatosFormularioUsuario, crear: boolean): EntradaCrearUsuario | EntradaActualizarUsuario {
  const base = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    tipoDocumento: datos.tipoDocumento,
    numeroDocumento: datos.numeroDocumento,
    correo: datos.correo.toLowerCase(),
    ...(datos.rol === 'DOCENTE' ? { perfil: { codigoDocente: datos.codigoDocente ?? '', especialidad: datos.especialidad || null, telefono: datos.telefono || null } } : {}),
    ...(datos.rol === 'ESTUDIANTE' ? { perfil: { codigoEstudiante: datos.codigoEstudiante ?? '', fechaNacimiento: datos.fechaNacimiento ?? '', telefono: datos.telefono || null, direccion: datos.direccion || null } } : {})
  };
  return crear ? { ...base, rol: datos.rol, contrasenaTemporal: datos.contrasenaTemporal ?? '' } : base;
}

export function PaginaUsuarios() {
  const [consulta, setConsulta] = useState(consultaInicial);
  const [busqueda, setBusqueda] = useState('');
  const [accion, setAccion] = useState<Accion>(null);
  const [seleccionado, setSeleccionado] = useState<UsuarioResumen | null>(null);
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null);
  const lista = useListaUsuarios(consulta);
  const detalle = useDetalleUsuario(seleccionado?.id ?? null);
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario(seleccionado?.id ?? '');
  const cambiarEstado = useCambiarEstadoUsuario(seleccionado?.id ?? '');
  const restablecer = useRestablecerContrasena(seleccionado?.id ?? '');

  function abrir(nuevaAccion: Exclude<Accion, null>, usuario?: UsuarioResumen) {
    setSeleccionado(usuario ?? null);
    setErrorOperacion(null);
    setAccion(nuevaAccion);
  }
  function cerrar() {
    setAccion(null);
    setSeleccionado(null);
    setErrorOperacion(null);
  }
  function buscar(evento: FormEvent) {
    evento.preventDefault();
    setConsulta((actual) => ({ ...actual, pagina: 1, buscar: busqueda.trim() }));
  }
  async function guardarUsuario(datos: DatosFormularioUsuario) {
    setErrorOperacion(null);
    try {
      if (accion === 'crear') {
        await crear.mutateAsync(entradaDesdeFormulario(datos, true) as EntradaCrearUsuario);
        toast.success('Usuario creado correctamente');
      } else if (seleccionado) {
        await actualizar.mutateAsync(entradaDesdeFormulario(datos, false) as EntradaActualizarUsuario);
        toast.success('Usuario actualizado correctamente');
      }
      cerrar();
    } catch (error) { setErrorOperacion(mensajeErrorUsuarios(error)); }
  }
  async function guardarEstado(datos: DatosEstadoUsuario) {
    if (!seleccionado) return;
    try {
      await cambiarEstado.mutateAsync({ estado: !seleccionado.estado, motivo: datos.motivo });
      toast.success(seleccionado.estado ? 'Usuario desactivado' : 'Usuario activado');
      cerrar();
    } catch (error) { setErrorOperacion(mensajeErrorUsuarios(error)); }
  }
  async function guardarContrasena(datos: DatosRestablecerContrasena) {
    try {
      await restablecer.mutateAsync(datos);
      toast.success('Contraseña restablecida; las sesiones fueron revocadas');
      cerrar();
    } catch (error) { setErrorOperacion(mensajeErrorUsuarios(error)); }
  }

  const paginas = lista.data?.paginacion.totalPaginas ?? 0;
  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gradia-azul"><Users className="h-4 w-4" />Administración</div>
          <h1 className="mt-1 text-2xl font-bold text-gradia-tinta">Gestión de usuarios</h1>
          <p className="mt-1 text-sm text-slate-600">Administre cuentas, perfiles y acceso al sistema.</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-md bg-gradia-azul px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => abrir('crear')} type="button"><Plus className="h-4 w-4" />Crear usuario</button>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_170px]">
        <form className="flex" onSubmit={buscar}>
          <label className="sr-only" htmlFor="buscar-usuarios">Buscar usuarios</label>
          <input className="min-w-0 flex-1 rounded-l-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gradia-azul" id="buscar-usuarios" onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Nombre, correo, documento o código" value={busqueda} />
          <button aria-label="Buscar" className="grid w-11 place-items-center rounded-r-md bg-slate-800 text-white" title="Buscar" type="submit"><Search className="h-4 w-4" /></button>
        </form>
        <label className="sr-only" htmlFor="filtro-rol">Filtrar por rol</label>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" id="filtro-rol" onChange={(evento) => setConsulta((actual) => ({ ...actual, pagina: 1, rol: evento.target.value as ConsultaUsuarios['rol'] }))} value={consulta.rol}>
          <option value="TODOS">Todos los roles</option><option value="ADMINISTRADOR">Administrador</option><option value="DOCENTE">Docente</option><option value="ESTUDIANTE">Estudiante</option>
        </select>
        <label className="sr-only" htmlFor="filtro-estado">Filtrar por estado</label>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" id="filtro-estado" onChange={(evento) => setConsulta((actual) => ({ ...actual, pagina: 1, estado: evento.target.value as ConsultaUsuarios['estado'] }))} value={consulta.estado}>
          <option value="TODOS">Todos los estados</option><option value="ACTIVOS">Activos</option><option value="INACTIVOS">Inactivos</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500"><span>{lista.data?.paginacion.total ?? 0} usuarios</span>{lista.isFetching && !lista.isLoading && <span>Actualizando...</span>}</div>
      <TablaUsuarios usuarios={lista.data?.usuarios ?? []} cargando={lista.isLoading} error={lista.isError} alReintentar={() => void lista.refetch()} alAccion={(tipo, usuario) => abrir(tipo, usuario)} />

      <nav aria-label="Paginación de usuarios" className="flex items-center justify-between">
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={consulta.pagina <= 1} onClick={() => setConsulta((actual) => ({ ...actual, pagina: actual.pagina - 1 }))} type="button">Anterior</button>
        <span className="text-sm text-slate-600">Página {consulta.pagina} de {Math.max(paginas, 1)}</span>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={paginas === 0 || consulta.pagina >= paginas} onClick={() => setConsulta((actual) => ({ ...actual, pagina: actual.pagina + 1 }))} type="button">Siguiente</button>
      </nav>

      <Dialogo abierto={accion === 'crear'} titulo="Crear usuario" descripcion="Registre una cuenta y su perfil compatible." alCerrar={cerrar} ancho="amplio"><FormularioUsuario modo="crear" enviando={crear.isPending} errorGeneral={errorOperacion} alCancelar={cerrar} alEnviar={guardarUsuario} /></Dialogo>
      <Dialogo abierto={accion === 'detalle'} titulo="Detalle del usuario" alCerrar={cerrar} ancho="amplio">{detalle.isLoading ? <p>Cargando detalle...</p> : detalle.isError || !detalle.data ? <p className="text-red-700">{mensajeErrorUsuarios(detalle.error)}</p> : <DetalleUsuario usuario={detalle.data} />}</Dialogo>
      <Dialogo abierto={accion === 'editar'} titulo="Editar usuario" descripcion="El rol permanece bloqueado durante la edición." alCerrar={cerrar} ancho="amplio">{detalle.isLoading ? <p>Cargando usuario...</p> : detalle.data ? <FormularioUsuario modo="editar" usuario={detalle.data} enviando={actualizar.isPending} errorGeneral={errorOperacion} alCancelar={cerrar} alEnviar={guardarUsuario} /> : <p className="text-red-700">No fue posible cargar el usuario.</p>}</Dialogo>
      <Dialogo abierto={accion === 'estado'} titulo={seleccionado?.estado ? 'Desactivar usuario' : 'Activar usuario'} descripcion={seleccionado ? `${seleccionado.nombres} ${seleccionado.apellidos}` : undefined} alCerrar={cerrar}>{seleccionado && <FormularioEstadoUsuario usuario={seleccionado} enviando={cambiarEstado.isPending} errorGeneral={errorOperacion} alCancelar={cerrar} alEnviar={guardarEstado} />}</Dialogo>
      <Dialogo abierto={accion === 'contrasena'} titulo="Restablecer contraseña" descripcion={seleccionado ? `${seleccionado.nombres} ${seleccionado.apellidos}` : undefined} alCerrar={cerrar}>{seleccionado && <FormularioRestablecerContrasena enviando={restablecer.isPending} errorGeneral={errorOperacion} alCancelar={cerrar} alEnviar={guardarContrasena} />}</Dialogo>
    </section>
  );
}
