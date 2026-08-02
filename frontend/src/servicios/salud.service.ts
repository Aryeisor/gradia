import axios from 'axios';
import { api } from './api';

type RespuestaSalud = {
  exito: boolean;
  mensaje: string;
  datos?: {
    api: string;
    baseDatos: string;
  };
  errores?: string[];
};

export type EstadoServicios =
  | 'comprobando'
  | 'disponibles'
  | 'base-datos-desconectada'
  | 'api-no-disponible';

export type ResultadoServicios = { estado: Exclude<EstadoServicios, 'comprobando'>; mensaje: string };

function esRespuestaSalud(valor: unknown): valor is RespuestaSalud {
  if (!valor || typeof valor !== 'object') return false;
  const respuesta = valor as RespuestaSalud;
  return typeof respuesta.exito === 'boolean' && typeof respuesta.mensaje === 'string';
}

export async function consultarSalud(): Promise<ResultadoServicios> {
  try {
    const respuesta = await api.get<RespuestaSalud>('/salud');
    if (!esRespuestaSalud(respuesta.data) || respuesta.data.datos?.baseDatos !== 'conectada') {
      return { estado: 'api-no-disponible', mensaje: 'La API devolvio una respuesta inesperada.' };
    }
    return { estado: 'disponibles', mensaje: respuesta.data.mensaje };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const datos = error.response.data;
      if (
        error.response.status === 503 &&
        esRespuestaSalud(datos) &&
        datos.datos?.api === 'operativa' &&
        datos.datos.baseDatos === 'desconectada'
      ) {
        return { estado: 'base-datos-desconectada', mensaje: datos.mensaje };
      }
    }
    return { estado: 'api-no-disponible', mensaje: 'No fue posible consultar el backend de Gradia.' };
  }
}
