import swaggerJSDoc from 'swagger-jsdoc';

export const especificacionSwagger = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gradia',
      version: '0.1.0',
      description: 'API REST inicial de Gradia'
    }
  },
  apis: ['./src/**/*.ts']
});
