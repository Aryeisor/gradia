import { api } from './api';

export type EstadoSalud = {
  exito: boolean;
  mensaje: string;
  datos?: {
    api: string;
    base_datos: string;
  };
  errores?: string[];
};

export async function consultarSalud(): Promise<EstadoSalud> {
  const respuesta = await api.get<EstadoSalud>('/salud');
  return respuesta.data;
}
