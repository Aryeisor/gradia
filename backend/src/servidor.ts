import { crearAplicacion } from './app.js';
import { entorno } from './configuracion/entorno.js';
import { logger } from './configuracion/logger.js';

const app = crearAplicacion();

app.listen(entorno.PUERTO, () => {
  logger.info(`API Gradia escuchando en http://localhost:${entorno.PUERTO}`);
});
