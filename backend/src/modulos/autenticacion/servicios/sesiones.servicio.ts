import { Prisma, PrismaClient, SesionAutenticacion } from '@prisma/client';
import { ErrorNoAutenticado, ErrorNoEncontrado } from '../../../compartido/errores/error-aplicacion.js';
import { ClientePrismaTransaccional } from '../../../compartido/validaciones/validaciones-coherencia-academica.js';
import { registrarAuditoriaSeguridad } from './auditoria-seguridad.servicio.js';

const seleccionSesionSegura = {
  id: true,
  idUsuario: true,
  fechaExpiracion: true,
  fechaRevocacion: true,
  motivoRevocacion: true,
  idSesionReemplazo: true,
  direccionIp: true,
  agenteUsuario: true,
  ultimoUsoEn: true,
  creadoEn: true,
  actualizadoEn: true
} satisfies Prisma.SesionAutenticacionSelect;

export type SesionSegura = Prisma.SesionAutenticacionGetPayload<{ select: typeof seleccionSesionSegura }>;

export function sesionEstaActiva(
  sesion: Pick<SesionAutenticacion, 'fechaRevocacion' | 'fechaExpiracion'> & { usuario?: { estado: boolean } },
  ahora = new Date()
): boolean {
  return sesion.fechaRevocacion === null && sesion.fechaExpiracion > ahora && sesion.usuario?.estado !== false;
}

export async function crearSesion(
  cliente: ClientePrismaTransaccional,
  datos: {
    idUsuario: bigint;
    tokenHash: string;
    fechaExpiracion: Date;
    direccionIp?: string;
    agenteUsuario?: string;
  }
): Promise<SesionSegura> {
  return cliente.sesionAutenticacion.create({
    data: datos,
    select: seleccionSesionSegura
  });
}

export async function buscarSesionPorHash(
  cliente: ClientePrismaTransaccional,
  tokenHash: string
): Promise<(SesionSegura & { usuario: { estado: boolean } }) | null> {
  return cliente.sesionAutenticacion.findUnique({
    where: { tokenHash },
    select: { ...seleccionSesionSegura, usuario: { select: { estado: true } } }
  });
}

export async function revocarSesion(
  cliente: ClientePrismaTransaccional,
  idSesion: bigint,
  motivo: string,
  ahora = new Date()
): Promise<SesionSegura> {
  const sesion = await cliente.sesionAutenticacion.findUnique({ where: { id: idSesion }, select: { id: true } });
  if (!sesion) throw new ErrorNoEncontrado('Sesión de autenticación no encontrada');
  return cliente.sesionAutenticacion.update({
    where: { id: idSesion },
    data: { fechaRevocacion: ahora, motivoRevocacion: motivo },
    select: seleccionSesionSegura
  });
}

export async function revocarSesionesUsuario(
  cliente: ClientePrismaTransaccional,
  idUsuario: bigint,
  motivo: string,
  ahora = new Date()
): Promise<number> {
  const resultado = await cliente.sesionAutenticacion.updateMany({
    where: { idUsuario, fechaRevocacion: null },
    data: { fechaRevocacion: ahora, motivoRevocacion: motivo }
  });
  return resultado.count;
}

export async function actualizarUltimoUsoSesion(
  cliente: ClientePrismaTransaccional,
  idSesion: bigint,
  ahora = new Date()
): Promise<void> {
  await cliente.sesionAutenticacion.update({ where: { id: idSesion }, data: { ultimoUsoEn: ahora } });
}

export async function rotarSesion(
  prisma: PrismaClient,
  datos: {
    tokenHashActual: string;
    nuevoTokenHash: string;
    nuevaFechaExpiracion: Date;
    direccionIp?: string;
    agenteUsuario?: string;
    ahora?: Date;
  }
): Promise<SesionSegura> {
  const ahora = datos.ahora ?? new Date();
  const resultado = await prisma.$transaction(async (tx) => {
    const actual = await tx.sesionAutenticacion.findUnique({
      where: { tokenHash: datos.tokenHashActual },
      include: { usuario: { select: { estado: true } } }
    });
    if (!actual) return { error: 'Token de renovación inválido' } as const;

    if (actual.fechaRevocacion || actual.idSesionReemplazo) {
      await revocarSesionesUsuario(tx, actual.idUsuario, 'REUTILIZACION_TOKEN', ahora);
      await registrarAuditoriaSeguridad(tx, {
        accion: 'REUTILIZACION_REFRESH_TOKEN',
        modulo: 'AUTENTICACION',
        idUsuario: actual.idUsuario,
        direccionIp: datos.direccionIp,
        agenteUsuario: datos.agenteUsuario,
        tablaAfectada: 'sesiones_autenticacion',
        idRegistro: actual.id,
        datosNuevos: { sesionesRevocadas: true }
      });
      return { error: 'Se detectó reutilización de una sesión revocada' } as const;
    }
    if (!sesionEstaActiva(actual, ahora)) {
      return { error: 'La sesión de renovación no está activa' } as const;
    }

    const nueva = await tx.sesionAutenticacion.create({
      data: {
        idUsuario: actual.idUsuario,
        tokenHash: datos.nuevoTokenHash,
        fechaExpiracion: datos.nuevaFechaExpiracion,
        direccionIp: datos.direccionIp,
        agenteUsuario: datos.agenteUsuario
      },
      select: seleccionSesionSegura
    });
    await tx.sesionAutenticacion.update({
      where: { id: actual.id },
      data: {
        fechaRevocacion: ahora,
        motivoRevocacion: 'ROTACION',
        idSesionReemplazo: nueva.id,
        ultimoUsoEn: ahora
      }
    });
    return { sesion: nueva } as const;
  });

  if ('error' in resultado) throw new ErrorNoAutenticado(resultado.error);
  return resultado.sesion;
}

/** Operación futura acotada: solo elimina sesiones revocadas, vencidas y anteriores al umbral. */
export async function eliminarSesionesVencidasSeguras(
  prisma: PrismaClient,
  datos: { anterioresA: Date; limite?: number }
): Promise<number> {
  const limite = Math.min(Math.max(datos.limite ?? 500, 1), 1000);
  return prisma.$transaction(async (tx) => {
    const sesiones = await tx.sesionAutenticacion.findMany({
      where: {
        fechaExpiracion: { lt: datos.anterioresA },
        fechaRevocacion: { not: null },
        sesionesReemplazadas: { none: {} }
      },
      select: { id: true },
      take: limite,
      orderBy: { fechaExpiracion: 'asc' }
    });
    if (sesiones.length === 0) return 0;
    const resultado = await tx.sesionAutenticacion.deleteMany({
      where: { id: { in: sesiones.map((sesion) => sesion.id) } }
    });
    return resultado.count;
  });
}
