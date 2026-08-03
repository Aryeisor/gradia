import { describe, expect, it } from 'vitest';
import { esquemaEntorno } from '../src/configuracion/entorno.js';

const base = {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://usuario:secreto@localhost:5432/gradia_test',
  JWT_SECRET: 'secreto_seguro_para_pruebas_de_gradia'
};

describe('variables del administrador inicial', () => {
  it('permite ambas variables ausentes', () => expect(esquemaEntorno.safeParse(base).success).toBe(true));
  it('permite ambas variables validas', () => expect(esquemaEntorno.safeParse({ ...base, ADMIN_INICIAL_CORREO: 'admin@gradia.local', ADMIN_INICIAL_CONTRASENA: 'UnaClaveSegura2026' }).success).toBe(true));
  it('rechaza solo correo', () => expect(esquemaEntorno.safeParse({ ...base, ADMIN_INICIAL_CORREO: 'admin@gradia.local' }).success).toBe(false));
  it('rechaza solo contrasena', () => expect(esquemaEntorno.safeParse({ ...base, ADMIN_INICIAL_CONTRASENA: 'UnaClaveSegura2026' }).success).toBe(false));
  it('rechaza correo invalido', () => expect(esquemaEntorno.safeParse({ ...base, ADMIN_INICIAL_CORREO: 'invalido', ADMIN_INICIAL_CONTRASENA: 'UnaClaveSegura2026' }).success).toBe(false));
  it('rechaza contrasena corta', () => expect(esquemaEntorno.safeParse({ ...base, ADMIN_INICIAL_CORREO: 'admin@gradia.local', ADMIN_INICIAL_CONTRASENA: 'corta' }).success).toBe(false));
  it('rechaza marcadores inseguros en produccion', () => expect(esquemaEntorno.safeParse({ ...base, NODE_ENV: 'production', ADMIN_INICIAL_CORREO: 'admin@gradia.local', ADMIN_INICIAL_CONTRASENA: 'reemplazar_password_2026' }).success).toBe(false));
});

describe('variables de autenticacion', () => {
  it('acepta valores JWT, refresh, bloqueo y bcrypt validos', () => {
    expect(
      esquemaEntorno.safeParse({
        ...base,
        JWT_ACCESS_EXPIRACION: '15m',
        REFRESH_TOKEN_DIAS: '7',
        MAX_INTENTOS_LOGIN: '5',
        MINUTOS_BLOQUEO_LOGIN: '15',
        BCRYPT_COSTO: '12'
      }).success
    ).toBe(true);
  });

  it.each(['quince-minutos', '15', '0m', 'm15'])('rechaza expiracion JWT invalida: %s', (valor) => {
    expect(esquemaEntorno.safeParse({ ...base, JWT_ACCESS_EXPIRACION: valor }).success).toBe(false);
  });

  it('rechaza un secreto JWT corto', () => {
    expect(esquemaEntorno.safeParse({ ...base, JWT_SECRET: 'secreto-corto' }).success).toBe(false);
  });

  it.each([9, 15])('rechaza costo bcrypt fuera del rango: %s', (costo) => {
    expect(esquemaEntorno.safeParse({ ...base, BCRYPT_COSTO: costo }).success).toBe(false);
  });

  it.each([
    ['REFRESH_TOKEN_DIAS', 0],
    ['MAX_INTENTOS_LOGIN', 0],
    ['MINUTOS_BLOQUEO_LOGIN', -1]
  ])('rechaza %s cuando no es positivo', (variable, valor) => {
    expect(esquemaEntorno.safeParse({ ...base, [variable]: valor }).success).toBe(false);
  });
});
