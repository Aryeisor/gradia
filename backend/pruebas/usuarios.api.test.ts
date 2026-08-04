import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generarTokenAcceso } from '../src/modulos/autenticacion/servicios/jwt.servicio.js';

const servicios = vi.hoisted(() => ({
  listarUsuarios: vi.fn(),
  consultarUsuario: vi.fn(),
  crearUsuario: vi.fn(),
  actualizarUsuario: vi.fn(),
  cambiarEstadoUsuario: vi.fn(),
  restablecerContrasenaUsuario: vi.fn()
}));

const acceso = vi.hoisted(() => ({
  buscarUsuario: vi.fn(),
  buscarSesion: vi.fn()
}));

vi.mock('../src/modulos/usuarios/usuarios.servicio.js', () => servicios);
vi.mock('../src/infraestructura/prisma/cliente-prisma.js', () => ({
  prisma: {
    usuario: { findUnique: acceso.buscarUsuario },
    sesionAutenticacion: { findUnique: acceso.buscarSesion }
  }
}));

import { crearAplicacion } from '../src/app.js';

const app = crearAplicacion();
const token = generarTokenAcceso({ idUsuario: 1n, codigoRol: 'ADMINISTRADOR', idSesion: 2n });
const usuarioSeguro = {
  id: 10n,
  nombres: 'Ada',
  apellidos: 'Lovelace',
  correo: 'ada@example.test',
  estado: true,
  debeCambiarContrasena: true,
  rol: { codigo: 'DOCENTE', nombre: 'Docente' },
  docente: { id: 20n, codigoDocente: 'DOC-10' },
  estudiante: null
};

function autorizacion() {
  return { Authorization: `Bearer ${token}` };
}

function usuarioAutenticado(rol = 'ADMINISTRADOR', debeCambiarContrasena = false) {
  return {
    id: 1n,
    estado: true,
    debeCambiarContrasena,
    contrasenaActualizadaEn: null,
    rol: { codigo: rol }
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  acceso.buscarUsuario.mockResolvedValue(usuarioAutenticado());
  acceso.buscarSesion.mockResolvedValue({
    id: 2n,
    idUsuario: 1n,
    fechaRevocacion: null,
    fechaExpiracion: new Date(Date.now() + 60_000)
  });
  servicios.listarUsuarios.mockResolvedValue({
    usuarios: [usuarioSeguro],
    paginacion: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 }
  });
  servicios.consultarUsuario.mockResolvedValue(usuarioSeguro);
  servicios.crearUsuario.mockResolvedValue(usuarioSeguro);
  servicios.actualizarUsuario.mockResolvedValue(usuarioSeguro);
  servicios.cambiarEstadoUsuario.mockResolvedValue(usuarioSeguro);
  servicios.restablecerContrasenaUsuario.mockResolvedValue(undefined);
});

describe('API administrativa de usuarios', () => {
  it('permite al administrador listar con paginacion, busqueda y filtros transformados', async () => {
    const respuesta = await request(app).get(
      '/api/usuarios?pagina=2&limite=5&buscar=Ada&rol=DOCENTE&estado=true'
    ).set(autorizacion());
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.paginacion.total).toBe(1);
    expect(servicios.listarUsuarios).toHaveBeenCalledWith({
      pagina: 2,
      limite: 5,
      buscar: 'Ada',
      rol: 'DOCENTE',
      estado: true
    });
  });

  it('responde 401 cuando no existe autenticacion', async () => {
    expect((await request(app).get('/api/usuarios')).status).toBe(401);
  });

  it.each(['DOCENTE', 'ESTUDIANTE'])('responde 403 para el rol %s', async (rol) => {
    acceso.buscarUsuario.mockResolvedValue(usuarioAutenticado(rol));
    const respuesta = await request(app).get('/api/usuarios').set(autorizacion());
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('ROL_NO_AUTORIZADO');
  });

  it('exige superar el cambio obligatorio antes de autorizar el rol', async () => {
    acceso.buscarUsuario.mockResolvedValue(usuarioAutenticado('ADMINISTRADOR', true));
    const respuesta = await request(app).get('/api/usuarios').set(autorizacion());
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('CAMBIO_CONTRASENA_REQUERIDO');
  });

  it('consulta detalle sin exponer credenciales', async () => {
    const respuesta = await request(app).get('/api/usuarios/10').set(autorizacion());
    expect(respuesta.status).toBe(200);
    expect(servicios.consultarUsuario).toHaveBeenCalledWith(10n);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/contrasenaHash|tokenHash|refreshToken/);
  });

  it('crea un docente con perfil compatible', async () => {
    const respuesta = await request(app).post('/api/usuarios').set(autorizacion()).send({
      nombres: 'Ada',
      apellidos: 'Lovelace',
      tipoDocumento: 'CC',
      numeroDocumento: 'DOC-100',
      correo: 'ADA@example.test',
      contrasenaTemporal: 'Temporal-Segura-2026!X',
      rol: 'DOCENTE',
      perfil: { codigoDocente: 'PROF-100', especialidad: 'Matematicas' }
    });
    expect(respuesta.status).toBe(201);
    expect(servicios.crearUsuario).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'ada@example.test', rol: 'DOCENTE' }),
      expect.objectContaining({ idAdministrador: 1n })
    );
  });

  it('rechaza un perfil incompatible antes de invocar el servicio', async () => {
    const respuesta = await request(app).post('/api/usuarios').set(autorizacion()).send({
      nombres: 'Ada', apellidos: 'Lovelace', tipoDocumento: 'CC', numeroDocumento: 'DOC-101',
      correo: 'ada101@example.test', contrasenaTemporal: 'Temporal-Segura-2026!X',
      rol: 'DOCENTE', perfil: { codigoEstudiante: 'EST-101', fechaNacimiento: '2010-01-01' }
    });
    expect(respuesta.status).toBe(400);
    expect(servicios.crearUsuario).not.toHaveBeenCalled();
  });

  it('actualiza datos permitidos y rechaza el cambio general de rol', async () => {
    const correcta = await request(app).patch('/api/usuarios/10').set(autorizacion()).send({
      nombres: 'Augusta', perfil: { especialidad: 'Geometria' }
    });
    expect(correcta.status).toBe(200);
    expect(servicios.actualizarUsuario).toHaveBeenCalledWith(
      10n,
      expect.objectContaining({ nombres: 'Augusta' }),
      expect.objectContaining({ idAdministrador: 1n })
    );

    const rol = await request(app).patch('/api/usuarios/10').set(autorizacion()).send({
      rol: 'ADMINISTRADOR'
    });
    expect(rol.status).toBe(400);
  });

  it('cambia estado y exige un motivo', async () => {
    const respuesta = await request(app).patch('/api/usuarios/10/estado').set(autorizacion()).send({
      estado: false,
      motivo: 'Retiro administrativo'
    });
    expect(respuesta.status).toBe(200);
    expect(servicios.cambiarEstadoUsuario).toHaveBeenCalledWith(
      10n,
      { estado: false, motivo: 'Retiro administrativo' },
      expect.objectContaining({ idAdministrador: 1n })
    );
    expect((await request(app).patch('/api/usuarios/10/estado').set(autorizacion()).send({
      estado: false
    })).status).toBe(400);
  });

  it('restablece una contrasena sin incluirla en la respuesta', async () => {
    const respuesta = await request(app).post('/api/usuarios/10/restablecer-contrasena')
      .set(autorizacion()).send({
        contrasenaTemporal: 'Nueva-Temporal-2026!X',
        confirmacionContrasena: 'Nueva-Temporal-2026!X'
      });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toBeUndefined();
    expect(JSON.stringify(respuesta.body)).not.toContain('Nueva-Temporal-2026!X');
    expect(servicios.restablecerContrasenaUsuario).toHaveBeenCalled();
  });
});
