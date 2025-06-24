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
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      _id: product._id,
      title: product.title,
      price: product.price,
      category: product.category,
      image: product.image,
    });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(err.errors).map((e) => e.message);
      next(new BadRequestError(messages.join(', ')));
      return;
    }
    if (err instanceof Error && err.message.includes('E11000')) {
      next(new ConflictError('Товар с таким названием уже существует'));
      return;
    }
    next(new ServerError('Ошибка при создании товара'));
  }
};
