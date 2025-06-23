import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import Product from '../models/product';
import { faker } from '@faker-js/faker';
import { BadRequestError } from '../errors/bad-request-error';
import { ServerError } from '../errors/server-error';


export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payment, email, phone, address, total, items } = req.body;

    // Валидация
    if (!items || items.length === 0) {
      throw new BadRequestError('Не указаны товары для заказа');
    }

    // Проверка формата ID
    const invalidIds = items.some((id: string) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds) {
      throw new BadRequestError('Некорректный формат ID товаров');
    }

    // Проверка существования товаров
    const products = await Product.find({ _id: { $in: items } });
    if (products.length !== items.length) {
      throw new BadRequestError('Некоторые товары не найдены');
    }

    // Проверка цены
    const invalidPrice = products.some((p) => p.price === null);
    if (invalidPrice) {
      throw new BadRequestError('Некоторые товары не доступны для заказа');
    }

    // Проверка суммы
    const realTotal = products.reduce((sum, p) => sum + (p.price || 0), 0);
    if (total !== realTotal) {
      throw new BadRequestError('Неверная сумма заказа');
    }

    // Создание заказа
    res.json({
      id: faker.string.uuid(),
      total
    });

  } catch (err) {
    next(err);
  }
};