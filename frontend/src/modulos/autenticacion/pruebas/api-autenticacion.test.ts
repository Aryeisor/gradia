import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { configurarIntercepcionAutenticacion, crearClienteApi } from '../../../servicios/api';

function rechazo401(
  configuracion: InternalAxiosRequestConfig,
  codigo = 'TOKEN_VENCIDO'
): AxiosError {
  return new AxiosError(
    'No autenticado',
    'ERR_BAD_REQUEST',
    configuracion,
    undefined,
    {
      data: { exito: false, codigo },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: configuracion
    }
  );
}

describe('interceptores de autenticacion', () => {
  it('renueva automaticamente y reintenta una sola vez con el nuevo token', async () => {
    const cliente = crearClienteApi();
    let token = 'token-anterior';
    let intentos = 0;
    cliente.defaults.adapter = async (configuracion) => {
      intentos += 1;
      if (intentos === 1) throw rechazo401(configuracion);
      return { data: { correcto: true }, status: 200, statusText: 'OK', headers: {}, configuracion } as never;
    };
    const renovarToken = vi.fn(async () => {
      token = 'token-renovado';
      return token;
    });
    const desmontar = configurarIntercepcionAutenticacion(cliente, {
      obtenerToken: () => token,
      renovarToken,
      alFallarRenovacion: vi.fn()
    });
    const respuesta = await cliente.get('/recurso');
    expect(respuesta.status).toBe(200);
    expect(renovarToken).toHaveBeenCalledOnce();
    expect(intentos).toBe(2);
    expect(cliente.defaults.withCredentials).toBe(true);
    desmontar();
  });

  it('comparte una sola renovacion entre solicitudes simultaneas', async () => {
    const cliente = crearClienteApi();
    const intentos = new Map<string, number>();
    cliente.defaults.adapter = async (configuracion) => {
      const url = configuracion.url ?? '';
      const numero = (intentos.get(url) ?? 0) + 1;
      intentos.set(url, numero);
      if (numero === 1) throw rechazo401(configuracion);
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config: configuracion };
    };
    let resolverRenovacion: (token: string) => void = () => undefined;
    const renovarToken = vi.fn(() => new Promise<string>((resolver) => {
      resolverRenovacion = resolver;
    }));
    const desmontar = configurarIntercepcionAutenticacion(cliente, {
      obtenerToken: () => 'token',
      renovarToken,
      alFallarRenovacion: vi.fn()
    });
    const solicitudes = Promise.all([cliente.get('/uno'), cliente.get('/dos')]);
    await vi.waitFor(() => expect(renovarToken).toHaveBeenCalledOnce());
    resolverRenovacion('token-renovado');
    const respuestas = await solicitudes;
    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([200, 200]);
    expect(renovarToken).toHaveBeenCalledOnce();
    desmontar();
  });

  it('limpia la sesion cuando falla la renovacion y no entra en un bucle', async () => {
    const cliente = crearClienteApi();
    let intentos = 0;
    cliente.defaults.adapter = async (configuracion) => {
      intentos += 1;
      throw rechazo401({ ...configuracion, headers: AxiosHeaders.from(configuracion.headers) });
    };
    const alFallarRenovacion = vi.fn();
    const desmontar = configurarIntercepcionAutenticacion(cliente, {
      obtenerToken: () => 'token-vencido',
      renovarToken: vi.fn().mockRejectedValue(new Error('refresh invalido')),
      alFallarRenovacion
    });
    await expect(cliente.get('/recurso')).rejects.toThrow('refresh invalido');
    expect(alFallarRenovacion).toHaveBeenCalledOnce();
    expect(intentos).toBe(1);
    desmontar();
  });

  it('no renueva ante un 401 que no corresponda a token vencido', async () => {
    const cliente = crearClienteApi();
    cliente.defaults.adapter = async (configuracion) => {
      throw rechazo401(configuracion, 'USUARIO_INACTIVO');
    };
    const renovarToken = vi.fn();
    const desmontar = configurarIntercepcionAutenticacion(cliente, {
      obtenerToken: () => 'token',
      renovarToken,
      alFallarRenovacion: vi.fn()
    });

    await expect(cliente.get('/recurso')).rejects.toMatchObject({
      response: { status: 401, data: { codigo: 'USUARIO_INACTIVO' } }
    });
    expect(renovarToken).not.toHaveBeenCalled();
    desmontar();
  });
});
