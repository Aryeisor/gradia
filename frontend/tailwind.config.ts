import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gradia: {
          azul: 'var(--color-gradia-azul)',
          'azul-hover': 'var(--color-gradia-azul-hover)',
          verde: 'var(--color-gradia-verde)',
          tinta: 'var(--color-gradia-tinta)',
          'tinta-fondo': 'var(--color-gradia-tinta-fondo)',
          fondo: 'var(--color-gradia-fondo)',
          superficie: 'var(--color-gradia-superficie)',
          'superficie-suave': 'var(--color-gradia-superficie-suave)',
          'panel-oscuro': 'var(--color-gradia-panel-oscuro)',
          texto: 'var(--color-gradia-texto)',
          'texto-secundario': 'var(--color-gradia-texto-secundario)',
          'texto-tenue': 'var(--color-gradia-texto-tenue)',
          'texto-inverso': 'var(--color-gradia-texto-inverso)',
          'texto-inverso-suave': 'var(--color-gradia-texto-inverso-suave)',
          borde: 'var(--color-gradia-borde)',
          'borde-suave': 'var(--color-gradia-borde-suave)',
          'borde-oscuro': 'var(--color-gradia-borde-oscuro)',
          focus: 'var(--color-gradia-focus)',
          error: 'var(--color-gradia-error)',
          'error-fondo': 'var(--color-gradia-error-fondo)',
          exito: 'var(--color-gradia-exito)',
          'exito-fondo': 'var(--color-gradia-exito-fondo)',
          'disabled-fondo': 'var(--color-gradia-disabled-fondo)',
          'disabled-texto': 'var(--color-gradia-disabled-texto)'
        }
      },
      borderRadius: {
        'gradia-sm': 'var(--radio-gradia-sm)',
        gradia: 'var(--radio-gradia-md)',
        'gradia-lg': 'var(--radio-gradia-lg)'
      },
      boxShadow: {
        'gradia-suave': 'var(--sombra-gradia-suave)',
        'gradia-focus': 'var(--sombra-gradia-focus)'
      },
      spacing: {
        'gradia-xs': 'var(--espacio-gradia-xs)',
        'gradia-sm': 'var(--espacio-gradia-sm)',
        'gradia-md': 'var(--espacio-gradia-md)',
        'gradia-lg': 'var(--espacio-gradia-lg)',
        'gradia-xl': 'var(--espacio-gradia-xl)',
        'gradia-2xl': 'var(--espacio-gradia-2xl)'
      }
    }
  },
  plugins: []
};

export default config;
