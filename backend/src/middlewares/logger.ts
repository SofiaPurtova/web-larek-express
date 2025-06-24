import winston, { format } from 'winston';
import expressWinston from 'express-winston';
import { Request } from 'express';

// Определяем тип, совместимый с TransformableInfo
interface TransformableLogInfo extends winston.Logform.TransformableInfo {
  req?: Request;
}

// Форматирование для читаемого JSON
const jsonFormat = format.combine(
  format.timestamp(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    }, null, 2);
  })
);

// Фильтр для чувствительных данных
const sensitiveDataFilter = format((info: TransformableLogInfo) => {
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
  format: format.combine(
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
      level: 'error',
      handleExceptions: true
    }),
  ],
  format: format.combine(
    sensitiveDataFilter(),
    jsonFormat
  ),
  metaField: 'context',
  requestWhitelist: ['method', 'url', 'body', 'query'],
  msg: '{{err.message}}',
  level: 'error'
});