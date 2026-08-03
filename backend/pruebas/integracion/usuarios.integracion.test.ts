import request, { Response } from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ErrorConflicto } from '../../src/compartido/errores/error-aplicacion.js';
import { crearAplicacion } from '../../src/app.js';
import { prisma } from '../../src/infraestructura/prisma/cliente-prisma.js';
import { compararContrasena } from '../../src/modulos/autenticacion/servicios/contrasenas.servicio.js';
import { cambiarEstadoUsuario } from '../../src/modulos/usuarios/usuarios.servicio.js';
import {
  DatosAutenticacionPrueba,
  limpiarDatosAutenticacionPrueba,
  prepararDatosAutenticacionPrueba
} from './soporte/datos-autenticacion.js';

const PREFIJO_DOCUMENTO = 'IT-USR-';
const DOMINIO = 'usuarios.integration.test';
const CONTRASENA_TEMPORAL = 'Temporal-Segura-2026!X';

async function limpiarDatosGestionUsuarios(): Promise<void> {
  const usuarios = await prisma.usuario.findMany({
    where: { numeroDocumento: { startsWith: PREFIJO_DOCUMENTO } },
    select: { id: true }
  });
  const ids = usuarios.map((usuario) => usuario.id);
  if (ids.length === 0) return;
  await prisma.$transaction(async (tx) => {
    await tx.sesionAutenticacion.deleteMany({ where: { idUsuario: { in: ids } } });
    await tx.registroAuditoria.deleteMany({
      where: {
        OR: [
          { idUsuario: { in: ids } },
          { modulo: 'USUARIOS', idRegistro: { in: ids } }
        ]
      }
    });
    await tx.docente.deleteMany({ where: { idUsuario: { in: ids } } });
    await tx.estudiante.deleteMany({ where: { idUsuario: { in: ids } } });
    await tx.usuario.deleteMany({ where: { id: { in: ids } } });
  });
}

function tokenAcceso(respuesta: Response): string {
  const token = respuesta.body?.datos?.tokenAcceso;
  if (typeof token !== 'string') throw new Error('La prueba no recibio un access token');
  return token;
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function entradaUsuario(
  sufijo: string,
  rol: 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE'
) {
  const general = {
    nombres: 'Usuario',
    apellidos: `Gestion ${sufijo}`,
    tipoDocumento: 'CC',
    numeroDocumento: `${PREFIJO_DOCUMENTO}${sufijo}`,
    correo: `${sufijo.toLowerCase()}@${DOMINIO}`,
    contrasenaTemporal: CONTRASENA_TEMPORAL,
    rol
  };
  if (rol === 'DOCENTE') {
    return {
      ...general,
      perfil: {
        codigoDocente: `IT-DOC-${sufijo}`,
        especialidad: 'Matematicas',
        telefono: '3000000000'
      }
    };
  }
  if (rol === 'ESTUDIANTE') {
    return {
      ...general,
      perfil: {
        codigoEstudiante: `IT-EST-${sufijo}`,
        fechaNacimiento: '2012-05-10',
        telefono: '3000000001',
        direccion: 'Direccion ficticia'
      }
    };
  }
  return { ...general, perfil: {} };
}

describe.sequential('gestion administrativa de usuarios con PostgreSQL real', () => {
  const app = crearAplicacion();
  let datos: DatosAutenticacionPrueba;
  let tokenAdministrador: string;

  beforeEach(async () => {
    await limpiarDatosGestionUsuarios();
    datos = await prepararDatosAutenticacionPrueba(prisma);
    const login = await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: datos.principal.correo,
      contrasena: datos.contrasenaActual
    });
    tokenAdministrador = tokenAcceso(login);
  });

  afterEach(async () => {
    await limpiarDatosGestionUsuarios();
    await limpiarDatosAutenticacionPrueba(prisma);
  });

  afterAll(async () => {
    await limpiarDatosGestionUsuarios();
    await limpiarDatosAutenticacionPrueba(prisma);
    await prisma.$disconnect();
  });

  async function crear(sufijo: string, rol: 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE') {
    return request(app).post('/api/usuarios').set(bearer(tokenAdministrador)).send(
      entradaUsuario(sufijo, rol)
    );
  }

  it('crea administradores, docentes y estudiantes con un unico perfil compatible', async () => {
    const administrador = await crear('ADMIN', 'ADMINISTRADOR');
    const docente = await crear('DOCENTE', 'DOCENTE');
    const estudiante = await crear('ESTUDIANTE', 'ESTUDIANTE');

    expect(administrador.status).toBe(201);
    expect(administrador.body.datos.usuario.docente).toBeNull();
    expect(administrador.body.datos.usuario.estudiante).toBeNull();
    expect(docente.status).toBe(201);
    expect(docente.body.datos.usuario.docente.codigoDocente).toBe('IT-DOC-DOCENTE');
    expect(docente.body.datos.usuario.estudiante).toBeNull();
    expect(estudiante.status).toBe(201);
    expect(estudiante.body.datos.usuario.estudiante.codigoEstudiante).toBe('IT-EST-ESTUDIANTE');
    expect(estudiante.body.datos.usuario.docente).toBeNull();
    expect(JSON.stringify([administrador.body, docente.body, estudiante.body])).not.toContain(
      CONTRASENA_TEMPORAL
    );

    const almacenados = await prisma.usuario.findMany({
      where: { numeroDocumento: { startsWith: PREFIJO_DOCUMENTO } },
      include: { docente: true, estudiante: true }
    });
    expect(almacenados).toHaveLength(3);
    expect(almacenados.every((usuario) => usuario.contrasenaHash !== CONTRASENA_TEMPORAL)).toBe(true);
  });

  it('lista con paginacion, busqueda, filtro de rol, filtro de estado y orden estable', async () => {
    await crear('LISTA-A', 'DOCENTE');
    const estudiante = await crear('LISTA-B', 'ESTUDIANTE');
    const idEstudiante = estudiante.body.datos.usuario.id as string;
    await request(app).patch(`/api/usuarios/${idEstudiante}/estado`).set(bearer(tokenAdministrador)).send({
      estado: false,
      motivo: 'Prueba de filtro'
    });

    const pagina = await request(app).get('/api/usuarios?pagina=1&limite=2')
      .set(bearer(tokenAdministrador));
    expect(pagina.status).toBe(200);
    expect(pagina.body.datos.usuarios).toHaveLength(2);
    expect(pagina.body.datos.paginacion.total).toBeGreaterThanOrEqual(2);
    expect(pagina.body.datos.paginacion.totalPaginas).toBeGreaterThanOrEqual(1);

    const busqueda = await request(app).get('/api/usuarios?buscar=IT-DOC-LISTA-A')
      .set(bearer(tokenAdministrador));
    expect(busqueda.body.datos.usuarios).toHaveLength(1);
    expect(busqueda.body.datos.usuarios[0].docente.codigoDocente).toBe('IT-DOC-LISTA-A');

    const docentes = await request(app).get('/api/usuarios?rol=DOCENTE')
      .set(bearer(tokenAdministrador));
    expect(docentes.body.datos.usuarios.every(
      (usuario: { rol: { codigo: string } }) => usuario.rol.codigo === 'DOCENTE'
    )).toBe(true);

    const inactivos = await request(app).get('/api/usuarios?estado=false&buscar=LISTA-B')
      .set(bearer(tokenAdministrador));
    expect(inactivos.body.datos.usuarios).toHaveLength(1);
    expect(inactivos.body.datos.usuarios[0].estado).toBe(false);
  });

  it('consulta el detalle seguro con perfil, fechas y ultimo acceso', async () => {
    const creada = await crear('DETALLE', 'ESTUDIANTE');
    const respuesta = await request(app).get(`/api/usuarios/${creada.body.datos.usuario.id}`)
      .set(bearer(tokenAdministrador));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.usuario).toMatchObject({
      correo: `detalle@${DOMINIO}`,
      debeCambiarContrasena: true,
      ultimoAcceso: null,
      rol: { codigo: 'ESTUDIANTE' },
      estudiante: { codigoEstudiante: 'IT-EST-DETALLE' }
    });
    expect(respuesta.body.datos.usuario).not.toHaveProperty('contrasenaHash');
    expect(respuesta.body.datos.usuario).not.toHaveProperty('sesionesAutenticacion');
  });

  it('rechaza perfiles incompatibles y conserva la transaccion sin usuario parcial', async () => {
    const entrada = entradaUsuario('INCOMPATIBLE', 'DOCENTE');
    const respuesta = await request(app).post('/api/usuarios').set(bearer(tokenAdministrador)).send({
      ...entrada,
      perfil: { codigoEstudiante: 'IT-EST-INCOMPATIBLE', fechaNacimiento: '2012-01-01' }
    });
    expect(respuesta.status).toBe(400);
    expect(await prisma.usuario.count({
      where: { numeroDocumento: `${PREFIJO_DOCUMENTO}INCOMPATIBLE` }
    })).toBe(0);
  });

  it('traduce correo, documento y codigos duplicados a HTTP 409', async () => {
    const original = await crear('UNICO', 'DOCENTE');
    expect(original.status).toBe(201);
    const base = entradaUsuario('OTRO', 'DOCENTE');

    const correo = await request(app).post('/api/usuarios').set(bearer(tokenAdministrador)).send({
      ...base,
      correo: `unico@${DOMINIO}`
    });
    const documento = await request(app).post('/api/usuarios').set(bearer(tokenAdministrador)).send({
      ...base,
      correo: `documento@${DOMINIO}`,
      numeroDocumento: `${PREFIJO_DOCUMENTO}UNICO`
    });
    const codigo = await request(app).post('/api/usuarios').set(bearer(tokenAdministrador)).send({
      ...base,
      correo: `codigo@${DOMINIO}`,
      numeroDocumento: `${PREFIJO_DOCUMENTO}CODIGO`,
      perfil: { ...(base.perfil as object), codigoDocente: 'IT-DOC-UNICO' }
    });
    expect([correo.status, documento.status, codigo.status]).toEqual([409, 409, 409]);
  });

  it('actualiza datos generales y del perfil sin permitir modificar el rol', async () => {
    const creada = await crear('EDITAR', 'DOCENTE');
    const id = creada.body.datos.usuario.id as string;
    const actualizada = await request(app).patch(`/api/usuarios/${id}`)
      .set(bearer(tokenAdministrador)).send({
        nombres: 'Nombre actualizado',
        correo: `editado@${DOMINIO}`,
        perfil: { especialidad: 'Fisica', telefono: null }
      });
    expect(actualizada.status).toBe(200);
    expect(actualizada.body.datos.usuario).toMatchObject({
      nombres: 'Nombre actualizado',
      correo: `editado@${DOMINIO}`,
      rol: { codigo: 'DOCENTE' },
      docente: { especialidad: 'Fisica', telefono: null }
    });

    const rol = await request(app).patch(`/api/usuarios/${id}`).set(bearer(tokenAdministrador)).send({
      rol: 'ADMINISTRADOR'
    });
    expect(rol.status).toBe(400);
    expect((await prisma.usuario.findUniqueOrThrow({
      where: { id: BigInt(id) }, include: { rol: true }
    })).rol.codigo).toBe('DOCENTE');
  });

  it('desactiva, revoca sesiones, impide login y reactiva sin restaurar sesiones', async () => {
    const creada = await crear('ESTADO', 'DOCENTE');
    const id = BigInt(creada.body.datos.usuario.id as string);
    const login = await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: `estado@${DOMINIO}`,
      contrasena: CONTRASENA_TEMPORAL
    });
    expect(login.status).toBe(200);
    const sesion = await prisma.sesionAutenticacion.findFirstOrThrow({
      where: { idUsuario: id, fechaRevocacion: null }
    });

    const desactivar = await request(app).patch(`/api/usuarios/${id}/estado`)
      .set(bearer(tokenAdministrador)).send({ estado: false, motivo: 'Retiro de prueba' });
    expect(desactivar.status).toBe(200);
    expect((await prisma.sesionAutenticacion.findUniqueOrThrow({ where: { id: sesion.id } })).fechaRevocacion)
      .not.toBeNull();
    expect((await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: `estado@${DOMINIO}`,
      contrasena: CONTRASENA_TEMPORAL
    })).status).toBe(401);

    const activar = await request(app).patch(`/api/usuarios/${id}/estado`)
      .set(bearer(tokenAdministrador)).send({ estado: true, motivo: 'Reintegro de prueba' });
    expect(activar.status).toBe(200);
    expect((await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: `estado@${DOMINIO}`,
      contrasena: CONTRASENA_TEMPORAL
    })).status).toBe(200);
    expect((await prisma.sesionAutenticacion.findUniqueOrThrow({ where: { id: sesion.id } })).fechaRevocacion)
      .not.toBeNull();
  });

  it('rechaza autodesactivacion y protege al ultimo administrador activo', async () => {
    const propia = await request(app).patch(`/api/usuarios/${datos.principal.id}/estado`)
      .set(bearer(tokenAdministrador)).send({ estado: false, motivo: 'No permitido' });
    expect(propia.status).toBe(409);

    await prisma.usuario.updateMany({
      where: {
        id: { in: [datos.cambioObligatorio.id, datos.bloqueo.id, datos.secundario.id] }
      },
      data: { estado: false }
    });
    await expect(cambiarEstadoUsuario(
      datos.principal.id,
      { estado: false, motivo: 'No permitido' },
      { idAdministrador: 999_999n }
    )).rejects.toBeInstanceOf(ErrorConflicto);
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: datos.principal.id } })).estado).toBe(true);
  });

  it('restablece la contrasena, reinicia bloqueos, revoca sesiones y exige cambio', async () => {
    const creada = await crear('RESTABLECER', 'ESTUDIANTE');
    const id = BigInt(creada.body.datos.usuario.id as string);
    await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: `restablecer@${DOMINIO}`,
      contrasena: CONTRASENA_TEMPORAL
    });
    await prisma.usuario.update({
      where: { id },
      data: { intentosFallidos: 4, bloqueadoHasta: new Date(Date.now() + 60_000) }
    });
    const nueva = 'Nueva-Temporal-2026!X';
    const respuesta = await request(app).post(`/api/usuarios/${id}/restablecer-contrasena`)
      .set(bearer(tokenAdministrador)).send({
        contrasenaTemporal: nueva,
        confirmacionContrasena: nueva
      });
    expect(respuesta.status).toBe(200);
    expect(JSON.stringify(respuesta.body)).not.toContain(nueva);

    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    expect(usuario.debeCambiarContrasena).toBe(true);
    expect(usuario.intentosFallidos).toBe(0);
    expect(usuario.bloqueadoHasta).toBeNull();
    expect(usuario.contrasenaActualizadaEn).not.toBeNull();
    expect(await compararContrasena(nueva, usuario.contrasenaHash)).toBe(true);
    expect(await prisma.sesionAutenticacion.count({
      where: { idUsuario: id, fechaRevocacion: null }
    })).toBe(0);
  });

  it('registra las cinco acciones con auditoria sanitizada', async () => {
    const creada = await crear('AUDITORIA', 'DOCENTE');
    const id = creada.body.datos.usuario.id as string;
    await request(app).patch(`/api/usuarios/${id}`).set(bearer(tokenAdministrador)).send({
      nombres: 'Auditado'
    });
    await request(app).patch(`/api/usuarios/${id}/estado`).set(bearer(tokenAdministrador)).send({
      estado: false,
      motivo: 'Auditoria de desactivacion'
    });
    await request(app).patch(`/api/usuarios/${id}/estado`).set(bearer(tokenAdministrador)).send({
      estado: true,
      motivo: 'Auditoria de activacion'
    });
    await request(app).post(`/api/usuarios/${id}/restablecer-contrasena`)
      .set(bearer(tokenAdministrador)).send({
        contrasenaTemporal: 'Otra-Temporal-2026!X',
        confirmacionContrasena: 'Otra-Temporal-2026!X'
      });

    const auditorias = await prisma.registroAuditoria.findMany({
      where: { modulo: 'USUARIOS', idRegistro: BigInt(id) },
      orderBy: { id: 'asc' }
    });
    expect(auditorias.map((registro) => registro.accion)).toEqual([
      'CREACION_USUARIO',
      'ACTUALIZACION_USUARIO',
      'DESACTIVACION_USUARIO',
      'ACTIVACION_USUARIO',
      'RESTABLECIMIENTO_CONTRASENA'
    ]);
    const contenido = JSON.stringify(auditorias.map((registro) => ({
      anteriores: registro.datosAnteriores,
      nuevos: registro.datosNuevos
    })));
    expect(contenido).not.toContain(CONTRASENA_TEMPORAL);
    expect(contenido).not.toContain('Otra-Temporal-2026!X');
    expect(contenido).not.toMatch(/contrasenaHash|tokenHash|refreshToken/i);
  });
});
