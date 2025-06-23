import winston from 'winston';
import expressWinston from 'express-winston';

// Форматирование для читаемого JSON
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    }, null, 2); // Отступы для читаемости
  })
);

// Фильтр для чувствительных данных
const sensitiveDataFilter = winston.format((info) => {
  if (info.req?.headers?.authorization) {
    info.req.headers.authorization = '***';
  }
  if (info.req?.body?.password) {
    info.req.body.password = '***';
  }
  return info;
});

export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ 
      filename: 'request.log',
      level: 'info'
    }),
  ],
  format: winston.format.combine(
    sensitiveDataFilter(),
    jsonFormat
  ),
  meta: true,
  metaField: 'context',
  msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: true,
  ignoreRoute: (req) => req.url === '/healthcheck',
  requestWhitelist: ['method', 'url', 'body', 'query'],
  responseWhitelist: ['statusCode', 'responseTime']
});

export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ 
      filename: 'error.log',
      level: 'error'
    }),
  ],
  format: winston.format.combine(
    sensitiveDataFilter(),
    jsonFormat
  ),
  metaField: 'context',
  requestWhitelist: ['method', 'url', 'body', 'query'],
  msg: '{{err.message}}',
  dumpExceptions: false,
  showStack: false
});