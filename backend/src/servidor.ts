import { crearAplicacion } from './app.js';
import { entorno } from './configuracion/entorno.js';
import { logger } from './configuracion/logger.js';
import { prisma } from './infraestructura/prisma/cliente-prisma.js';
import { crearCierreControlado } from './infraestructura/http/cierre-controlado.js';

const app = crearAplicacion();

const servidorHttp = app.listen(entorno.PUERTO, () => {
  logger.info(`API Gradia escuchando en http://localhost:${entorno.PUERTO}`);
});

const cerrarServidor = crearCierreControlado({
  servidorHttp,
  desconectarPrisma: () => prisma.$disconnect(),
  registrarInfo: (datos, mensaje) => logger.info(datos, mensaje),
  registrarError: (datos, mensaje) => logger.error(datos, mensaje),
  finalizarProceso: (codigo) => {
    process.exitCode = codigo;
  },
  forzarFinalizacion: (codigo) => process.exit(codigo)
});

servidorHttp.on('error', (error) => {
  logger.error({ error }, 'Error del servidor HTTP');
  void cerrarServidor('error-servidor-http', 1);
});

process.once('SIGINT', () => void cerrarServidor('SIGINT'));
process.once('SIGTERM', () => void cerrarServidor('SIGTERM'));
process.once('unhandledRejection', (razon) => {
  logger.fatal({ error: razon }, 'Promesa rechazada no controlada');
  void cerrarServidor('unhandledRejection', 1);
});
process.once('uncaughtException', (error) => {
  logger.fatal({ error }, 'Excepcion no capturada');
  void cerrarServidor('uncaughtException', 1);
});
