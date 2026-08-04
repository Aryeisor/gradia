import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { exigirUrlBasePruebas } from '../../../src/configuracion/base-datos-pruebas.js';
import { generarHashContrasena } from '../../../src/modulos/autenticacion/servicios/contrasenas.servicio.js';
import { CodigoRol } from '../../../src/modulos/autenticacion/tipos/autenticacion.tipos.js';

const PREFIJO_DOCUMENTO = 'IT-AUTH-';
const DOMINIO_PRUEBAS = 'integration.example.test';

export type UsuarioPrueba = {
  id: bigint;
  correo: string;
};

export type DatosAutenticacionPrueba = {
  contrasenaActual: string;
  contrasenaNueva: string;
  principal: UsuarioPrueba;
  cambioObligatorio: UsuarioPrueba;
  inactivo: UsuarioPrueba;
  bloqueo: UsuarioPrueba;
  secundario: UsuarioPrueba;
  docente: UsuarioPrueba;
  estudiante: UsuarioPrueba;
};

function crearContrasenaFicticia(): string {
  return `Aa!9-${randomBytes(12).toString('hex')}`;
}

export async function asegurarConexionGradiaTest(prisma: PrismaClient): Promise<void> {
  exigirUrlBasePruebas();
  const [resultado] = await prisma.$queryRaw<Array<{ nombre: string }>>`
    SELECT current_database() AS nombre
  `;
  if (resultado.nombre !== 'gradia_test') {
    throw new Error('La conexion activa no corresponde a gradia_test');
  }
}

export async function limpiarDatosAutenticacionPrueba(prisma: PrismaClient): Promise<void> {
  await asegurarConexionGradiaTest(prisma);
  const usuarios = await prisma.usuario.findMany({
    where: { numeroDocumento: { startsWith: PREFIJO_DOCUMENTO } },
    select: { id: true }
  });
  const ids = usuarios.map((usuario) => usuario.id);
  if (ids.length === 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.sesionAutenticacion.deleteMany({ where: { idUsuario: { in: ids } } });
    await tx.registroAuditoria.deleteMany({ where: { idUsuario: { in: ids } } });
    await tx.usuario.deleteMany({ where: { id: { in: ids } } });
  });
}

export async function prepararDatosAutenticacionPrueba(
  prisma: PrismaClient
): Promise<DatosAutenticacionPrueba> {
  await limpiarDatosAutenticacionPrueba(prisma);
  const roles = await prisma.rol.findMany({
    where: { codigo: { in: ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE'] } },
    select: { id: true, codigo: true }
  });
  const idRol = (codigo: CodigoRol) => {
    const rol = roles.find((actual) => actual.codigo === codigo);
    if (!rol) throw new Error(`Falta el rol tecnico ${codigo} en gradia_test`);
    return rol.id;
  };
  const contrasenaActual = crearContrasenaFicticia();
  const contrasenaNueva = crearContrasenaFicticia();
  const contrasenaHash = await generarHashContrasena(contrasenaActual);

  const definiciones = [
    ['principal', 'PRINCIPAL', true, false, 'ADMINISTRADOR'],
    ['cambioObligatorio', 'CAMBIO', true, true, 'ADMINISTRADOR'],
    ['inactivo', 'INACTIVO', false, false, 'ADMINISTRADOR'],
    ['bloqueo', 'BLOQUEO', true, false, 'ADMINISTRADOR'],
    ['secundario', 'SECUNDARIO', true, false, 'ADMINISTRADOR'],
    ['docente', 'DOCENTE', true, false, 'DOCENTE'],
    ['estudiante', 'ESTUDIANTE', true, false, 'ESTUDIANTE']
  ] as const;

  const creados: Partial<Record<(typeof definiciones)[number][0], UsuarioPrueba>> = {};
  for (const [clave, sufijo, estado, debeCambiarContrasena, codigoRol] of definiciones) {
    const usuario = await prisma.usuario.create({
      data: {
        idRol: idRol(codigoRol),
        nombres: 'Usuario',
        apellidos: `Prueba ${sufijo}`,
        tipoDocumento: 'CC',
        numeroDocumento: `${PREFIJO_DOCUMENTO}${sufijo}`,
        correo: `${sufijo.toLowerCase()}@${DOMINIO_PRUEBAS}`,
        contrasenaHash,
        debeCambiarContrasena,
        contrasenaActualizadaEn: debeCambiarContrasena ? null : new Date(),
        intentosFallidos: 0,
        bloqueadoHasta: null,
        estado
      },
      select: { id: true, correo: true }
    });
    creados[clave] = usuario;
  }

  return {
    contrasenaActual,
    contrasenaNueva,
    principal: creados.principal!,
    cambioObligatorio: creados.cambioObligatorio!,
    inactivo: creados.inactivo!,
    bloqueo: creados.bloqueo!,
    secundario: creados.secundario!,
    docente: creados.docente!,
    estudiante: creados.estudiante!
  };
}
