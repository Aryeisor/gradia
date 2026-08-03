import { Prisma } from '@prisma/client';
import { ClientePrismaTransaccional } from '../../../compartido/validaciones/validaciones-coherencia-academica.js';

const CAMPOS_SENSIBLES = new Set([
  'authorization',
  'confirmacioncontrasena',
  'contrasena',
  'contrasenaactual',
  'contrasenahash',
  'contrasenanueva',
  'cookie',
  'cookies',
  'databaseurl',
  'databaseurltest',
  'jwtsecret',
  'refreshtoken',
  'token',
  'tokenacceso',
  'tokenhash',
  'tokenrefresh'
]);

function normalizarClave(clave: string): string {
  return clave.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export type JsonAuditoria = string | number | boolean | null | JsonAuditoria[] | { [clave: string]: JsonAuditoria };

export function sanitizarDatosAuditoria(valor: unknown): JsonAuditoria | undefined {
  if (valor === undefined) return undefined;
  if (valor === null || typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return valor;
  }
  if (typeof valor === 'bigint') return valor.toString();
  if (valor instanceof Date) return valor.toISOString();
  if (valor instanceof Prisma.Decimal) return valor.toString();
  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarDatosAuditoria(item) ?? null);
  }
  if (typeof valor === 'object') {
    const salida: Record<string, JsonAuditoria> = {};
    for (const [clave, dato] of Object.entries(valor)) {
      if (CAMPOS_SENSIBLES.has(normalizarClave(clave))) continue;
      const datoSeguro = sanitizarDatosAuditoria(dato);
      if (datoSeguro !== undefined) salida[clave] = datoSeguro;
    }
    return salida;
  }
  return String(valor);
}

export async function registrarAuditoriaSeguridad(
  cliente: ClientePrismaTransaccional,
  datos: {
    accion: string;
    modulo: string;
    idUsuario?: bigint | null;
    direccionIp?: string;
    agenteUsuario?: string;
    tablaAfectada?: string;
    idRegistro?: bigint;
    datosAnteriores?: unknown;
    datosNuevos?: unknown;
  }
): Promise<void> {
  const anteriores = sanitizarDatosAuditoria(datos.datosAnteriores);
  const nuevos = sanitizarDatosAuditoria({
    datos: sanitizarDatosAuditoria(datos.datosNuevos),
    contexto: { agenteUsuario: datos.agenteUsuario }
  });
  await cliente.registroAuditoria.create({
    data: {
      accion: datos.accion,
      modulo: datos.modulo,
      idUsuario: datos.idUsuario ?? null,
      direccionIp: datos.direccionIp,
      tablaAfectada: datos.tablaAfectada ?? 'seguridad',
      idRegistro: datos.idRegistro,
      ...(anteriores === undefined
        ? {}
        : { datosAnteriores: anteriores === null ? Prisma.JsonNull : (anteriores as Prisma.InputJsonValue) }),
      ...(nuevos === undefined
        ? {}
        : { datosNuevos: nuevos === null ? Prisma.JsonNull : (nuevos as Prisma.InputJsonValue) })
    }
  });
}
