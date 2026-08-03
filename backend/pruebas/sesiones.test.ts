import { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ClientePrismaTransaccional } from '../src/compartido/validaciones/validaciones-coherencia-academica.js';
import { crearSesion, revocarSesion, revocarSesionesUsuario, rotarSesion } from '../src/modulos/autenticacion/servicios/sesiones.servicio.js';

const ahora = new Date('2026-08-02T10:00:00.000Z');
const expira = new Date('2026-08-09T10:00:00.000Z');

function sesion(id: bigint, extras: Record<string, unknown> = {}) {
  return {
    id, idUsuario: 10n, fechaExpiracion: expira, fechaRevocacion: null,
    motivoRevocacion: null, idSesionReemplazo: null, direccionIp: null,
    agenteUsuario: null, ultimoUsoEn: null, creadoEn: ahora, actualizadoEn: ahora,
    ...extras
  };
}

describe('servicio de sesiones', () => {
  it('crea una sesion devolviendo solamente la seleccion segura', async () => {
    const create = vi.fn().mockResolvedValue(sesion(1n));
    const cliente = { sesionAutenticacion: { create } } as unknown as ClientePrismaTransaccional;
    const creada = await crearSesion(cliente, { idUsuario: 10n, tokenHash: 'a'.repeat(64), fechaExpiracion: expira });
    expect(creada.id).toBe(1n);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ select: expect.any(Object) }));
  });

  it('revoca una sesion existente', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 1n });
    const update = vi.fn().mockResolvedValue(sesion(1n, { fechaRevocacion: ahora }));
    const cliente = { sesionAutenticacion: { findUnique, update } } as unknown as ClientePrismaTransaccional;
    const revocada = await revocarSesion(cliente, 1n, 'CIERRE', ahora);
    expect(revocada.fechaRevocacion).toEqual(ahora);
  });

  it('revoca todas las sesiones activas del usuario', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const cliente = { sesionAutenticacion: { updateMany } } as unknown as ClientePrismaTransaccional;
    await expect(revocarSesionesUsuario(cliente, 10n, 'SEGURIDAD', ahora)).resolves.toBe(3);
  });

  it('rota dentro de una transaccion y enlaza la sesion reemplazada', async () => {
    const findUnique = vi.fn().mockResolvedValue({ ...sesion(1n), tokenHash: 'a'.repeat(64), usuario: { estado: true } });
    const create = vi.fn().mockResolvedValue(sesion(2n));
    const update = vi.fn().mockResolvedValue(sesion(1n));
    const tx = { sesionAutenticacion: { findUnique, create, update } } as unknown as ClientePrismaTransaccional;
    const prisma = { $transaction: vi.fn((operacion: (cliente: ClientePrismaTransaccional) => unknown) => operacion(tx)) } as unknown as PrismaClient;
    const nueva = await rotarSesion(prisma, {
      tokenHashActual: 'a'.repeat(64), nuevoTokenHash: 'b'.repeat(64), nuevaFechaExpiracion: expira, ahora
    });
    expect(nueva.id).toBe(2n);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ idSesionReemplazo: 2n }) }));
  });

  it('detecta reutilizacion, revoca sesiones activas y registra auditoria', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      ...sesion(1n), tokenHash: 'a'.repeat(64), fechaRevocacion: ahora, idSesionReemplazo: 2n, usuario: { estado: true }
    });
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const auditoriaCreate = vi.fn().mockResolvedValue({ id: 1n });
    const tx = {
      sesionAutenticacion: { findUnique, updateMany }, registroAuditoria: { create: auditoriaCreate }
    } as unknown as ClientePrismaTransaccional;
    const prisma = { $transaction: vi.fn((operacion: (cliente: ClientePrismaTransaccional) => unknown) => operacion(tx)) } as unknown as PrismaClient;
    await expect(rotarSesion(prisma, {
      tokenHashActual: 'a'.repeat(64), nuevoTokenHash: 'b'.repeat(64), nuevaFechaExpiracion: expira, ahora
    })).rejects.toThrow('reutilizacion');
    expect(updateMany).toHaveBeenCalled();
    expect(auditoriaCreate).toHaveBeenCalled();
  });
});
