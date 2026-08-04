import { api } from '../../../servicios/api';
import {
  CredencialesInicioSesion,
  EntradaCambioContrasena,
  RespuestaApi,
  UsuarioAutenticado
} from '../tipos/autenticacion.tipos';

type RespuestaInicioSesion = RespuestaApi<{
  tokenAcceso: string;
  usuario: UsuarioAutenticado;
}>;

type RespuestaRenovacion = RespuestaApi<{ tokenAcceso: string }>;
type RespuestaUsuarioActual = RespuestaApi<{ usuario: UsuarioAutenticado }>;

let renovacionCompartida: Promise<string> | null = null;

export async function iniciarSesionApi(
  credenciales: CredencialesInicioSesion
): Promise<{ tokenAcceso: string; usuario: UsuarioAutenticado }> {
  const respuesta = await api.post<RespuestaInicioSesion>(
    '/autenticacion/iniciar-sesion',
    credenciales
  );
  return respuesta.data.datos;
}

export function renovarSesionApi(): Promise<string> {
  if (!renovacionCompartida) {
    renovacionCompartida = api.post<RespuestaRenovacion>('/autenticacion/renovar')
      .then((respuesta) => respuesta.data.datos.tokenAcceso)
      .finally(() => {
        renovacionCompartida = null;
      });
  }
  return renovacionCompartida;
}

export async function consultarUsuarioActualApi(): Promise<UsuarioAutenticado> {
  const respuesta = await api.get<RespuestaUsuarioActual>('/autenticacion/yo');
  return respuesta.data.datos.usuario;
}

export async function cambiarContrasenaApi(entrada: EntradaCambioContrasena): Promise<void> {
  await api.patch('/autenticacion/cambiar-contrasena', entrada);
}

export async function cerrarSesionApi(): Promise<void> {
  await api.post('/autenticacion/cerrar-sesion');
}

export async function cerrarTodasLasSesionesApi(): Promise<void> {
  await api.post('/autenticacion/cerrar-todas');
}
