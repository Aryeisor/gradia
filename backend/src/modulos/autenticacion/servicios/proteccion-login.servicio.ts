import { ErrorConflicto, ErrorNoEncontrado } from '../../../compartido/errores/error-aplicacion.js';
import { ClientePrismaTransaccional } from '../../../compartido/validaciones/validaciones-coherencia-academica.js';
import { entorno } from '../../../configuracion/entorno.js';

export async function asegurarUsuarioNoBloqueado(
  cliente: ClientePrismaTransaccional,
  idUsuario: bigint,
  ahora = new Date()
): Promise<void> {
  const usuario = await cliente.usuario.findUnique({
    where: { id: idUsuario },
    select: { bloqueadoHasta: true }
  });
  if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');
  if (!usuario.bloqueadoHasta) return;
  if (usuario.bloqueadoHasta <= ahora) {
    await cliente.usuario.update({
      where: { id: idUsuario },
      data: { bloqueadoHasta: null, intentosFallidos: 0 }
    });
    return;
  }
  throw new ErrorConflicto('La cuenta esta bloqueada temporalmente');
}

export async function registrarIntentoFallido(
  cliente: ClientePrismaTransaccional,
  idUsuario: bigint,
  ahora = new Date()
): Promise<{ intentosFallidos: number; bloqueadoHasta: Date | null }> {
  const usuario = await cliente.usuario.update({
    where: { id: idUsuario },
    data: { intentosFallidos: { increment: 1 } },
    select: { intentosFallidos: true, bloqueadoHasta: true }
  });
  if (usuario.intentosFallidos < entorno.MAX_INTENTOS_LOGIN) return usuario;

  const bloqueadoHasta = new Date(ahora.getTime() + entorno.MINUTOS_BLOQUEO_LOGIN * 60 * 1000);
  return cliente.usuario.update({
    where: { id: idUsuario },
    data: { bloqueadoHasta },
    select: { intentosFallidos: true, bloqueadoHasta: true }
  });
}

export async function reiniciarProteccionLogin(
  cliente: ClientePrismaTransaccional,
  idUsuario: bigint
): Promise<void> {
  await cliente.usuario.update({
    where: { id: idUsuario },
    data: { intentosFallidos: 0, bloqueadoHasta: null }
  });
}
