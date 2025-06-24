import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import ServerError from '../errors/server-error';
import ConflictError from '../errors/conflict-error';

export default async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      payment, email, phone, address, total, items,
    } = req.body;

    // Проверка обязательных полей
    const requiredFields = {
      payment, email, phone, address, total, items,
    };
    const missingField = Object.entries(requiredFields)
      .find(([_, value]) => value === undefined || value === null);

    if (missingField) {
      throw new BadRequestError(`Поле ${missingField[0]} обязательно`);
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
    if (items.some((id: string) => !mongoose.Types.ObjectId.isValid(id))) {
      throw new BadRequestError('Некорректный формат ID товаров');
    }

    // Проверка существования товаров
    const products = await Product.find({ _id: { $in: items } });
    if (products.length !== items.length) {
      throw new ConflictError('Некоторые товары не найдены');
    }

    // Проверка цен товаров
    if (products.some((p) => p.price === null || p.price === undefined)) {
      throw new BadRequestError('Некоторые товары не имеют цены');
    }

    // Расчет суммы
    const calculatedTotal = products.reduce((sum, p) => sum + (p.price || 0), 0);
    if (total !== calculatedTotal) {
      throw new BadRequestError(
        `Неверная сумма заказа. Ожидалось: ${calculatedTotal}, получено: ${total}`,
      );
    }

    // Создание заказа
    res.status(200).json({
      id: faker.string.uuid(),
      total: calculatedTotal,
    });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Некорректный формат данных'));
      return;
    }
    next(err instanceof Error ? err : new ServerError());
  }
}
