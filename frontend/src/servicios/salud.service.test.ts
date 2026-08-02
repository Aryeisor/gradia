import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { consultarSalud } from './salud.service';

vi.mock('./api', () => ({ api: { get: vi.fn() } }));

describe('consultarSalud', () => {
  beforeEach(() => vi.clearAllMocks());

  it('interpreta una respuesta saludable', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { exito: true, mensaje: 'ok', datos: { api: 'operativa', baseDatos: 'conectada' } } });
    await expect(consultarSalud()).resolves.toMatchObject({ estado: 'disponibles' });
  });

  it('interpreta HTTP 503 valido como base de datos desconectada', async () => {
    vi.mocked(api.get).mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: { exito: false, mensaje: 'sin PostgreSQL', datos: { api: 'operativa', baseDatos: 'desconectada' }, errores: [] } }
    });
    await expect(consultarSalud()).resolves.toMatchObject({ estado: 'base-datos-desconectada' });
  });

  it('interpreta ausencia de respuesta HTTP como API no disponible', async () => {
    vi.mocked(api.get).mockRejectedValue({ isAxiosError: true, request: {} });
    await expect(consultarSalud()).resolves.toMatchObject({ estado: 'api-no-disponible' });
  });

  it('rechaza semantica inesperada sin marcar la base como conectada', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { estado: 'desconocido' } });
    await expect(consultarSalud()).resolves.toMatchObject({ estado: 'api-no-disponible' });
  });
});
