import { Server } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { crearCierreControlado } from '../src/infraestructura/http/cierre-controlado.js';

describe('cierre controlado', () => {
  it('cierra HTTP y Prisma una sola vez aunque reciba varias solicitudes', async () => {
    const cerrarHttp = vi.fn((callback: (error?: Error) => void) => callback());
    const servidor = {
      close: cerrarHttp,
      closeIdleConnections: vi.fn(),
      closeAllConnections: vi.fn()
    } as unknown as Server;
    const desconectarPrisma = vi.fn().mockResolvedValue(undefined);
    const finalizarProceso = vi.fn();
    const cerrar = crearCierreControlado({
      servidorHttp: servidor,
      desconectarPrisma,
      registrarInfo: vi.fn(),
      registrarError: vi.fn(),
      finalizarProceso
    });

    await Promise.all([cerrar('SIGINT'), cerrar('SIGTERM')]);

    expect(cerrarHttp).toHaveBeenCalledTimes(1);
    expect(desconectarPrisma).toHaveBeenCalledTimes(1);
    expect(finalizarProceso).toHaveBeenCalledWith(0);
  });
});
