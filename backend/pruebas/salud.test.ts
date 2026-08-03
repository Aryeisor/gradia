import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PUERTO = '3000';
process.env.DATABASE_URL = 'postgresql://usuario:contrasena@localhost:5432/gradia_test';
process.env.ORIGEN_FRONTEND = 'http://localhost:5173';
process.env.JWT_SECRET = 'secreto_seguro_para_pruebas_de_gradia';

vi.mock('../src/infraestructura/prisma/cliente-prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn()
  }
}));

const { prisma } = await import('../src/infraestructura/prisma/cliente-prisma.js');
const { crearAplicacion } = await import('../src/app.js');

describe('API de salud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde exitosamente cuando PostgreSQL esta disponible', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);
    const respuesta = await request(crearAplicacion()).get('/api/salud');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.baseDatos).toBe('conectada');
  });

  it('responde 503 cuando PostgreSQL no esta disponible', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('sin conexion'));
    const respuesta = await request(crearAplicacion()).get('/api/salud');

    expect(respuesta.status).toBe(503);
    expect(respuesta.body.exito).toBe(false);
    expect(respuesta.body.datos).toEqual({ api: 'operativa', baseDatos: 'desconectada' });
  });

  it('responde ruta no encontrada', async () => {
    const respuesta = await request(crearAplicacion()).get('/api/no-existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe('Ruta no encontrada');
  });
});
