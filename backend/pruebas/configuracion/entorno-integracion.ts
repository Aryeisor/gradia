import path from 'node:path';
import dotenv from 'dotenv';
import {
  configurarEntornoPruebas,
  exigirUrlBasePruebas
} from '../../src/configuracion/base-datos-pruebas.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
configurarEntornoPruebas(exigirUrlBasePruebas());
