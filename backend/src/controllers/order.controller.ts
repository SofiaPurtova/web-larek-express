import { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import AppError from '../errors/app-error';
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
    const { items } = req.body as { items: string[] };

    // Проверяем, что все items являются валидными ObjectId
    const invalidIds = items.filter((id: string) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestError(`Некорректные ID товаров: ${invalidIds.join(', ')}`);
    }

    const products = await Product.find({ _id: { $in: items } });

    if (products.length !== items.length) {
      const missingIds = items.filter(
        (id: string) => !products.some((p) => p._id.toString() === id),
      );
      throw new ConflictError(`Товары не найдены: ${missingIds.join(', ')}`);
    }

    const calculatedTotal = products.reduce((sum: number, p) => sum + (p.price || 0), 0);

    if (req.body.total !== calculatedTotal) {
      throw new BadRequestError(
        `Неверная сумма заказа. Ожидалось: ${calculatedTotal}, получено: ${req.body.total}`,
      );
    }

    res.status(200).json({
      id: faker.string.uuid(),
      total: calculatedTotal,
      items: products.map((p) => ({
        id: p._id,
        title: p.title,
        price: p.price,
      })),
    });
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new ServerError('Ошибка при создании заказа'));
  }
}
