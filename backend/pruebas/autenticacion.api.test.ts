import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorConflicto, ErrorNoAutenticado } from '../src/compartido/errores/error-aplicacion.js';
import { generarTokenAcceso } from '../src/modulos/autenticacion/servicios/jwt.servicio.js';

const servicios = vi.hoisted(() => ({
  iniciarSesion: vi.fn(),
  renovarAutenticacion: vi.fn(),
  consultarUsuarioActual: vi.fn(),
  cerrarSesionActual: vi.fn(),
  cerrarTodasLasSesiones: vi.fn(),
  cambiarContrasena: vi.fn()
}));

const acceso = vi.hoisted(() => ({
  buscarUsuario: vi.fn(),
  buscarSesion: vi.fn()
}));

vi.mock('../src/modulos/autenticacion/autenticacion.servicio.js', () => servicios);
vi.mock('../src/infraestructura/prisma/cliente-prisma.js', () => ({
  prisma: {
    usuario: { findUnique: acceso.buscarUsuario },
    sesionAutenticacion: { findUnique: acceso.buscarSesion }
  }
}));

import { crearAplicacion } from '../src/app.js';
import { manejadorErrores } from '../src/middlewares/manejador-errores.js';
import { crearLimitadorLogin } from '../src/modulos/autenticacion/configuracion/limitador-login.js';

const app = crearAplicacion();
const accessToken = generarTokenAcceso({ idUsuario: 1n, codigoRol: 'ADMINISTRADOR', idSesion: 2n });
const usuarioSeguro = {
  id: 1n, nombres: 'Ada', apellidos: 'Lovelace', correo: 'ada@gradia.com',
  rol: { codigo: 'ADMINISTRADOR', nombre: 'Administrador' }, debeCambiarContrasena: true
};

beforeEach(() => {
  vi.resetAllMocks();
  acceso.buscarUsuario.mockResolvedValue({
    id: 1n,
    estado: true,
    debeCambiarContrasena: true,
    contrasenaActualizadaEn: null,
    rol: { codigo: 'ADMINISTRADOR' }
  });
  acceso.buscarSesion.mockResolvedValue({
    id: 2n,
    idUsuario: 1n,
    fechaRevocacion: null,
    fechaExpiracion: new Date(Date.now() + 60_000)
  });
  servicios.iniciarSesion.mockResolvedValue({ tokenAcceso: accessToken, refreshToken: 'a'.repeat(64), usuario: usuarioSeguro });
  servicios.renovarAutenticacion.mockResolvedValue({ tokenAcceso: accessToken, refreshToken: 'b'.repeat(64) });
  servicios.consultarUsuarioActual.mockResolvedValue({ ...usuarioSeguro, estudiante: null, docente: null });
  servicios.cerrarSesionActual.mockResolvedValue(undefined);
  servicios.cerrarTodasLasSesiones.mockResolvedValue(undefined);
  servicios.cambiarContrasena.mockResolvedValue(undefined);
});

describe('API de autenticacion', () => {
  it('inicia sesion, normaliza correo y establece cookie HttpOnly', async () => {
    const respuesta = await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: '  ADA@GRADIA.COM ', contrasena: 'Clave-Segura-2026!'
    });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.usuario.id).toBe('1');
    expect(respuesta.body.datos).not.toHaveProperty('refreshToken');
    expect(respuesta.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(servicios.iniciarSesion).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'ada@gradia.com' }), expect.any(Object)
    );
  });

  it.each([
    ['contrasena incorrecta', new ErrorNoAutenticado('Correo o contrasena incorrectos'), 401],
    ['correo inexistente', new ErrorNoAutenticado('Correo o contrasena incorrectos'), 401],
    ['usuario inactivo', new ErrorNoAutenticado('Correo o contrasena incorrectos'), 401],
    ['cuenta bloqueada', new ErrorConflicto('No fue posible iniciar sesion en este momento'), 409]
  ])('responde de forma controlada para %s', async (_caso, error, estado) => {
    servicios.iniciarSesion.mockRejectedValueOnce(error);
    const respuesta = await request(app).post('/api/autenticacion/iniciar-sesion').send({
      correo: 'usuario@gradia.com', contrasena: 'Clave-Incorrecta-2026!'
    });
    expect(respuesta.status).toBe(estado);
    expect(respuesta.body).toMatchObject({ exito: false });
  });

  it('rechaza una entrada de login invalida con 400', async () => {
    const respuesta = await request(app).post('/api/autenticacion/iniciar-sesion').send({ correo: 'invalido' });
    expect(respuesta.status).toBe(400);
    expect(servicios.iniciarSesion).not.toHaveBeenCalled();
  });

  it('renueva y rota la cookie', async () => {
    const respuesta = await request(app).post('/api/autenticacion/renovar')
      .set('Cookie', 'gradia_refresh_token=' + 'a'.repeat(64));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.tokenAcceso).toBe(accessToken);
    expect(respuesta.headers['set-cookie'][0]).toContain('gradia_refresh_token=');
    expect(servicios.renovarAutenticacion).toHaveBeenCalledWith('a'.repeat(64), expect.any(Object));
  });

  it.each(['vencido', 'revocado', 'reutilizado'])('borra cookie ante refresh %s', async () => {
    servicios.renovarAutenticacion.mockRejectedValueOnce(new ErrorNoAutenticado('Sesion de renovacion invalida'));
    const respuesta = await request(app).post('/api/autenticacion/renovar')
      .set('Cookie', 'gradia_refresh_token=' + 'a'.repeat(64));
    expect(respuesta.status).toBe(401);
    expect(respuesta.headers['set-cookie'][0]).toMatch(/gradia_refresh_token=;/);
  });

  it('consulta el usuario con bearer token valido', async () => {
    const respuesta = await request(app).get('/api/autenticacion/yo').set('Authorization', `Bearer ${accessToken}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.usuario.rol.codigo).toBe('ADMINISTRADOR');
  });

  it('rechaza consultar el usuario sin token', async () => {
    expect((await request(app).get('/api/autenticacion/yo')).status).toBe(401);
  });

  it('cierra la sesion actual de forma idempotente y borra cookie', async () => {
    const respuesta = await request(app).post('/api/autenticacion/cerrar-sesion').set('Authorization', `Bearer ${accessToken}`);
    expect(respuesta.status).toBe(200);
    expect(servicios.cerrarSesionActual).toHaveBeenCalled();
    expect(respuesta.headers['set-cookie'][0]).toMatch(/gradia_refresh_token=;/);
  });

  it('cierra todas las sesiones', async () => {
    const respuesta = await request(app).post('/api/autenticacion/cerrar-todas').set('Authorization', `Bearer ${accessToken}`);
    expect(respuesta.status).toBe(200);
    expect(servicios.cerrarTodasLasSesiones).toHaveBeenCalled();
  });

  it('cambia la contrasena, revoca sesiones y exige nuevo login', async () => {
    const respuesta = await request(app).patch('/api/autenticacion/cambiar-contrasena')
      .set('Authorization', `Bearer ${accessToken}`).send({
        contrasenaActual: 'Clave-Segura-2026!',
        contrasenaNueva: 'Nueva-Clave-Segura-2026!',
        confirmacionContrasena: 'Nueva-Clave-Segura-2026!'
      });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toContain('Inicie sesion nuevamente');
    expect(servicios.cambiarContrasena).toHaveBeenCalled();
  });

  it('rechaza confirmacion de contrasena diferente', async () => {
    const respuesta = await request(app).patch('/api/autenticacion/cambiar-contrasena')
      .set('Authorization', `Bearer ${accessToken}`).send({
        contrasenaActual: 'Clave-Segura-2026!', contrasenaNueva: 'Nueva-Clave-Segura-2026!',
        confirmacionContrasena: 'Otra-Clave-Segura-2026!'
      });
    expect(respuesta.status).toBe(400);
    expect(servicios.cambiarContrasena).not.toHaveBeenCalled();
  });
});

describe('limitador de login', () => {
  it('responde 429 al superar el limite de solicitudes fallidas', async () => {
    const aplicacion = express();
    aplicacion.post('/login', crearLimitadorLogin(), (_req, res) => res.status(401).json({ exito: false }));
    aplicacion.use(manejadorErrores);
    let estado = 0;
    for (let intento = 0; intento <= 5; intento += 1) {
      estado = (await request(aplicacion).post('/login')).status;
    }
    expect(estado).toBe(429);
  });
});
