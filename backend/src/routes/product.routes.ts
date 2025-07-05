import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { getProducts, createProduct } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts);

router.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object({
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
      description: Joi.string().allow(''),
      price: Joi.number().min(0).required(),
    }),
  }, {
    abortEarly: false, // Чтобы получить все ошибки валидации
    allowUnknown: false, // Запретить неизвестные поля
  }),
  createProduct,
);

export default router;
