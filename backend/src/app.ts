import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';
import { errors } from 'celebrate';
import { requestLogger, errorLogger } from './middlewares/logger';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import NotFoundError from './errors/not-found-error';
import AppError from './errors/app-error';

const { PORT = 3000, DB_URL = 'mongodb://127.0.0.1:27017/weblarek' } = process.env;

const app = express();

// Добавляем middleware для CORS
app.use(cors());
// Добавляем middleware для парсинга JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(DB_URL)
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('MongoDB connected!');
    }
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('DB error', err);
  });

app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);

// Простой тестовый роут
app.get('/', (_req, res) => {
  res.json({ message: 'Server is running!' });
});

app.use(errorLogger);
app.use(errors());

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Маршрут не найден'));
});

// Финальный обработчик ошибок
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    message: 'На сервере произошла ошибка',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`App listening on port ${PORT}`);
  }
});
