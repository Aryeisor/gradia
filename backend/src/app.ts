import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { entorno } from './configuracion/entorno.js';
import { logger } from './configuracion/logger.js';
import { especificacionSwagger } from './configuracion/swagger.js';
import { manejadorErrores } from './middlewares/manejador-errores.js';
import { rutaNoEncontrada } from './middlewares/ruta-no-encontrada.js';
import { rutasApi } from './rutas/index.js';

export function crearAplicacion() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: entorno.ORIGEN_FRONTEND }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacionSwagger));
  app.use('/api', rutasApi);
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}
