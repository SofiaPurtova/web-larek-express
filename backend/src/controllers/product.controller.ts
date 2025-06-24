import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { ConflictError } from '../errors/conflict-error';
import { ServerError } from '../errors/server-error';
import { BadRequestError } from '../errors/bad-request-error';
import Product from '../models/product';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Проверка подключения к БД
    if (mongoose.connection.readyState !== 1) {
      throw new ServerError('Нет подключения к базе данных');
    }

    const products = await Product.find().select('-__v');
    
    if (!products) {
      throw new ServerError('Не удалось получить товары');
    }

    res.status(200).json({
      items: products,
      total: products.length
    });
  } catch (err) {
    next(err instanceof Error ? err : new ServerError());
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, image, category, description, price } = req.body;

    // Ручная проверка обязательных полей
    if (!title || !image || !category) {
      throw new BadRequestError('Необходимо указать title, image и category');
    }

    if (!image.fileName || !image.originalName) {
      throw new BadRequestError('Необходимо указать fileName и originalName для изображения');
    }

    const product = new Product({
      title,
      image,
      category,
      description,
      price: price || 0 // Устанавливаем цену по умолчанию
    });

    const savedProduct = await product.save();
    
    // Удаляем __v из ответа
    const productResponse = savedProduct.toObject();
    // delete productResponse.__v;

    res.status(201).json(productResponse);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(err.errors).map(e => e.message);
      return next(new BadRequestError(messages.join(', ')));
    }
    
    if (err instanceof Error && err.message.includes('E11000')) {
      return next(new ConflictError('Товар с таким названием уже существует'));
    }
    
    next(err instanceof Error ? err : new ServerError());
  }
};