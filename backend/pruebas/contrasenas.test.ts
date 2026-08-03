import { describe, expect, it } from 'vitest';
import { compararContrasena, generarHashContrasena, validarPoliticaContrasena } from '../src/modulos/autenticacion/servicios/contrasenas.servicio.js';

describe('servicio de contrasenas', () => {
  it('genera un hash y compara sin exponer la contrasena', async () => {
    const contrasena = 'Clave-Segura-2026!';
    const hash = await generarHashContrasena(contrasena);
    expect(hash).not.toContain(contrasena);
    await expect(compararContrasena(contrasena, hash)).resolves.toBe(true);
    await expect(compararContrasena('Clave-Incorrecta-2026!', hash)).resolves.toBe(false);
  });

  it.each(['', '            ', ' Clave-Segura-2026!', 'Clave-Segura-2026! ', 'corta', 'password-seguro-2026'])
  ('rechaza entradas que incumplen la politica: %s', (valor) => {
    expect(() => validarPoliticaContrasena(valor)).toThrow();
  });

  it('no modifica silenciosamente una entrada valida', () => {
    expect(() => validarPoliticaContrasena('Clave-Segura-2026!')).not.toThrow();
  });
});
