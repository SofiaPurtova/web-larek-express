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
  format.printf(({
    timestamp, level, message, ...meta
  }) => JSON.stringify({
    timestamp,
    level,
    message,
    ...meta,
  }, null, 2)),
);

// Фильтр для чувствительных данных (исправленный, без мутации параметра)
const sensitiveDataFilter = format((info: TransformableLogInfo) => {
  const filteredInfo = { ...info }; // Создаем копию объекта

  if (filteredInfo.req?.headers?.authorization) {
    filteredInfo.req.headers = {
      ...filteredInfo.req.headers,
      authorization: '***', // Заменяем без мутации
    };
  }

  if (filteredInfo.req?.body?.password) {
    filteredInfo.req.body = {
      ...filteredInfo.req.body,
      password: '***', // Заменяем без мутации
    };
  }

  return filteredInfo;
});

export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({
      filename: 'request.log',
      level: 'info',
    }),
  ],
  format: format.combine(
    sensitiveDataFilter(),
    jsonFormat,
  ),
  meta: true,
  metaField: 'context',
  msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: true,
  ignoreRoute: (req) => req.url === '/healthcheck',
  requestWhitelist: ['method', 'url', 'body', 'query'],
  responseWhitelist: ['statusCode', 'responseTime'],
});

export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      handleExceptions: true,
    }),
  ],
  format: format.combine(
    sensitiveDataFilter(),
    jsonFormat,
  ),
  metaField: 'context',
  requestWhitelist: ['method', 'url', 'body', 'query'],
  msg: '{{err.message}}',
  level: 'error',
});
