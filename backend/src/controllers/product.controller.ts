import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { ConflictError } from '../errors/conflict-error';
import { ServerError } from '../errors/server-error';
import { BadRequestError } from '../errors/bad-request-error';
import Product from '../models/product';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find();
    res.json({
      items: products,
      total: products.length
    });
  } catch (err) {
    next(new ServerError());
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return next(new BadRequestError('Некорректные данные товара'));
    }
    
    if (err instanceof Error && err.message.includes('E11000')) {
      return next(new ConflictError('Товар с таким названием уже существует'));
    }
    
    next(new ServerError());
  }
};