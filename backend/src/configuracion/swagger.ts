import swaggerJSDoc from 'swagger-jsdoc';

export const especificacionSwagger = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gradia',
      version: '0.1.0',
      description: [
        'API REST de Gradia para salud, autenticación, sesiones y gestión administrativa de usuarios.',
        'Los ejemplos son ficticios. No documentar credenciales, tokens, cookies ni hashes reales.'
      ].join(' ')
    },
    tags: [
      { name: 'Salud', description: 'Estado de la API y PostgreSQL.' },
      { name: 'Autenticación', description: 'Login, renovación, sesión actual, cierre y cambio de contraseña.' },
      { name: 'Usuarios', description: 'Gestión administrativa exclusiva del rol ADMINISTRADOR.' }
    ]
  },
  apis: ['./src/**/*.ts']
});
