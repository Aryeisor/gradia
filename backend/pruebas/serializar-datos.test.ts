import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { serializarDatos } from '../src/compartido/respuestas/serializar-datos.js';

describe('serializarDatos', () => {
  it('serializa BigInt, Decimal y Date sin perder precision', () => {
    expect(
      serializarDatos({
        id: 25n,
        porcentaje: new Prisma.Decimal('33.33'),
        creadoEn: new Date('2026-08-02T10:00:00.000Z')
      })
    ).toEqual({ id: '25', porcentaje: '33.33', creadoEn: '2026-08-02T10:00:00.000Z' });
  });

  it('recorre arreglos y objetos anidados y conserva valores ordinarios y nulos', () => {
    const entrada = { activo: true, nombre: 'Gradia', nulo: null, omitido: undefined, datos: [1n, { nota: new Prisma.Decimal('4.50') }] };
    expect(serializarDatos(entrada)).toEqual({
      activo: true,
      nombre: 'Gradia',
      nulo: null,
      omitido: undefined,
      datos: ['1', { nota: '4.5' }]
    });
  });

  it('conserva objetos que no requieren transformacion', () => {
    expect(serializarDatos({ valor: 10, texto: 'ok', activo: false })).toEqual({ valor: 10, texto: 'ok', activo: false });
  });
});
