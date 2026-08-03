import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig
} from 'axios';

type ConfiguracionReintentable = InternalAxiosRequestConfig & {
  _reintentoAutenticacion?: boolean;
};

export type IntegracionAutenticacionApi = {
  obtenerToken: () => string | null;
  renovarToken: () => Promise<string>;
  alFallarRenovacion: () => void | Promise<void>;
};

const RUTAS_SIN_RENOVACION = [
  '/autenticacion/iniciar-sesion',
  '/autenticacion/renovar'
];

export function crearClienteApi(): AxiosInstance {
  return axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
    timeout: 5000,
    withCredentials: true
  });
}

function esRutaSinRenovacion(url?: string): boolean {
  return RUTAS_SIN_RENOVACION.some((ruta) => url?.includes(ruta));
}

function esTokenVencido(error: AxiosError): boolean {
  const respuesta = error.response?.data;
  return typeof respuesta === 'object' && respuesta !== null &&
    'codigo' in respuesta && respuesta.codigo === 'TOKEN_VENCIDO';
}

export function configurarIntercepcionAutenticacion(
  cliente: AxiosInstance,
  integracion: IntegracionAutenticacionApi
): () => void {
  let renovacionEnCurso: Promise<string> | null = null;

  const solicitud = cliente.interceptors.request.use((configuracion) => {
    const token = integracion.obtenerToken();
    if (token) {
      configuracion.headers = AxiosHeaders.from(configuracion.headers);
      configuracion.headers.set('Authorization', `Bearer ${token}`);
    }
    return configuracion;
  });

  const respuesta = cliente.interceptors.response.use(
    (valor) => valor,
    async (error: AxiosError) => {
      const configuracion = error.config as ConfiguracionReintentable | undefined;
      if (
        error.response?.status !== 401 ||
        !esTokenVencido(error) ||
        !configuracion ||
        configuracion._reintentoAutenticacion ||
        esRutaSinRenovacion(configuracion.url)
      ) {
        return Promise.reject(error);
      }

      configuracion._reintentoAutenticacion = true;
      if (!renovacionEnCurso) {
        renovacionEnCurso = integracion.renovarToken()
          .catch(async (errorRenovacion: unknown) => {
            await integracion.alFallarRenovacion();
            throw errorRenovacion;
          })
          .finally(() => {
            renovacionEnCurso = null;
          });
      }

      const token = await renovacionEnCurso;
      configuracion.headers = AxiosHeaders.from(configuracion.headers);
      configuracion.headers.set('Authorization', `Bearer ${token}`);
      return cliente.request(configuracion);
    }
  );

  return () => {
    cliente.interceptors.request.eject(solicitud);
    cliente.interceptors.response.eject(respuesta);
  };
}

export const api = crearClienteApi();
