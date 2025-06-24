import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import ConflictError from '../errors/conflict-error';
import ServerError from '../errors/server-error';
import BadRequestError from '../errors/bad-request-error';
import Product from '../models/product';

export const getProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await Product.find();
    res.status(200).json({
      items: products,
      total: products.length,
    });
  } catch (err) {
    next(new ServerError());
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      title,
      description,
      price,
      category,
      image,
    } = req.body;

    // Валидация обязательных полей
    if (!title || title.length < 2 || title.length > 30) {
      throw new BadRequestError('Название товара должно быть от 2 до 30 символов');
    }
    if (!category) {
      throw new BadRequestError('Категория товара обязательна');
    }
    if (!image || !image.fileName || !image.originalName) {
      throw new BadRequestError('Изображение товара обязательно');
    }
    if (price === undefined || price === null) {
      throw new BadRequestError('Цена товара обязательна');
    }

    const product = new Product({
      title,
      description,
      price,
      category,
      image,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Некорректные данные товара'));
      return;
    }

    if (err instanceof Error && err.message.includes('E11000')) {
      next(new ConflictError('Товар с таким названием уже существует'));
      return;
    }

    next(err instanceof Error ? err : new ServerError());
  }
};
