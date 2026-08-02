import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consultarSalud } from '../../servicios/salud.service';
import { Inicio } from './Inicio';

vi.mock('../../servicios/salud.service', () => ({ consultarSalud: vi.fn() }));

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><Inicio /></QueryClientProvider>);
}

describe('estado visual de servicios', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el estado de carga', () => {
    vi.mocked(consultarSalud).mockReturnValue(new Promise(() => undefined));
    renderizar();
    expect(screen.getByText('Comprobando servicios')).toBeInTheDocument();
  });

  it('muestra API y base de datos disponibles', async () => {
    vi.mocked(consultarSalud).mockResolvedValue({ estado: 'disponibles', mensaje: 'ok' });
    renderizar();
    expect(await screen.findByText('API disponible y base de datos conectada')).toBeInTheDocument();
  });

  it('diferencia PostgreSQL desconectado de una API caida', async () => {
    vi.mocked(consultarSalud).mockResolvedValue({ estado: 'base-datos-desconectada', mensaje: 'sin base' });
    renderizar();
    expect(await screen.findByText('API disponible, pero base de datos desconectada')).toBeInTheDocument();
  });

  it('muestra API no disponible ante un error de red', async () => {
    vi.mocked(consultarSalud).mockResolvedValue({ estado: 'api-no-disponible', mensaje: 'sin red' });
    renderizar();
    expect(await screen.findByText('API no disponible')).toBeInTheDocument();
  });
});
