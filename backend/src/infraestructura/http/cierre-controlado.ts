import { Server } from 'node:http';

type DependenciasCierre = {
  servidorHttp: Server;
  desconectarPrisma: () => Promise<void>;
  registrarInfo: (datos: object, mensaje: string) => void;
  registrarError: (datos: object, mensaje: string) => void;
  finalizarProceso: (codigo: number) => void;
  forzarFinalizacion?: (codigo: number) => void;
  tiempoMaximoMs?: number;
};

/** Crea un apagado idempotente: deja de aceptar trafico, cierra HTTP y desconecta Prisma. */
export function crearCierreControlado({
  servidorHttp,
  desconectarPrisma,
  registrarInfo,
  registrarError,
  finalizarProceso,
  forzarFinalizacion = finalizarProceso,
  tiempoMaximoMs = 10_000
}: DependenciasCierre) {
  let cerrandoServidor = false;

  return async function cerrarServidor(motivo: string, codigoSalida = 0): Promise<void> {
    if (cerrandoServidor) return;
    cerrandoServidor = true;
    registrarInfo({ motivo }, 'Comenzo el cierre controlado del servidor');

    const temporizador = setTimeout(() => {
      registrarError({ motivo, tiempoMaximoMs }, 'El cierre excedio el tiempo maximo');
      servidorHttp.closeAllConnections?.();
      forzarFinalizacion(1);
    }, tiempoMaximoMs);
    temporizador.unref();

    try {
      servidorHttp.closeIdleConnections?.();
      await new Promise<void>((resolve, reject) => {
        servidorHttp.close((error) => (error ? reject(error) : resolve()));
      });
      await desconectarPrisma();
      clearTimeout(temporizador);
      registrarInfo({ motivo, codigoSalida }, 'Servidor HTTP y Prisma cerrados correctamente');
      finalizarProceso(codigoSalida);
    } catch (error) {
      clearTimeout(temporizador);
      registrarError({ error, motivo }, 'Fallo el cierre controlado del servidor');
      try {
        await desconectarPrisma();
      } catch (errorDesconexion) {
        registrarError({ error: errorDesconexion }, 'No fue posible desconectar Prisma');
      }
      forzarFinalizacion(1);
    }
  };
}
