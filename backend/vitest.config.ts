import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: './pruebas/configuracion/entorno-unitario.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'pruebas/**/*.integracion.test.ts',
      'pruebas/base-datos.verificacion.test.ts'
    ]
  }
});
