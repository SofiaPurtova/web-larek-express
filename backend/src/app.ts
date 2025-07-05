import 'dotenv/config';
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

// 1. Базовые middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Логгер запросов
app.use(requestLogger);

// 3. Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// 4. Подключение к БД
mongoose.connect(DB_URL)
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB connected!');
    }
  })
  .catch((err) => {
    console.error('DB error', err);
  });

// 5. Роуты
app.use('/api/product/', productRoutes);
app.use('/api/order/', orderRoutes);

// 6. Тестовый-роут
app.get('/', (_req, res) => {
  res.json({ message: 'Server is running!' });
});

// 7. Обработка 404
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Маршрут не найден'));
});

// 8. Логгер ошибок
app.use(errorLogger);

// 9. Обработчик ошибок celebrate
app.use(errors());

// 10. Финальный обработчик ошибок
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    message: 'На сервере произошла ошибка',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`App listening on port ${PORT}`);
  }
});
