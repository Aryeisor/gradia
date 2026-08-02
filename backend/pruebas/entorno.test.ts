import { describe, expect, it } from 'vitest';
import { esquemaEntorno } from '../src/configuracion/entorno.js';

const base = {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://usuario:secreto@localhost:5432/gradia_test',
  JWT_SECRET: 'secreto_seguro_para_pruebas'
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
