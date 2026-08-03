import express, { RequestHandler } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ErrorNoAutenticado
} from '../src/compartido/errores/error-aplicacion.js';
import { manejadorErrores } from '../src/middlewares/manejador-errores.js';

const acceso = vi.hoisted(() => ({
  buscarUsuario: vi.fn(),
  buscarSesion: vi.fn(),
  validarToken: vi.fn()
}));

vi.mock('../src/infraestructura/prisma/cliente-prisma.js', () => ({
  prisma: {
    usuario: { findUnique: acceso.buscarUsuario },
    sesionAutenticacion: { findUnique: acceso.buscarSesion }
  }
}));
vi.mock('../src/modulos/autenticacion/servicios/jwt.servicio.js', () => ({
  validarTokenAcceso: acceso.validarToken
}));

import {
  autenticar,
  autorizarRoles,
  exigirContrasenaActualizada
} from '../src/modulos/autenticacion/autenticacion.middleware.js';
import { UsuarioAutenticado } from '../src/modulos/autenticacion/tipos/control-acceso.tipos.js';

const ahoraSegundos = Math.floor(Date.now() / 1000);
const payloadValido = {
  sub: '1', sid: '2', rol: 'ADMINISTRADOR' as const, tipo: 'access' as const,
  iat: ahoraSegundos, exp: ahoraSegundos + 900
};

function usuarioValido() {
  return {
    id: 1n,
    estado: true,
    debeCambiarContrasena: false,
    contrasenaActualizadaEn: new Date(ahoraSegundos * 1000 + 500),
    rol: { codigo: 'ADMINISTRADOR' }
  };
}

function sesionValida() {
  return {
    id: 2n,
    idUsuario: 1n,
    fechaRevocacion: null,
    fechaExpiracion: new Date(Date.now() + 60_000)
  };
}

function aplicacionAutenticacion() {
  const app = express();
  app.get('/protegida', autenticar, (req, res) => {
    const identidad = req.usuarioAutenticado;
    return res.json({
      identidad: identidad && {
        ...identidad,
        id: identidad.id.toString(),
        idSesion: identidad.idSesion.toString()
      }
    });
  });
  app.use(manejadorErrores);
  return app;
}

beforeEach(() => {
  vi.resetAllMocks();
  acceso.validarToken.mockReturnValue(payloadValido);
  acceso.buscarUsuario.mockResolvedValue(usuarioValido());
  acceso.buscarSesion.mockResolvedValue(sesionValida());
});

describe('middleware autenticar', () => {
  it.each([
    ['ausente', undefined],
    ['sin Bearer', 'token'],
    ['Bearer vacio', 'Bearer '],
    ['esquema distinto', 'Basic token'],
    ['espacios adicionales', 'Bearer token adicional']
  ])('rechaza Authorization %s', async (_caso, encabezado) => {
    const solicitud = request(aplicacionAutenticacion()).get('/protegida');
    if (encabezado) solicitud.set('Authorization', encabezado);
    const respuesta = await solicitud;
    expect(respuesta.status).toBe(401);
    expect(respuesta.body).not.toHaveProperty('datos');
  });

  it.each([
    ['invalido', new ErrorNoAutenticado('Token invalido', 'TOKEN_INVALIDO'), 'TOKEN_INVALIDO'],
    ['vencido', new ErrorNoAutenticado('Token vencido', 'TOKEN_VENCIDO'), 'TOKEN_VENCIDO']
  ])('propaga el codigo para JWT %s', async (_caso, error, codigo) => {
    acceso.validarToken.mockImplementation(() => { throw error; });
    const respuesta = await request(aplicacionAutenticacion()).get('/protegida')
      .set('Authorization', 'Bearer token-ficticio');
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe(codigo);
  });

  it.each([
    ['sub invalido', { sub: '0' }],
    ['sid invalido', { sid: '-1' }]
  ])('rechaza %s', async (_caso, cambio) => {
    acceso.validarToken.mockReturnValue({ ...payloadValido, ...cambio });
    const respuesta = await request(aplicacionAutenticacion()).get('/protegida')
      .set('Authorization', 'Bearer token-ficticio');
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('TOKEN_INVALIDO');
  });

  it.each([
    ['inexistente', null],
    ['inactivo', { ...usuarioValido(), estado: false }]
  ])('rechaza usuario %s', async (_caso, usuario) => {
    acceso.buscarUsuario.mockResolvedValue(usuario);
    const respuesta = await request(aplicacionAutenticacion()).get('/protegida')
      .set('Authorization', 'Bearer token-ficticio');
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('USUARIO_INACTIVO');
  });

  it.each([
    ['inexistente', null],
    ['de otro usuario', { ...sesionValida(), idUsuario: 99n }],
    ['revocada', { ...sesionValida(), fechaRevocacion: new Date() }],
    ['vencida', { ...sesionValida(), fechaExpiracion: new Date(Date.now() - 1) }]
  ])('rechaza sesion %s', async (_caso, sesion) => {
    acceso.buscarSesion.mockResolvedValue(sesion);
    const respuesta = await request(aplicacionAutenticacion()).get('/protegida')
      .set('Authorization', 'Bearer token-ficticio');
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('SESION_INVALIDA');
  });

  it('rechaza credenciales actualizadas en un segundo posterior al iat', async () => {
    acceso.buscarUsuario.mockResolvedValue({
      ...usuarioValido(),
      contrasenaActualizadaEn: new Date((payloadValido.iat + 1) * 1000)
    });
    const respuesta = await request(aplicacionAutenticacion()).get('/protegida')
      .set('Authorization', 'Bearer token-ficticio');
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('CREDENCIALES_DESACTUALIZADAS');
  });

  it('acepta el mismo segundo y agrega solo la identidad segura con el rol actual', async () => {
    acceso.buscarUsuario.mockResolvedValue({
      ...usuarioValido(),
      rol: { codigo: 'DOCENTE' },
      debeCambiarContrasena: true
    });
    const respuesta = await request(aplicacionAutenticacion()).get('/protegida')
      .set('Authorization', 'Bearer token-ficticio');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.identidad).toEqual({
      id: '1', rol: 'DOCENTE', idSesion: '2', debeCambiarContrasena: true
    });
    expect(Object.keys(respuesta.body.identidad).sort()).toEqual([
      'debeCambiarContrasena', 'id', 'idSesion', 'rol'
    ]);
  });
});

function aplicacionControlAcceso(
  identidad: UsuarioAutenticado | undefined,
  middlewares: RequestHandler[]
) {
  const app = express();
  app.use((req, _res, next) => { req.usuarioAutenticado = identidad; next(); });
  app.get('/recurso', ...middlewares, (_req, res) => res.status(204).send());
  app.use(manejadorErrores);
  return app;
}

const identidadBase: UsuarioAutenticado = {
  id: 1n, idSesion: 2n, rol: 'ADMINISTRADOR', debeCambiarContrasena: false
};

describe('middleware autorizarRoles', () => {
  it('devuelve 401 sin identidad', async () => {
    const respuesta = await request(aplicacionControlAcceso(undefined, [autorizarRoles('ADMINISTRADOR')]))
      .get('/recurso');
    expect(respuesta.status).toBe(401);
  });

  it.each([
    ['ADMINISTRADOR', ['ADMINISTRADOR']],
    ['DOCENTE', ['ADMINISTRADOR', 'DOCENTE']],
    ['ESTUDIANTE', ['ESTUDIANTE']]
  ] as const)('permite el rol %s', async (rol, roles) => {
    const respuesta = await request(aplicacionControlAcceso(
      { ...identidadBase, rol },
      [autorizarRoles(...roles)]
    )).get('/recurso');
    expect(respuesta.status).toBe(204);
  });

  it('devuelve 403 con rol actual no autorizado', async () => {
    const respuesta = await request(aplicacionControlAcceso(
      { ...identidadBase, rol: 'DOCENTE' },
      [autorizarRoles('ADMINISTRADOR')]
    )).get('/recurso');
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('ROL_NO_AUTORIZADO');
  });
});

describe('middleware exigirContrasenaActualizada', () => {
  it('permite continuar sin cambio pendiente', async () => {
    const respuesta = await request(aplicacionControlAcceso(
      identidadBase,
      [exigirContrasenaActualizada]
    )).get('/recurso');
    expect(respuesta.status).toBe(204);
  });

  it('bloquea con 403 y codigo estable cuando el cambio esta pendiente', async () => {
    const respuesta = await request(aplicacionControlAcceso(
      { ...identidadBase, debeCambiarContrasena: true },
      [exigirContrasenaActualizada]
    )).get('/recurso');
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('CAMBIO_CONTRASENA_REQUERIDO');
  });
});
