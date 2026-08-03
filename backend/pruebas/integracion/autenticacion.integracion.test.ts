import jwt from 'jsonwebtoken';
import request, { Response } from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearAplicacion } from '../../src/app.js';
import { entorno } from '../../src/configuracion/entorno.js';
import { prisma } from '../../src/infraestructura/prisma/cliente-prisma.js';
import {
  generarHashRefreshToken,
  generarRefreshToken
} from '../../src/modulos/autenticacion/servicios/refresh-token.servicio.js';
import {
  DatosAutenticacionPrueba,
  limpiarDatosAutenticacionPrueba,
  prepararDatosAutenticacionPrueba
} from './soporte/datos-autenticacion.js';

const AGENTE_PRUEBAS = 'gradia-integration-tests';

function encabezadoCookie(respuesta: Response): string {
  const encabezados = respuesta.headers['set-cookie'];
  const primero = Array.isArray(encabezados) ? encabezados[0] : encabezados;
  if (typeof primero !== 'string') throw new Error('La respuesta no incluyo una cookie de renovacion');
  return primero;
}

function cookieSolicitud(respuesta: Response): string {
  return encabezadoCookie(respuesta).split(';', 1)[0];
}

function valorCookie(cookie: string): string {
  const separador = cookie.indexOf('=');
  if (separador < 0) throw new Error('La cookie de prueba no tiene un formato valido');
  return cookie.slice(separador + 1);
}

function atributosCookie(respuesta: Response) {
  const partes = encabezadoCookie(respuesta).split(';').slice(1).map((valor) => valor.trim().toLowerCase());
  return {
    httpOnly: partes.includes('httponly'),
    sameSiteLax: partes.includes('samesite=lax'),
    pathCorrecto: partes.includes('path=/api/autenticacion'),
    secure: partes.includes('secure')
  };
}

function tokenAcceso(respuesta: Response): string {
  const token = respuesta.body?.datos?.tokenAcceso;
  if (typeof token !== 'string') throw new Error('La respuesta no incluyo un access token');
  return token;
}

async function iniciarSesion(
  datos: { correo: string; contrasena: string },
  aplicacion = crearAplicacion()
): Promise<Response> {
  return request(aplicacion)
    .post('/api/autenticacion/iniciar-sesion')
    .set('User-Agent', AGENTE_PRUEBAS)
    .send(datos);
}

function clavesSensiblesPresentes(valor: unknown): string[] {
  const prohibidas = new Set([
    'authorization', 'confirmacioncontrasena', 'contrasena', 'contrasenaactual',
    'contrasenahash', 'contrasenanueva', 'cookie', 'cookies', 'databaseurl',
    'databaseurltest', 'jwtsecret', 'refreshtoken', 'tokenhash', 'tokenrefresh'
  ]);
  const encontradas: string[] = [];
  const recorrer = (dato: unknown) => {
    if (Array.isArray(dato)) return dato.forEach(recorrer);
    if (!dato || typeof dato !== 'object') return;
    for (const [clave, contenido] of Object.entries(dato)) {
      const normalizada = clave.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (prohibidas.has(normalizada)) encontradas.push(normalizada);
      recorrer(contenido);
    }
  };
  recorrer(valor);
  return encontradas;
}

describe.sequential('autenticacion con PostgreSQL real', () => {
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

  it('inicia sesion, crea una sesion con hash y devuelve un usuario seguro', async () => {
    const respuesta = await iniciarSesion({
      correo: datos.cambioObligatorio.correo,
      contrasena: datos.contrasenaActual
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.exito).toBe(true);
    expect(typeof tokenAcceso(respuesta)).toBe('string');
    expect(respuesta.body.datos.usuario).toMatchObject({
      correo: datos.cambioObligatorio.correo,
      debeCambiarContrasena: true,
      rol: { codigo: 'ADMINISTRADOR' }
    });
    expect(clavesSensiblesPresentes(respuesta.body)).toEqual([]);
    expect(atributosCookie(respuesta)).toEqual({
      httpOnly: true,
      sameSiteLax: true,
      pathCorrecto: true,
      secure: false
    });

    const cookie = cookieSolicitud(respuesta);
    const refresh = valorCookie(cookie);
    const sesion = await prisma.sesionAutenticacion.findFirstOrThrow({
      where: { idUsuario: datos.cambioObligatorio.id }
    });
    expect(sesion.tokenHash === generarHashRefreshToken(refresh)).toBe(true);
    expect(sesion.tokenHash === refresh).toBe(false);
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: datos.cambioObligatorio.id } });
    expect(usuario.ultimoAcceso).not.toBeNull();
    expect(usuario.intentosFallidos).toBe(0);
    expect(usuario.bloqueadoHasta).toBeNull();
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { idUsuario: datos.cambioObligatorio.id, accion: 'INICIO_SESION' }
    });
    expect(auditoria.direccionIp).toBeTruthy();
    expect(JSON.stringify(auditoria.datosNuevos)).toContain(AGENTE_PRUEBAS);
  });

  it('consulta /yo y rechaza tokens ausentes, mal formados, invalidos y vencidos', async () => {
    const aplicacion = crearAplicacion();
    const login = await iniciarSesion({
      correo: datos.principal.correo,
      contrasena: datos.contrasenaActual
    }, aplicacion);
    const access = tokenAcceso(login);

    const correcta = await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${access}`);
    expect(correcta.status).toBe(200);
    expect(correcta.body.datos.usuario).toMatchObject({
      correo: datos.principal.correo,
      rol: { codigo: 'ADMINISTRADOR' },
      estudiante: null,
      docente: null
    });
    expect(clavesSensiblesPresentes(correcta.body)).toEqual([]);

    expect((await request(aplicacion).get('/api/autenticacion/yo')).status).toBe(401);
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', 'Bearer no-es-un-jwt')).status).toBe(401);

    const sesion = await prisma.sesionAutenticacion.findFirstOrThrow({ where: { idUsuario: datos.principal.id } });
    const invalido = jwt.sign(
      { rol: 'ADMINISTRADOR', sid: sesion.id.toString(), tipo: 'access' },
      'firma-ficticia-distinta-de-la-configurada-2026',
      { subject: datos.principal.id.toString(), expiresIn: '15m', algorithm: 'HS256' }
    );
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${invalido}`)).status).toBe(401);

    const vencido = jwt.sign(
      { rol: 'ADMINISTRADOR', sid: sesion.id.toString(), tipo: 'access' },
      entorno.JWT_SECRET,
      { subject: datos.principal.id.toString(), expiresIn: -1, algorithm: 'HS256' }
    );
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${vencido}`)).status).toBe(401);
  });

  it('renueva con rotacion y rechaza cookies ausentes, invalidas, vencidas o revocadas', async () => {
    const aplicacion = crearAplicacion();
    const login = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const cookieInicial = cookieSolicitud(login);
    const sesionInicial = await prisma.sesionAutenticacion.findFirstOrThrow({ where: { idUsuario: datos.principal.id } });

    const renovacion = await request(aplicacion).post('/api/autenticacion/renovar')
      .set('Cookie', cookieInicial).set('User-Agent', AGENTE_PRUEBAS);
    expect(renovacion.status).toBe(200);
    expect(typeof tokenAcceso(renovacion)).toBe('string');
    expect(clavesSensiblesPresentes(renovacion.body)).toEqual([]);
    const cookieNueva = cookieSolicitud(renovacion);
    expect(valorCookie(cookieNueva) === valorCookie(cookieInicial)).toBe(false);

    const anterior = await prisma.sesionAutenticacion.findUniqueOrThrow({ where: { id: sesionInicial.id } });
    expect(anterior.fechaRevocacion).not.toBeNull();
    expect(anterior.ultimoUsoEn).not.toBeNull();
    expect(anterior.idSesionReemplazo).not.toBeNull();
    const nueva = await prisma.sesionAutenticacion.findUniqueOrThrow({ where: { id: anterior.idSesionReemplazo! } });
    expect(nueva.tokenHash === generarHashRefreshToken(valorCookie(cookieNueva))).toBe(true);
    expect(nueva.fechaRevocacion).toBeNull();

    const sinCookie = await request(aplicacion).post('/api/autenticacion/renovar');
    expect(sinCookie.status).toBe(401);
    expect(atributosCookie(sinCookie).pathCorrecto).toBe(true);
    const invalida = await request(aplicacion).post('/api/autenticacion/renovar')
      .set('Cookie', 'gradia_refresh_token=valor-invalido');
    expect(invalida.status).toBe(401);
    expect(atributosCookie(invalida).pathCorrecto).toBe(true);

    for (const revocada of [false, true]) {
      const refresh = generarRefreshToken();
      await prisma.sesionAutenticacion.create({
        data: {
          idUsuario: datos.principal.id,
          tokenHash: generarHashRefreshToken(refresh),
          fechaExpiracion: revocada ? new Date(Date.now() + 60_000) : new Date(Date.now() - 60_000),
          fechaRevocacion: revocada ? new Date() : null,
          motivoRevocacion: revocada ? 'PRUEBA' : null
        }
      });
      const respuesta = await request(aplicacion).post('/api/autenticacion/renovar')
        .set('Cookie', `gradia_refresh_token=${refresh}`);
      expect(respuesta.status).toBe(401);
      expect(atributosCookie(respuesta).pathCorrecto).toBe(true);
    }
  });

  it('detecta reutilizacion, revoca la cadena y conserva aislada otra cuenta', async () => {
    const aplicacion = crearAplicacion();
    const loginA = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const loginOtro = await iniciarSesion({ correo: datos.secundario.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const cookieA = cookieSolicitud(loginA);
    const cookieOtro = cookieSolicitud(loginOtro);
    const rotacion = await request(aplicacion).post('/api/autenticacion/renovar').set('Cookie', cookieA);
    const cookieB = cookieSolicitud(rotacion);

    const reutilizacion = await request(aplicacion).post('/api/autenticacion/renovar').set('Cookie', cookieA);
    expect(reutilizacion.status).toBe(401);
    expect(atributosCookie(reutilizacion).pathCorrecto).toBe(true);
    expect((await request(aplicacion).post('/api/autenticacion/renovar').set('Cookie', cookieB)).status).toBe(401);
    expect((await request(aplicacion).post('/api/autenticacion/renovar').set('Cookie', cookieOtro)).status).toBe(200);

    await expect(prisma.sesionAutenticacion.count({
      where: { idUsuario: datos.principal.id, fechaRevocacion: null }
    })).resolves.toBe(0);
    await expect(prisma.sesionAutenticacion.count({
      where: { idUsuario: datos.secundario.id, fechaRevocacion: null }
    })).resolves.toBe(1);
    await expect(prisma.registroAuditoria.count({
      where: { idUsuario: datos.principal.id, accion: 'REUTILIZACION_REFRESH_TOKEN' }
    })).resolves.toBe(2);
  });

  it('cierra la sesion actual e invalida su autenticacion sin afectar otra sesion', async () => {
    const aplicacion = crearAplicacion();
    const primero = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const segundo = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const accessPrimero = tokenAcceso(primero);
    const accessSegundo = tokenAcceso(segundo);
    const cookiePrimero = cookieSolicitud(primero);
    const cookieSegundo = cookieSolicitud(segundo);

    const cerrar = () => request(aplicacion).post('/api/autenticacion/cerrar-sesion')
      .set('Authorization', `Bearer ${accessPrimero}`).set('Cookie', cookiePrimero);
    expect((await cerrar()).status).toBe(200);
    expect((await cerrar()).status).toBe(401);
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${accessPrimero}`)).status).toBe(401);
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${accessSegundo}`)).status).toBe(200);
    await expect(prisma.sesionAutenticacion.count({
      where: { idUsuario: datos.principal.id, fechaRevocacion: null }
    })).resolves.toBe(1);
    expect((await request(aplicacion).post('/api/autenticacion/renovar').set('Cookie', cookiePrimero)).status).toBe(401);
    expect((await request(aplicacion).post('/api/autenticacion/renovar').set('Cookie', cookieSegundo)).status).toBe(401);
  });

  it('cierra todas las sesiones de un usuario sin afectar otra cuenta', async () => {
    const aplicacion = crearAplicacion();
    const primero = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const segundo = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const otro = await iniciarSesion({ correo: datos.secundario.correo, contrasena: datos.contrasenaActual }, aplicacion);

    const cierre = await request(aplicacion).post('/api/autenticacion/cerrar-todas')
      .set('Authorization', `Bearer ${tokenAcceso(primero)}`)
      .set('Cookie', cookieSolicitud(primero));
    expect(cierre.status).toBe(200);
    expect(atributosCookie(cierre).pathCorrecto).toBe(true);
    await expect(prisma.sesionAutenticacion.count({
      where: { idUsuario: datos.principal.id, fechaRevocacion: null }
    })).resolves.toBe(0);
    expect((await request(aplicacion).post('/api/autenticacion/renovar')
      .set('Cookie', cookieSolicitud(segundo))).status).toBe(401);
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${tokenAcceso(otro)}`)).status).toBe(200);
  });

  it('valida y completa el cambio de contrasena revocando todas las sesiones', async () => {
    const aplicacion = crearAplicacion();
    const login = await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion);
    const access = tokenAcceso(login);
    const ruta = '/api/autenticacion/cambiar-contrasena';

    expect((await request(aplicacion).patch(ruta).send({})).status).toBe(401);
    expect((await request(aplicacion).patch(ruta).set('Authorization', `Bearer ${access}`).send({
      contrasenaActual: datos.contrasenaNueva,
      contrasenaNueva: datos.contrasenaActual,
      confirmacionContrasena: datos.contrasenaActual
    })).status).toBe(401);
    expect((await request(aplicacion).patch(ruta).set('Authorization', `Bearer ${access}`).send({
      contrasenaActual: datos.contrasenaActual,
      contrasenaNueva: datos.contrasenaNueva,
      confirmacionContrasena: `${datos.contrasenaNueva}x`
    })).status).toBe(400);
    expect((await request(aplicacion).patch(ruta).set('Authorization', `Bearer ${access}`).send({
      contrasenaActual: datos.contrasenaActual,
      contrasenaNueva: 'corta',
      confirmacionContrasena: 'corta'
    })).status).toBe(400);
    expect((await request(aplicacion).patch(ruta).set('Authorization', `Bearer ${access}`).send({
      contrasenaActual: datos.contrasenaActual,
      contrasenaNueva: datos.contrasenaActual,
      confirmacionContrasena: datos.contrasenaActual
    })).status).toBe(409);

    const correcta = await request(aplicacion).patch(ruta)
      .set('Authorization', `Bearer ${access}`).set('Cookie', cookieSolicitud(login)).send({
        contrasenaActual: datos.contrasenaActual,
        contrasenaNueva: datos.contrasenaNueva,
        confirmacionContrasena: datos.contrasenaNueva
      });
    expect(correcta.status).toBe(200);
    expect(atributosCookie(correcta).pathCorrecto).toBe(true);
    const actualizado = await prisma.usuario.findUniqueOrThrow({ where: { id: datos.principal.id } });
    expect(actualizado.contrasenaActualizadaEn).not.toBeNull();
    expect(actualizado.debeCambiarContrasena).toBe(false);
    await expect(prisma.sesionAutenticacion.count({
      where: { idUsuario: datos.principal.id, fechaRevocacion: null }
    })).resolves.toBe(0);
    expect((await request(aplicacion).get('/api/autenticacion/yo')
      .set('Authorization', `Bearer ${access}`)).status).toBe(401);
    expect((await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaActual }, aplicacion)).status).toBe(401);
    expect((await iniciarSesion({ correo: datos.principal.correo, contrasena: datos.contrasenaNueva }, aplicacion)).status).toBe(200);

    const auditorias = await prisma.registroAuditoria.findMany({ where: { idUsuario: datos.principal.id } });
    const texto = JSON.stringify(auditorias, (_clave, valor) => typeof valor === 'bigint' ? valor.toString() : valor);
    expect(texto.includes(datos.contrasenaActual)).toBe(false);
    expect(texto.includes(datos.contrasenaNueva)).toBe(false);
    expect(clavesSensiblesPresentes(auditorias)).toEqual([]);
  });

  it('mantiene mensaje generico, bloquea y desbloquea automaticamente una cuenta', async () => {
    const aplicacionGenerica = crearAplicacion();
    const inexistente = await iniciarSesion({
      correo: 'inexistente@integration.example.test',
      contrasena: datos.contrasenaNueva
    }, aplicacionGenerica);
    const inactivo = await iniciarSesion({
      correo: datos.inactivo.correo,
      contrasena: datos.contrasenaActual
    }, crearAplicacion());
    const incorrecta = await iniciarSesion({
      correo: datos.bloqueo.correo,
      contrasena: datos.contrasenaNueva
    }, aplicacionGenerica);
    expect(inexistente.status).toBe(401);
    expect(inactivo.status).toBe(401);
    expect(incorrecta.status).toBe(401);
    expect(inexistente.body.mensaje).toBe(incorrecta.body.mensaje);

    await prisma.usuario.update({
      where: { id: datos.bloqueo.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null }
    });
    const aplicacionBloqueo = crearAplicacion();
    for (let intento = 0; intento < entorno.MAX_INTENTOS_LOGIN; intento += 1) {
      const respuesta = await iniciarSesion({
        correo: datos.bloqueo.correo,
        contrasena: datos.contrasenaNueva
      }, aplicacionBloqueo);
      expect(respuesta.status).toBe(401);
    }
    const bloqueado = await prisma.usuario.findUniqueOrThrow({ where: { id: datos.bloqueo.id } });
    expect(bloqueado.intentosFallidos).toBe(entorno.MAX_INTENTOS_LOGIN);
    expect(bloqueado.bloqueadoHasta).not.toBeNull();
    expect((await iniciarSesion({
      correo: datos.bloqueo.correo,
      contrasena: datos.contrasenaActual
    }, crearAplicacion())).status).toBe(409);
    await expect(prisma.registroAuditoria.count({
      where: { idUsuario: datos.bloqueo.id, accion: 'BLOQUEO_CUENTA' }
    })).resolves.toBe(1);

    await prisma.usuario.update({
      where: { id: datos.bloqueo.id },
      data: { bloqueadoHasta: new Date(Date.now() - 1_000) }
    });
    expect((await iniciarSesion({
      correo: datos.bloqueo.correo,
      contrasena: datos.contrasenaActual
    }, crearAplicacion())).status).toBe(200);
    const desbloqueado = await prisma.usuario.findUniqueOrThrow({ where: { id: datos.bloqueo.id } });
    expect(desbloqueado.intentosFallidos).toBe(0);
    expect(desbloqueado.bloqueadoHasta).toBeNull();
  });

  it('responde 429 al superar el limite sin revelar si el usuario existe', async () => {
    const aplicacion = crearAplicacion();
    const estados: number[] = [];
    for (let intento = 0; intento <= entorno.MAX_INTENTOS_LOGIN; intento += 1) {
      const respuesta = await iniciarSesion({
        correo: 'rate-limit@integration.example.test',
        contrasena: datos.contrasenaNueva
      }, aplicacion);
      estados.push(respuesta.status);
    }
    expect(estados.slice(0, -1).every((estado) => estado === 401)).toBe(true);
    expect(estados.at(-1)).toBe(429);
  });
});
