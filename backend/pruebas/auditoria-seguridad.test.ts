import { describe, expect, it } from 'vitest';
import { sanitizarDatosAuditoria } from '../src/modulos/autenticacion/servicios/auditoria-seguridad.servicio.js';

describe('auditoria de seguridad', () => {
  it('elimina secretos de objetos anidados y conserva datos permitidos', () => {
    const resultado = sanitizarDatosAuditoria({
      accion: 'LOGIN', contrasena: 'secreto', tokenHash: 'hash',
      anidado: { JWT_SECRET: 'secreto', idUsuario: 25n },
      lista: [{ tokenRefresh: 'token' }, { estado: true }]
    });
    expect(resultado).toEqual({
      accion: 'LOGIN', anidado: { idUsuario: '25' }, lista: [{}, { estado: true }]
    });
  });
});
