import { Prisma } from '@prisma/client';

/** Convierte valores de dominio a tipos JSON sin perder precision. */
export function serializarDatos<T>(valor: T): unknown {
  if (valor === null || valor === undefined) return valor;
  if (typeof valor === 'bigint') return valor.toString();
  if (valor instanceof Prisma.Decimal) return valor.toString();
  if (valor instanceof Date) return valor.toISOString();
  if (Array.isArray(valor)) return valor.map(serializarDatos);
  if (typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, dato]) => [clave, serializarDatos(dato)])
    );
  }
  return valor;
}
