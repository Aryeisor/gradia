import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gradia: {
          azul: '#1d4ed8',
          verde: '#047857',
          tinta: '#111827'
        }
      }
    }
  },
  plugins: []
};

export default config;
