import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api, configurarIntercepcionAutenticacion } from '../../../servicios/api';
import {
  cambiarContrasenaApi,
  cerrarSesionApi,
  cerrarTodasLasSesionesApi,
  consultarUsuarioActualApi,
  iniciarSesionApi,
  renovarSesionApi
} from '../servicios/autenticacion.servicio';
import {
  guardarTokenAcceso,
  limpiarTokenAcceso,
  obtenerTokenAcceso
} from '../servicios/token-acceso.memoria';
import {
  CredencialesInicioSesion,
  EntradaCambioContrasena,
  EstadoAutenticacion,
  UsuarioAutenticado
} from '../tipos/autenticacion.tipos';
import { AutenticacionContexto, ValorAutenticacion } from './autenticacion.contexto';

type Props = {
  children: ReactNode;
};

export function ProveedorAutenticacion({ children }: Props) {
  const [estado, setEstado] = useState<EstadoAutenticacion>('inicializando');
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [, setTokenAcceso] = useState<string | null>(null);

  const limpiarSesionLocal = useCallback(() => {
    limpiarTokenAcceso();
    setTokenAcceso(null);
    setUsuario(null);
    setEstado('no_autenticado');
  }, []);

  const aplicarToken = useCallback((token: string) => {
    guardarTokenAcceso(token);
    setTokenAcceso(token);
  }, []);

  const renovarToken = useCallback(async () => {
    const token = await renovarSesionApi();
    aplicarToken(token);
    return token;
  }, [aplicarToken]);

  useEffect(() => configurarIntercepcionAutenticacion(api, {
    obtenerToken: obtenerTokenAcceso,
    renovarToken,
    alFallarRenovacion: limpiarSesionLocal
  }), [limpiarSesionLocal, renovarToken]);

  useEffect(() => {
    let activo = true;
    async function restaurarSesion() {
      try {
        const token = await renovarToken();
        const usuarioRestaurado = await consultarUsuarioActualApi();
        if (!activo) return;
        aplicarToken(token);
        setUsuario(usuarioRestaurado);
        setEstado('autenticado');
      } catch {
        if (activo) limpiarSesionLocal();
      }
    }
    void restaurarSesion();
    return () => {
      activo = false;
    };
  }, [aplicarToken, limpiarSesionLocal, renovarToken]);

  const iniciarSesion = useCallback(async (credenciales: CredencialesInicioSesion) => {
    const resultado = await iniciarSesionApi(credenciales);
    aplicarToken(resultado.tokenAcceso);
    setUsuario(resultado.usuario);
    setEstado('autenticado');
    return resultado.usuario;
  }, [aplicarToken]);

  const cambiarContrasena = useCallback(async (entrada: EntradaCambioContrasena) => {
    await cambiarContrasenaApi(entrada);
    limpiarSesionLocal();
  }, [limpiarSesionLocal]);

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionApi();
    } finally {
      limpiarSesionLocal();
    }
  }, [limpiarSesionLocal]);

  const cerrarTodasLasSesiones = useCallback(async () => {
    try {
      await cerrarTodasLasSesionesApi();
    } finally {
      limpiarSesionLocal();
    }
  }, [limpiarSesionLocal]);

  const valor = useMemo<ValorAutenticacion>(() => ({
    estado,
    usuario,
    iniciarSesion,
    cambiarContrasena,
    cerrarSesion,
    cerrarTodasLasSesiones
  }), [
    cambiarContrasena,
    cerrarSesion,
    cerrarTodasLasSesiones,
    estado,
    iniciarSesion,
    usuario
  ]);

  return (
    <AutenticacionContexto.Provider value={valor}>
      {children}
    </AutenticacionContexto.Provider>
  );
}
