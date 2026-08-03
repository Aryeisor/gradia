import { describe, expect, it } from 'vitest';
import { exigirUrlBasePruebas } from '../src/configuracion/base-datos-pruebas.js';

describe('proteccion de la base de pruebas', () => {
  it('acepta exclusivamente gradia_test', () => {
    const url = 'postgresql://usuario:valor-ficticio@localhost:5432/gradia_test';
    expect(exigirUrlBasePruebas({ DATABASE_URL_TEST: url })).toBe(url);
  });

  it.each(['gradia', 'postgres', 'template0', 'template1', 'otra_base'])(
    'rechaza la base %s',
    (nombre) => {
      expect(() =>
        exigirUrlBasePruebas({
          DATABASE_URL_TEST: `postgresql://usuario:valor-ficticio@localhost:5432/${nombre}`
        })
      ).toThrow('gradia_test');
    }
  );

  it('rechaza una URL invalida sin reproducir su contenido', () => {
    expect(() => exigirUrlBasePruebas({ DATABASE_URL_TEST: 'valor-no-valido' })).toThrow(
      'DATABASE_URL_TEST no es una URL valida'
    );
  });

  it('rechaza una variable ausente', () => {
    expect(() => exigirUrlBasePruebas({ DATABASE_URL_TEST: undefined })).toThrow(
      'DATABASE_URL_TEST es obligatoria'
    );
  });
});
