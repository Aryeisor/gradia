import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { mensajeErrorUsuarios } from '../servicios/usuarios.servicio';

function errorApi(estado: number, mensaje?: string): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('Error API', 'ERR_BAD_REQUEST', config, undefined, {
    data: { exito: false, mensaje, errores: [] },
    status: estado,
    statusText: 'Error',
    headers: {},
    config
  });
}

describe('errores del servicio de usuarios', () => {
  it('muestra el conflicto de datos duplicados enviado por el backend', () => {
    expect(mensajeErrorUsuarios(errorApi(409, 'Ya existe un usuario con esos datos')))
      .toBe('Ya existe un usuario con esos datos');
  });

  it('maneja un usuario no encontrado', () => {
    expect(mensajeErrorUsuarios(errorApi(404))).toBe('El usuario solicitado ya no existe.');
  });
});
