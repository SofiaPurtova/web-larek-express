import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import createOrder from '../controllers/order.controller';

const router = Router();

router.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object({
      payment: Joi.string().valid('card', 'online').required()
        .messages({
          'any.only': 'Метод оплаты должен быть card или online',
          'any.required': 'Метод оплаты обязателен',
        }),
      email: Joi.string().email().required()
        .messages({
          'string.email': 'Некорректный email',
          'any.required': 'Email обязателен',
        }),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).required()
        .messages({
          'string.pattern.base': 'Некорректный номер телефона',
          'any.required': 'Телефон обязателен',
        }),
      address: Joi.string().required()
        .messages({
          'any.required': 'Адрес обязателен',
        }),
      total: Joi.number().min(0).required()
        .messages({
          'number.base': 'Сумма должна быть числом',
          'any.required': 'Сумма обязательна',
        }),
      items: Joi.array().items(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
      ).min(1).required()
        .messages({
          'array.min': 'Должен быть хотя бы один товар',
          'any.required': 'Список товаров обязателен',
        }),
    }),
  }, {
    abortEarly: false,
    allowUnknown: false,
  }),
  createOrder,
);

export default router;
