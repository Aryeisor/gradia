import { AxiosError } from 'axios';
import { api } from '../../../servicios/api';
import {
  ConsultaUsuarios,
  EntradaActualizarUsuario,
  EntradaCrearUsuario,
  EntradaEstadoUsuario,
  EntradaRestablecerContrasena,
  ErrorApi,
  RespuestaApi,
  ResultadoUsuarios,
  UsuarioDetalle
} from '../tipos/usuarios.tipos';

export async function listarUsuarios(consulta: ConsultaUsuarios): Promise<ResultadoUsuarios> {
  const respuesta = await api.get<RespuestaApi<ResultadoUsuarios>>('/usuarios', {
    params: {
      pagina: consulta.pagina,
      limite: consulta.limite,
      ...(consulta.buscar ? { buscar: consulta.buscar } : {}),
      ...(consulta.rol !== 'TODOS' ? { rol: consulta.rol } : {}),
      ...(consulta.estado !== 'TODOS' ? { estado: consulta.estado === 'ACTIVOS' } : {})
    }
  });
  return respuesta.data.datos;
}

export async function consultarUsuario(id: string): Promise<UsuarioDetalle> {
  const respuesta = await api.get<RespuestaApi<{ usuario: UsuarioDetalle }>>(`/usuarios/${id}`);
  return respuesta.data.datos.usuario;
}

export async function crearUsuario(entrada: EntradaCrearUsuario): Promise<UsuarioDetalle> {
  const respuesta = await api.post<RespuestaApi<{ usuario: UsuarioDetalle }>>('/usuarios', entrada);
  return respuesta.data.datos.usuario;
}

export async function actualizarUsuario(id: string, entrada: EntradaActualizarUsuario): Promise<UsuarioDetalle> {
  const respuesta = await api.patch<RespuestaApi<{ usuario: UsuarioDetalle }>>(`/usuarios/${id}`, entrada);
  return respuesta.data.datos.usuario;
}

export async function cambiarEstadoUsuario(
  id: string,
  entrada: EntradaEstadoUsuario
): Promise<UsuarioDetalle> {
  const respuesta = await api.patch<RespuestaApi<{ usuario: UsuarioDetalle }>>(
    `/usuarios/${id}/estado`,
    entrada
  );
  return respuesta.data.datos.usuario;
}

export async function restablecerContrasena(
  id: string,
  entrada: EntradaRestablecerContrasena
): Promise<void> {
  await api.post(`/usuarios/${id}/restablecer-contrasena`, entrada);
}

export function mensajeErrorUsuarios(error: unknown): string {
  if (error instanceof AxiosError) {
    const datos = error.response?.data as ErrorApi | undefined;
    if (datos?.errores?.[0]?.mensaje) return datos.errores[0].mensaje;
    if (datos?.mensaje) return datos.mensaje;
    const estado = error.response?.status;
    if (estado === 401) return 'La sesión ya no es válida. Inicie sesión nuevamente.';
    if (estado === 403) return 'No tiene permisos para realizar esta accion.';
    if (estado === 404) return 'El usuario solicitado ya no existe.';
    if (estado === 409) return 'La operacion entra en conflicto con los datos actuales.';
  }
  return 'No fue posible completar la operacion. Intente nuevamente.';
}
