import { describe, expect, it } from 'vitest';
import { sanitizarDatosAuditoria } from '../src/modulos/autenticacion/servicios/auditoria-seguridad.servicio.js';

describe('auditoria de seguridad', () => {
  it('elimina secretos de objetos anidados y conserva datos permitidos', () => {
    const resultado = sanitizarDatosAuditoria({
      accion: 'LOGIN',
      contrasena: 'valor-ficticio',
      contrasenaActual: 'valor-ficticio',
      contrasenaNueva: 'valor-ficticio',
      confirmacionContrasena: 'valor-ficticio',
      contrasena_hash: 'valor-ficticio',
      tokenAcceso: 'valor-ficticio',
      refreshToken: 'valor-ficticio',
      token_hash: 'valor-ficticio',
      Cookie: 'valor-ficticio',
      Authorization: 'valor-ficticio',
      DATABASE_URL: 'valor-ficticio',
      DATABASE_URL_TEST: 'valor-ficticio',
      anidado: { JWT_SECRET: 'valor-ficticio', idUsuario: 25n },
      lista: [{ tokenRefresh: 'valor-ficticio' }, { estado: true }]
    });
    expect(resultado).toEqual({
      accion: 'LOGIN', anidado: { idUsuario: '25' }, lista: [{}, { estado: true }]
    });
  });
});
