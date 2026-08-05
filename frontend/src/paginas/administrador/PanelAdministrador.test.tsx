import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PanelAdministrador } from './PanelAdministrador';

const mocks = vi.hoisted(() => ({
  useListaUsuarios: vi.fn()
}));

vi.mock('../../modulos/usuarios/hooks/useUsuarios', () => ({
  useListaUsuarios: (consulta: unknown) => mocks.useListaUsuarios(consulta)
}));

function resultado(total: number) {
  return {
    data: { usuarios: [], paginacion: { pagina: 1, limite: 1, total, totalPaginas: total ? 1 : 0 } },
    isLoading: false,
    isError: false,
    isFetching: false
  };
}

function renderizar() {
  return render(
    <MemoryRouter>
      <PanelAdministrador />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useListaUsuarios
    .mockReturnValueOnce(resultado(12))
    .mockReturnValueOnce(resultado(2))
    .mockReturnValueOnce(resultado(4))
    .mockReturnValueOnce(resultado(6));
});

describe('panel administrador', () => {
  it('muestra los totales consultados por rol', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'Bienvenido al panel administrador' })).toBeInTheDocument();
    expect(screen.getByText('Total de usuarios')).toBeInTheDocument();
    expect(screen.getByText('Administradores')).toBeInTheDocument();
    expect(screen.getAllByText('Docentes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Estudiantes').length).toBeGreaterThan(0);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(mocks.useListaUsuarios).toHaveBeenCalledWith(expect.objectContaining({ rol: 'TODOS' }));
    expect(mocks.useListaUsuarios).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ADMINISTRADOR' }));
    expect(mocks.useListaUsuarios).toHaveBeenCalledWith(expect.objectContaining({ rol: 'DOCENTE' }));
    expect(mocks.useListaUsuarios).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ESTUDIANTE' }));
  });

  it('muestra accesos rápidos habilitados', () => {
    renderizar();
    expect(screen.getByRole('link', { name: /Usuarios/ })).toHaveAttribute('href', '/administrador/usuarios');
    expect(screen.getByRole('link', { name: /Docentes/ })).toHaveAttribute('href', '/administrador/docentes');
    expect(screen.getByRole('link', { name: /Estudiantes/ })).toHaveAttribute('href', '/administrador/estudiantes');
  });

  it('muestra módulos académicos como próximos', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'No disponibles' })).toBeInTheDocument();
    expect(screen.getByText('Años académicos')).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente').length).toBeGreaterThan(0);
  });

  it('muestra estado de carga', () => {
    mocks.useListaUsuarios.mockReset();
    mocks.useListaUsuarios.mockReturnValue({ data: undefined, isLoading: true, isError: false, isFetching: true });
    renderizar();
    expect(screen.getAllByText('Cargando...')).toHaveLength(4);
  });

  it('muestra error de consulta', () => {
    mocks.useListaUsuarios.mockReset();
    mocks.useListaUsuarios
      .mockReturnValueOnce(resultado(12))
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true, isFetching: false })
      .mockReturnValueOnce(resultado(4))
      .mockReturnValueOnce(resultado(6));
    renderizar();
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible consultar los totales de usuarios');
  });

  it('muestra ausencia de información', () => {
    mocks.useListaUsuarios.mockReset();
    mocks.useListaUsuarios.mockReturnValue(resultado(0));
    renderizar();
    expect(screen.getByRole('status')).toHaveTextContent('No hay información de usuarios registrada');
  });
});
