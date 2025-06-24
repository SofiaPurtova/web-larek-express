import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import { getProducts, createProduct } from '../controllers/product.controller';

const router = Router();

// Валидация для GET /product (если есть query-параметры)
router.get('/', getProducts);

// Валидация для POST /product
router.post(
  '/',
  celebrate({
    body: Joi.object({
      title: Joi.string().min(2).max(30).required()
        .messages({
          'string.min': 'Минимальная длина названия — 2 символа',
          'string.max': 'Максимальная длина названия — 30 символов',
          'any.required': 'Название товара обязательно',
        }),
      image: Joi.object({
        fileName: Joi.string().required(),
        originalName: Joi.string().required(),
      }).required(),
      category: Joi.string().required(),
      description: Joi.string(),
      price: Joi.number().min(0),
    }),
  }),
  createProduct,
);

export default router;
