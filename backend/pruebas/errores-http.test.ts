import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ErrorConflicto, ErrorServicioNoDisponible, ErrorValidacion } from '../src/compartido/errores/error-aplicacion.js';
import { manejadorAsincrono } from '../src/compartido/utilidades/manejador-asincrono.js';
import { manejadorErrores } from '../src/middlewares/manejador-errores.js';
import { rutaNoEncontrada } from '../src/middlewares/ruta-no-encontrada.js';

function crearAppDeErrores(tipo: '400' | '409' | '500' | '503') {
  const app = express();
  app.get('/error', manejadorAsincrono(async () => {
    if (tipo === '400') throw new ErrorValidacion('Dato invalido');
    if (tipo === '409') throw new ErrorConflicto('Conflicto de negocio');
    if (tipo === '503') throw new ErrorServicioNoDisponible('Dependencia no disponible');
    throw new Error('detalle interno sensible');
  }));
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
}

describe('middleware central de errores', () => {
  it.each([['400', 400], ['409', 409], ['500', 500], ['503', 503]] as const)(
    'responde el error %s con su codigo HTTP', async (tipo, codigo) => {
      const respuesta = await request(crearAppDeErrores(tipo)).get('/error');
      expect(respuesta.status).toBe(codigo);
      expect(respuesta.body.exito).toBe(false);
      expect(respuesta.body.errores).toEqual([]);
      expect(JSON.stringify(respuesta.body)).not.toContain('detalle interno sensible');
    }
  );

  it('responde 404 mediante el middleware central', async () => {
    const respuesta = await request(crearAppDeErrores('500')).get('/no-existe');
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('NO_ENCONTRADO');
  });
});
