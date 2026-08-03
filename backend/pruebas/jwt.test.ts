import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { entorno } from '../src/configuracion/entorno.js';
import { generarTokenAcceso, validarTokenAcceso } from '../src/modulos/autenticacion/servicios/jwt.servicio.js';

describe('servicio JWT de acceso', () => {
  it('genera y valida un payload minimo y tipado', () => {
    const token = generarTokenAcceso({ idUsuario: 25n, codigoRol: 'ADMINISTRADOR', idSesion: 7n });
    const payload = validarTokenAcceso(token);
    expect(payload).toMatchObject({ sub: '25', rol: 'ADMINISTRADOR', sid: '7', tipo: 'access' });
    expect(payload).not.toHaveProperty('correo');
    expect(payload).not.toHaveProperty('contrasena');
  });

  it('rechaza tokens invalidos', () => expect(() => validarTokenAcceso('token.invalido')).toThrow());

  it('rechaza tokens vencidos', () => {
    const token = jwt.sign({ rol: 'DOCENTE', sid: '2', tipo: 'access' }, entorno.JWT_SECRET, {
      subject: '1', algorithm: 'HS256', expiresIn: -1
    });
    expect(() => validarTokenAcceso(token)).toThrow();
  });

  it('rechaza payloads con campos o roles incorrectos', () => {
    const token = jwt.sign({ rol: 'SUPERUSUARIO', sid: '2', tipo: 'access', correo: 'x@y.test' }, entorno.JWT_SECRET, {
      subject: '1', algorithm: 'HS256', expiresIn: '15m'
    });
    expect(() => validarTokenAcceso(token)).toThrow();
  });
});
