import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'DATABASE_URL',
    'DATABASE_URL_TEST',
    'JWT_SECRET'
  ]
});
