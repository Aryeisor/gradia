import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Inicio } from './Inicio';

vi.mock('../../servicios/salud.service', () => ({
  consultarSalud: vi.fn(async () => ({
    exito: true,
    mensaje: 'Servicios de Gradia disponibles',
    datos: { api: 'operativa', base_datos: 'conectada' }
  }))
}));

describe('Inicio', () => {
  it('renderiza la presentacion de Gradia', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <Inicio />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Gradia' })).toBeInTheDocument();
    expect(await screen.findByText('API disponible y base de datos conectada')).toBeInTheDocument();
  });
});
