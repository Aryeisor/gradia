import express from 'express';
import jwt from 'jsonwebtoken';
import request, { Response } from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { manejadorErrores } from '../../src/middlewares/manejador-errores.js';
import { crearAplicacion } from '../../src/app.js';
import { entorno } from '../../src/configuracion/entorno.js';
import { prisma } from '../../src/infraestructura/prisma/cliente-prisma.js';
import {
  autenticar,
  autorizarRoles,
  exigirContrasenaActualizada
} from '../../src/modulos/autenticacion/autenticacion.middleware.js';
import { generarTokenAcceso } from '../../src/modulos/autenticacion/servicios/jwt.servicio.js';
import {
  DatosAutenticacionPrueba,
  limpiarDatosAutenticacionPrueba,
  prepararDatosAutenticacionPrueba,
  UsuarioPrueba
} from './soporte/datos-autenticacion.js';

function crearAplicacionProtegidaPrueba() {
  const app = express();
  app.use(express.json());
  const responderRol = (req: express.Request, res: express.Response) =>
    res.json({ rol: req.usuarioAutenticado?.rol });

  app.get('/general', autenticar, exigirContrasenaActualizada, responderRol);
  app.get(
    '/administrador',
    autenticar,
    exigirContrasenaActualizada,
    autorizarRoles('ADMINISTRADOR'),
    responderRol
  );
  app.get(
    '/administrador-docente',
    autenticar,
    exigirContrasenaActualizada,
    autorizarRoles('ADMINISTRADOR', 'DOCENTE'),
    responderRol
  );
  app.get(
    '/estudiante',
    autenticar,
    exigirContrasenaActualizada,
    autorizarRoles('ESTUDIANTE'),
    responderRol
  );
  app.use(manejadorErrores);
  return app;
}

async function iniciarSesion(app: ReturnType<typeof crearAplicacion>, usuario: UsuarioPrueba, contrasena: string) {
  return request(app).post('/api/autenticacion/iniciar-sesion').send({
    correo: usuario.correo,
    contrasena
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

describe.sequential('control de acceso con PostgreSQL real', () => {
  let datos: DatosAutenticacionPrueba;

  beforeEach(async () => {
    datos = await prepararDatosAutenticacionPrueba(prisma);
  });

  afterEach(async () => {
    await limpiarDatosAutenticacionPrueba(prisma);
  });

  afterAll(async () => {
    await limpiarDatosAutenticacionPrueba(prisma);
    await prisma.$disconnect();
  });

  it('rechaza ausencia, Bearer mal formado, JWT invalido y JWT vencido', async () => {
    const app = crearAplicacionProtegidaPrueba();
    expect((await request(app).get('/general')).status).toBe(401);
    expect((await request(app).get('/general').set('Authorization', 'Bearer ')).status).toBe(401);
    expect((await request(app).get('/general').set('Authorization', 'Bearer valor-invalido')).status).toBe(401);

    const vencido = jwt.sign(
      { rol: 'ADMINISTRADOR', sid: '1', tipo: 'access' },
      entorno.JWT_SECRET,
      { subject: datos.principal.id.toString(), expiresIn: -1, algorithm: 'HS256' }
    );
    const respuestaVencida = await request(app).get('/general').set(bearer(vencido));
    expect(respuestaVencida.status).toBe(401);
    expect(respuestaVencida.body.codigo).toBe('TOKEN_VENCIDO');
  });

  it('rechaza sesiones inexistentes, revocadas y vencidas', async () => {
    const api = crearAplicacion();
    const protegida = crearAplicacionProtegidaPrueba();
    const inexistente = generarTokenAcceso({
      idUsuario: datos.principal.id,
      codigoRol: 'ADMINISTRADOR',
      idSesion: 999_999_999n
    });
    expect((await request(protegida).get('/general').set(bearer(inexistente))).status).toBe(401);

    const loginRevocado = await iniciarSesion(api, datos.principal, datos.contrasenaActual);
    const accessRevocado = tokenAcceso(loginRevocado);
    const sesionRevocada = await prisma.sesionAutenticacion.findFirstOrThrow({
      where: { idUsuario: datos.principal.id, fechaRevocacion: null },
      orderBy: { id: 'desc' }
    });
    await prisma.sesionAutenticacion.update({
      where: { id: sesionRevocada.id },
      data: { fechaRevocacion: new Date(), motivoRevocacion: 'PRUEBA_CONTROL_ACCESO' }
    });
    expect((await request(protegida).get('/general').set(bearer(accessRevocado))).status).toBe(401);

    const loginVencido = await iniciarSesion(api, datos.principal, datos.contrasenaActual);
    const accessVencido = tokenAcceso(loginVencido);
    const sesionVencida = await prisma.sesionAutenticacion.findFirstOrThrow({
      where: { idUsuario: datos.principal.id, fechaRevocacion: null },
      orderBy: { id: 'desc' }
    });
    await prisma.sesionAutenticacion.update({
      where: { id: sesionVencida.id },
      data: { fechaExpiracion: new Date(Date.now() - 1) }
    });
    expect((await request(protegida).get('/general').set(bearer(accessVencido))).status).toBe(401);
  });

  it('rechaza usuario inactivo y contrasena actualizada despues del JWT', async () => {
    const api = crearAplicacion();
    const protegida = crearAplicacionProtegidaPrueba();
    const loginInactivo = await iniciarSesion(api, datos.principal, datos.contrasenaActual);
    const accessInactivo = tokenAcceso(loginInactivo);
    await prisma.usuario.update({ where: { id: datos.principal.id }, data: { estado: false } });
    expect((await request(protegida).get('/general').set(bearer(accessInactivo))).status).toBe(401);

    await prisma.usuario.update({ where: { id: datos.principal.id }, data: { estado: true } });
    const loginAnterior = await iniciarSesion(api, datos.principal, datos.contrasenaActual);
    const accessAnterior = tokenAcceso(loginAnterior);
    const payload = jwt.decode(accessAnterior);
    if (!payload || typeof payload === 'string' || typeof payload.iat !== 'number') {
      throw new Error('El access token de prueba no contiene iat');
    }
    await prisma.usuario.update({
      where: { id: datos.principal.id },
      data: { contrasenaActualizadaEn: new Date((payload.iat + 1) * 1000) }
    });
    const respuesta = await request(protegida).get('/general').set(bearer(accessAnterior));
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('CREDENCIALES_DESACTUALIZADAS');
  });

  it('autoriza administrador, docente y estudiante segun el rol vigente', async () => {
    const api = crearAplicacion();
    const protegida = crearAplicacionProtegidaPrueba();
    const admin = tokenAcceso(await iniciarSesion(api, datos.principal, datos.contrasenaActual));
    const docente = tokenAcceso(await iniciarSesion(api, datos.docente, datos.contrasenaActual));
    const estudiante = tokenAcceso(await iniciarSesion(api, datos.estudiante, datos.contrasenaActual));

    expect((await request(protegida).get('/administrador').set(bearer(admin))).status).toBe(200);
    expect((await request(protegida).get('/administrador-docente').set(bearer(docente))).status).toBe(200);
    expect((await request(protegida).get('/estudiante').set(bearer(estudiante))).status).toBe(200);
    const prohibida = await request(protegida).get('/administrador').set(bearer(docente));
    expect(prohibida.status).toBe(403);
    expect(prohibida.body.codigo).toBe('ROL_NO_AUTORIZADO');
  });

  it('retira permisos anteriores cuando el rol cambia en PostgreSQL', async () => {
    const api = crearAplicacion();
    const protegida = crearAplicacionProtegidaPrueba();
    const access = tokenAcceso(await iniciarSesion(api, datos.principal, datos.contrasenaActual));
    const rolDocente = await prisma.rol.findUniqueOrThrow({ where: { codigo: 'DOCENTE' } });
    await prisma.usuario.update({
      where: { id: datos.principal.id },
      data: { idRol: rolDocente.id }
    });

    expect((await request(protegida).get('/administrador').set(bearer(access))).status).toBe(403);
    const permitido = await request(protegida).get('/administrador-docente').set(bearer(access));
    expect(permitido.status).toBe(200);
    expect(permitido.body.rol).toBe('DOCENTE');
  });

  it('impide autenticar un usuario con la sesion perteneciente a otra cuenta', async () => {
    const api = crearAplicacion();
    const protegida = crearAplicacionProtegidaPrueba();
    await iniciarSesion(api, datos.secundario, datos.contrasenaActual);
    const sesionAjena = await prisma.sesionAutenticacion.findFirstOrThrow({
      where: { idUsuario: datos.secundario.id }
    });
    const cruzado = generarTokenAcceso({
      idUsuario: datos.principal.id,
      codigoRol: 'ADMINISTRADOR',
      idSesion: sesionAjena.id
    });
    expect((await request(protegida).get('/general').set(bearer(cruzado))).status).toBe(401);
  });

  it('bloquea una ruta general y permite /yo durante el cambio obligatorio', async () => {
    const api = crearAplicacion();
    const protegida = crearAplicacionProtegidaPrueba();
    const access = tokenAcceso(await iniciarSesion(api, datos.cambioObligatorio, datos.contrasenaActual));
    const bloqueada = await request(protegida).get('/general').set(bearer(access));
    expect(bloqueada.status).toBe(403);
    expect(bloqueada.body.codigo).toBe('CAMBIO_CONTRASENA_REQUERIDO');
    expect((await request(api).get('/api/autenticacion/yo').set(bearer(access))).status).toBe(200);
  });

  it('permite cerrar la sesion durante el cambio obligatorio y luego la invalida', async () => {
    const api = crearAplicacion();
    const access = tokenAcceso(await iniciarSesion(api, datos.cambioObligatorio, datos.contrasenaActual));
    expect((await request(api).post('/api/autenticacion/cerrar-sesion').set(bearer(access))).status).toBe(200);
    expect((await request(api).get('/api/autenticacion/yo').set(bearer(access))).status).toBe(401);
  });

  it('permite cerrar todas durante el cambio obligatorio sin afectar otra cuenta', async () => {
    const api = crearAplicacion();
    const primero = tokenAcceso(await iniciarSesion(api, datos.cambioObligatorio, datos.contrasenaActual));
    const segundo = tokenAcceso(await iniciarSesion(api, datos.cambioObligatorio, datos.contrasenaActual));
    const otro = tokenAcceso(await iniciarSesion(api, datos.secundario, datos.contrasenaActual));
    expect((await request(api).post('/api/autenticacion/cerrar-todas').set(bearer(primero))).status).toBe(200);
    expect((await request(api).get('/api/autenticacion/yo').set(bearer(primero))).status).toBe(401);
    expect((await request(api).get('/api/autenticacion/yo').set(bearer(segundo))).status).toBe(401);
    expect((await request(api).get('/api/autenticacion/yo').set(bearer(otro))).status).toBe(200);
  });

  it('permite cambiar la contrasena durante el cambio obligatorio', async () => {
    const api = crearAplicacion();
    const access = tokenAcceso(await iniciarSesion(api, datos.cambioObligatorio, datos.contrasenaActual));
    const respuesta = await request(api).patch('/api/autenticacion/cambiar-contrasena')
      .set(bearer(access))
      .send({
        contrasenaActual: datos.contrasenaActual,
        contrasenaNueva: datos.contrasenaNueva,
        confirmacionContrasena: datos.contrasenaNueva
      });
    expect(respuesta.status).toBe(200);
    expect((await request(api).get('/api/autenticacion/yo').set(bearer(access))).status).toBe(401);
  });
});
