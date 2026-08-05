import { ArrowRight, GraduationCap, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuAdministrador } from '../../componentes/navegacion/menu-administrador';
import { CodigoRol } from '../../modulos/autenticacion/tipos/autenticacion.tipos';
import { useListaUsuarios } from '../../modulos/usuarios/hooks/useUsuarios';
import { ConsultaUsuarios } from '../../modulos/usuarios/tipos/usuarios.tipos';

const LIMITE_CONTEO = 1;
const consultaBase: Omit<ConsultaUsuarios, 'rol'> = {
  pagina: 1,
  limite: LIMITE_CONTEO,
  buscar: '',
  estado: 'TODOS'
};

type TarjetaTotal = {
  etiqueta: string;
  descripcion: string;
  rol: ConsultaUsuarios['rol'];
  icono: typeof Users;
};

const tarjetasTotales: TarjetaTotal[] = [
  { etiqueta: 'Total de usuarios', descripcion: 'Cuentas registradas en el sistema.', rol: 'TODOS', icono: Users },
  { etiqueta: 'Administradores', descripcion: 'Usuarios con acceso administrativo.', rol: 'ADMINISTRADOR', icono: ShieldCheck },
  { etiqueta: 'Docentes', descripcion: 'Cuentas asociadas a perfil docente.', rol: 'DOCENTE', icono: UserCheck },
  { etiqueta: 'Estudiantes', descripcion: 'Cuentas asociadas a perfil estudiante.', rol: 'ESTUDIANTE', icono: GraduationCap }
];

const accesosRapidos = [
  { etiqueta: 'Usuarios', descripcion: 'Gestionar todas las cuentas.', ruta: '/administrador/usuarios', icono: Users },
  { etiqueta: 'Docentes', descripcion: 'Filtrar cuentas docentes.', ruta: '/administrador/docentes', icono: UserCheck },
  { etiqueta: 'Estudiantes', descripcion: 'Filtrar cuentas estudiantiles.', ruta: '/administrador/estudiantes', icono: GraduationCap }
];

function consultaPorRol(rol: ConsultaUsuarios['rol']): ConsultaUsuarios {
  return { ...consultaBase, rol };
}

function etiquetaRol(rol: CodigoRol) {
  return tarjetasTotales.find((tarjeta) => tarjeta.rol === rol)?.etiqueta ?? rol;
}

export function PanelAdministrador() {
  const totalUsuarios = useListaUsuarios(consultaPorRol('TODOS'));
  const totalAdministradores = useListaUsuarios(consultaPorRol('ADMINISTRADOR'));
  const totalDocentes = useListaUsuarios(consultaPorRol('DOCENTE'));
  const totalEstudiantes = useListaUsuarios(consultaPorRol('ESTUDIANTE'));
  const consultas = [totalUsuarios, totalAdministradores, totalDocentes, totalEstudiantes];
  const hayError = consultas.some((consulta) => consulta.isError);
  const cargandoInicial = consultas.some((consulta) => consulta.isLoading);
  const sinInformacion = consultas.every((consulta) => (consulta.data?.paginacion.total ?? 0) === 0);
  const modulosFuturos = menuAdministrador.flatMap((grupo) =>
    grupo.elementos
      .filter((elemento) => !elemento.habilitado)
      .map((elemento) => ({ ...elemento, grupo: grupo.titulo }))
  );

  function totalPorRol(rol: ConsultaUsuarios['rol']) {
    const indice = tarjetasTotales.findIndex((tarjeta) => tarjeta.rol === rol);
    return consultas[indice].data?.paginacion.total;
  }

  return (
    <section className="space-y-8">
      <header className="rounded-md border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <p className="text-sm font-semibold text-gradia-azul">Panel principal</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradia-tinta">Bienvenido al panel administrador</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Consulte el estado real de las cuentas registradas y acceda a la administración de
              usuarios, docentes y estudiantes.
            </p>
          </div>
          {consultas.some((consulta) => consulta.isFetching && !consulta.isLoading) && (
            <span className="text-sm font-semibold text-slate-500">Actualizando información...</span>
          )}
        </div>
      </header>

      {hayError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
          No fue posible consultar los totales de usuarios. Intente actualizar el panel.
        </div>
      )}

      {sinInformacion && !cargandoInicial && !hayError && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600" role="status">
          No hay información de usuarios registrada para mostrar totales.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tarjetasTotales.map((tarjeta) => {
          const Icono = tarjeta.icono;
          const total = totalPorRol(tarjeta.rol);
          return (
            <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={tarjeta.etiqueta}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-600">{tarjeta.etiqueta}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{tarjeta.descripcion}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-gradia-azul">
                  <Icono aria-hidden="true" className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold text-gradia-tinta">
                {cargandoInicial ? 'Cargando...' : total ?? 'Sin datos'}
              </p>
              {tarjeta.rol !== 'TODOS' && (
                <p className="mt-1 text-xs text-slate-500">Filtro: {etiquetaRol(tarjeta.rol)}</p>
              )}
            </article>
          );
        })}
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gradia-azul">Accesos rápidos</p>
            <h2 className="mt-1 text-xl font-bold text-gradia-tinta">Administración de cuentas</h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {accesosRapidos.map((acceso) => {
              const Icono = acceso.icono;
              return (
                <Link
                  className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-4 text-gradia-tinta transition hover:border-gradia-azul hover:bg-blue-50 hover:text-gradia-azul"
                  key={acceso.ruta}
                  to={acceso.ruta}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-gradia-azul">
                      <Icono aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block">{acceso.etiqueta}</strong>
                      <span className="text-sm text-slate-600">{acceso.descripcion}</span>
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gradia-azul">Módulos académicos</p>
          <h2 className="mt-1 text-xl font-bold text-gradia-tinta">No disponibles</h2>
          <div className="mt-5 space-y-2">
            {modulosFuturos.map((modulo) => {
              const Icono = modulo.icono;
              return (
                <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2" key={`${modulo.grupo}-${modulo.etiqueta}`}>
                  <Icono aria-hidden="true" className="h-4 w-4 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700">{modulo.etiqueta}</span>
                    <span className="text-xs text-slate-500">{modulo.grupo}</span>
                  </span>
                  <span className="rounded-sm bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                    Próximamente
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
