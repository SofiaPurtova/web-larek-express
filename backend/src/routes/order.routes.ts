import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import createOrder from '../controllers/order.controller';

const router = Router();

router.post(
  '/',
  celebrate({
    body: Joi.object({
      payment: Joi.string().valid('card', 'online').required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
      address: Joi.string().required(),
      total: Joi.number().min(0).required(),
      items: Joi.array().items(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // Проверка на ObjectId
      ).min(1).required(),
    }),
  }),
  createOrder,
);

export default router;
