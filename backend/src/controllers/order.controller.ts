import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/product';

import { BadRequestError } from '../errors/bad-request-error';
import { ServerError } from '../errors/server-error';
import { ConflictError } from '../errors/conflict-error';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payment, email, phone, address, total, items } = req.body;

    // Проверка обязательных полей
    const requiredFields = { payment, email, phone, address, total, items };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null) {
        throw new BadRequestError(`Поле ${field} обязательно`);
      }
    }

    // Валидация email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('Некорректный email');
    }

    // Валидация phone
    if (!/^\+?\d{10,15}$/.test(phone)) {
      throw new BadRequestError('Некорректный номер телефона');
    }

    // Валидация payment
    if (!['card', 'online'].includes(payment)) {
      throw new BadRequestError('Некорректный метод оплаты');
    }

    // Проверка items
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Необходимо указать хотя бы один товар');
    }

    // Проверка формата ID товаров
    const invalidIds = items.some((id: string) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds) {
      throw new BadRequestError('Некорректный формат ID товаров');
    }

    // Проверка существования товаров
    const products = await Product.find({ _id: { $in: items } });
    if (products.length !== items.length) {
      throw new ConflictError('Некоторые товары не найдены');
    }

    // Проверка цен товаров
    const productsWithInvalidPrice = products.filter(p => p.price === null || p.price === undefined);
    if (productsWithInvalidPrice.length > 0) {
      throw new BadRequestError('Некоторые товары не имеют цены');
    }

    // Расчет суммы
    const calculatedTotal = products.reduce((sum, p) => sum + (p.price || 0), 0);
    if (total !== calculatedTotal) {
      throw new BadRequestError(`Неверная сумма заказа. Ожидалось: ${calculatedTotal}, получено: ${total}`);
    }

    // Создание заказа
    res.status(200).json({
      id: faker.string.uuid(),
      total: calculatedTotal
    });

  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return next(new BadRequestError('Некорректный формат данных'));
    }
    next(err instanceof Error ? err : new ServerError());
  }
};