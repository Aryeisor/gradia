const NOMBRE_BASE_PRUEBAS = 'gradia_test';

export function exigirUrlBasePruebas(
  variables: { DATABASE_URL_TEST?: string } = process.env
): string {
  const valor = variables.DATABASE_URL_TEST;
  if (!valor) {
    throw new Error('DATABASE_URL_TEST es obligatoria para ejecutar pruebas de integracion');
  }

  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    throw new Error('DATABASE_URL_TEST no es una URL valida');
  }

  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL_TEST debe utilizar PostgreSQL');
  }

  let nombreBase: string;
  try {
    nombreBase = decodeURIComponent(url.pathname.replace(/^\//, ''));
  } catch {
    throw new Error('DATABASE_URL_TEST contiene un nombre de base inválido');
  }

  if (nombreBase !== NOMBRE_BASE_PRUEBAS) {
    throw new Error(`Las pruebas de integracion exigen la base ${NOMBRE_BASE_PRUEBAS}`);
  }

  return valor;
}

export function configurarEntornoPruebas(urlBasePruebas: string): void {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = urlBasePruebas;
  process.env.JWT_SECRET = 'secreto-tecnico-exclusivo-para-pruebas-gradia-2026';
  process.env.JWT_ACCESS_EXPIRACION = '15m';
  process.env.REFRESH_TOKEN_DIAS = '7';
  process.env.REFRESH_TOKEN_COOKIE = 'gradia_refresh_token';
  process.env.MAX_INTENTOS_LOGIN = '5';
  process.env.MINUTOS_BLOQUEO_LOGIN = '15';
  process.env.BCRYPT_COSTO = '10';
  process.env.ORIGEN_FRONTEND = 'http://localhost:5173';
  process.env.ADMIN_INICIAL_CORREO = '';
  process.env.ADMIN_INICIAL_CONTRASENA = '';
}
