import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginaUsuarios } from '../paginas/PaginaUsuarios';
import { UsuarioResumen } from '../tipos/usuarios.tipos';

const mocks = vi.hoisted(() => ({
  listaEstado: {} as Record<string, unknown>,
  detalleEstado: {} as Record<string, unknown>,
  useLista: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  estado: vi.fn(),
  restablecer: vi.fn(),
  toast: vi.fn()
}));

vi.mock('../hooks/useUsuarios', () => ({
  useListaUsuarios: (consulta: unknown) => {
    mocks.useLista(consulta);
    return mocks.listaEstado;
  },
  useDetalleUsuario: () => mocks.detalleEstado,
  useCrearUsuario: () => ({ mutateAsync: mocks.crear, isPending: false }),
  useActualizarUsuario: () => ({ mutateAsync: mocks.actualizar, isPending: false }),
  useCambiarEstadoUsuario: () => ({ mutateAsync: mocks.estado, isPending: false }),
  useRestablecerContrasena: () => ({ mutateAsync: mocks.restablecer, isPending: false })
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toast } }));

const administrador: UsuarioResumen = {
  id: '1', nombres: 'Ana', apellidos: 'Admin', tipoDocumento: 'CC', numeroDocumento: '100',
  correo: 'ana@example.test', estado: true, ultimoAcceso: null, debeCambiarContrasena: false,
  creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z',
  rol: { codigo: 'ADMINISTRADOR', nombre: 'Administrador' }, docente: null, estudiante: null
};
const docente: UsuarioResumen = {
  ...administrador, id: '2', nombres: 'Diana', apellidos: 'Docente', correo: 'diana@example.test',
  rol: { codigo: 'DOCENTE', nombre: 'Docente' },
  docente: { id: '20', codigoDocente: 'DOC-20', especialidad: 'Matemáticas', telefono: null, estado: 'ACTIVO' }
};

function resultado(usuarios = [administrador, docente]) {
  return { usuarios, paginacion: { pagina: 1, limite: 10, total: usuarios.length, totalPaginas: usuarios.length ? 2 : 0 } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listaEstado = { data: resultado(), isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
  mocks.detalleEstado = { data: docente, isLoading: false, isError: false, error: null };
  mocks.crear.mockResolvedValue(docente);
  mocks.actualizar.mockResolvedValue(docente);
  mocks.estado.mockResolvedValue(docente);
  mocks.restablecer.mockResolvedValue(undefined);
});

describe('listado administrativo de usuarios', () => {
  it('muestra el listado y sus columnas', () => {
    render(<PaginaUsuarios />);
    expect(screen.getByRole('heading', { name: 'Gestion de usuarios' })).toBeInTheDocument();
    expect(screen.getByText('Diana Docente')).toBeInTheDocument();
    expect(screen.getByText('DOC-20')).toBeInTheDocument();
  });

  it('muestra el estado de carga', () => {
    mocks.listaEstado = { data: undefined, isLoading: true, isError: false, isFetching: true, refetch: vi.fn() };
    render(<PaginaUsuarios />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando usuarios');
  });

  it('muestra error y permite reintentar', async () => {
    const refetch = vi.fn();
    mocks.listaEstado = { data: undefined, isLoading: false, isError: true, isFetching: false, refetch };
    render(<PaginaUsuarios />);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('muestra un estado vacío', () => {
    mocks.listaEstado = { data: resultado([]), isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
    render(<PaginaUsuarios />);
    expect(screen.getByText(/No hay usuarios/)).toBeInTheDocument();
  });

  it('aplica la búsqueda', async () => {
    render(<PaginaUsuarios />);
    await userEvent.type(screen.getByLabelText('Buscar usuarios'), 'Diana');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(mocks.useLista).toHaveBeenLastCalledWith(expect.objectContaining({ buscar: 'Diana', pagina: 1 }));
  });

  it('aplica filtros de rol y estado', async () => {
    render(<PaginaUsuarios />);
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por rol'), 'DOCENTE');
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por estado'), 'INACTIVOS');
    expect(mocks.useLista).toHaveBeenLastCalledWith(expect.objectContaining({ rol: 'DOCENTE', estado: 'INACTIVOS' }));
  });

  it('reutiliza la pagina con rol fijo para docentes', () => {
    render(<PaginaUsuarios rolFijo="DOCENTE" />);
    expect(screen.getByRole('heading', { name: 'Gestion de docentes' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Filtrar por rol')).not.toBeInTheDocument();
    expect(mocks.useLista).toHaveBeenLastCalledWith(expect.objectContaining({ rol: 'DOCENTE' }));
  });

  it('avanza en la paginación', async () => {
    render(<PaginaUsuarios />);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(mocks.useLista).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 2 }));
  });

  it('consulta y muestra el detalle', async () => {
    render(<PaginaUsuarios />);
    const botones = screen.getAllByRole('button', { name: 'Ver detalle' });
    await userEvent.click(botones[1]);
    expect(await screen.findByText('Perfil docente')).toBeInTheDocument();
    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
  });

  it('abre la confirmación de desactivación', async () => {
    render(<PaginaUsuarios />);
    const botones = screen.getAllByRole('button', { name: 'Desactivar usuario' });
    await userEvent.click(botones[0]);
    expect(screen.getByRole('heading', { name: 'Desactivar usuario' })).toBeInTheDocument();
    expect(screen.getByText(/sesiones activas serán revocadas/)).toBeInTheDocument();
  });

  it('activa un usuario inactivo', async () => {
    mocks.listaEstado = { data: resultado([{ ...docente, estado: false }]), isLoading: false, isError: false, isFetching: false, refetch: vi.fn() };
    render(<PaginaUsuarios />);
    await userEvent.click(screen.getByRole('button', { name: 'Activar usuario' }));
    await userEvent.type(screen.getByLabelText('Motivo'), 'Reingreso autorizado');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar activación' }));
    await waitFor(() => expect(mocks.estado).toHaveBeenCalledWith({ estado: true, motivo: 'Reingreso autorizado' }));
  });

  it('desactiva y envía el motivo', async () => {
    render(<PaginaUsuarios />);
    const botones = screen.getAllByRole('button', { name: 'Desactivar usuario' });
    await userEvent.click(botones[1]);
    await userEvent.type(screen.getByLabelText('Motivo'), 'Retiro temporal');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
    await waitFor(() => expect(mocks.estado).toHaveBeenCalledWith({ estado: false, motivo: 'Retiro temporal' }));
  });

  it('restablece la contraseña sin mostrarla después', async () => {
    render(<PaginaUsuarios />);
    const botones = screen.getAllByRole('button', { name: 'Restablecer contraseña' });
    await userEvent.click(botones[1]);
    await userEvent.type(screen.getByLabelText('Contraseña temporal'), 'Temporal-Segura-2026!');
    await userEvent.type(screen.getByLabelText('Confirmación'), 'Temporal-Segura-2026!');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restablecer contraseña' }));
    await waitFor(() => expect(mocks.restablecer).toHaveBeenCalledOnce());
    expect(screen.queryByDisplayValue('Temporal-Segura-2026!')).not.toBeInTheDocument();
  });
});
