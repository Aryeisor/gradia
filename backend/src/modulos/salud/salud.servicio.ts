import { prisma } from '../../infraestructura/prisma/cliente-prisma.js';

export type ResultadoSalud = {
  baseDatosConectada: boolean;
};

export async function verificarSalud(): Promise<ResultadoSalud> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { baseDatosConectada: true };
  } catch {
    return { baseDatosConectada: false };
  }
}
