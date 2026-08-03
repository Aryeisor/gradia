import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ClientePrismaTransaccional } from '../src/compartido/validaciones/validaciones-coherencia-academica.js';
import { asegurarUsuarioNoBloqueado, registrarIntentoFallido, reiniciarProteccionLogin } from '../src/modulos/autenticacion/servicios/proteccion-login.servicio.js';

function clienteUsuario(usuario: Record<string, unknown>) {
  const findUnique = vi.fn().mockResolvedValue(usuario);
  const update = vi.fn();
  return { cliente: { usuario: { findUnique, update } } as unknown as ClientePrismaTransaccional, findUnique, update };
}

describe('proteccion contra fuerza bruta', () => {
  it('incrementa intentos y aplica bloqueo temporal al alcanzar el limite', async () => {
    const { cliente, update } = clienteUsuario({});
    update.mockResolvedValueOnce({ intentosFallidos: 5, bloqueadoHasta: null })
      .mockResolvedValueOnce({ intentosFallidos: 5, bloqueadoHasta: new Date('2026-08-02T10:15:00.000Z') });
    const resultado = await registrarIntentoFallido(cliente, 1n, new Date('2026-08-02T10:00:00.000Z'));
    expect(resultado.bloqueadoHasta?.toISOString()).toBe('2026-08-02T10:15:00.000Z');
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('desbloquea automaticamente cuando vencio el plazo', async () => {
    const { cliente, update } = clienteUsuario({ bloqueadoHasta: new Date('2026-08-02T09:59:00.000Z') });
    update.mockResolvedValue({});
    await asegurarUsuarioNoBloqueado(cliente, 1n, new Date('2026-08-02T10:00:00.000Z'));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { bloqueadoHasta: null, intentosFallidos: 0 } }));
  });

  it('rechaza una cuenta cuyo bloqueo sigue vigente', async () => {
    const { cliente } = clienteUsuario({ bloqueadoHasta: new Date('2026-08-02T10:15:00.000Z') });
    await expect(asegurarUsuarioNoBloqueado(cliente, 1n, new Date('2026-08-02T10:00:00.000Z'))).rejects.toThrow();
  });

  it('reinicia conteo y bloqueo despues del exito', async () => {
    const { cliente, update } = clienteUsuario({});
    update.mockResolvedValue({} as Prisma.UsuarioGetPayload<object>);
    await reiniciarProteccionLogin(cliente, 1n);
    expect(update).toHaveBeenCalledWith({ where: { id: 1n }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
  });
});
