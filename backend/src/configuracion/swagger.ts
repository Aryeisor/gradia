import swaggerJSDoc from 'swagger-jsdoc';

export const especificacionSwagger = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gradia',
      version: '0.1.0',
      description: [
        'API REST de Gradia para salud, autenticacion, sesiones y gestion administrativa de usuarios.',
        'Los ejemplos son ficticios. No documentar credenciales, tokens, cookies ni hashes reales.'
      ].join(' ')
    },
    tags: [
      { name: 'Salud', description: 'Estado de la API y PostgreSQL.' },
      { name: 'Autenticacion', description: 'Login, renovacion, sesion actual, cierre y cambio de contrasena.' },
      { name: 'Usuarios', description: 'Gestion administrativa exclusiva del rol ADMINISTRADOR.' }
    ]
  },
  apis: ['./src/**/*.ts']
});
