import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
  title: {
    type: String,
    unique: true,
    required: [true, 'Поле "title" должно быть заполнено'],
    minlength: [2, 'Минимальная длина поля "title" - 2'],
    maxlength: [30, 'Максимальная длина поля "title" - 30'],
    validate: {
      validator: (v: string) => /^[a-zA-Zа-яА-Я0-9\s-]+$/.test(v),
      message: 'Название содержит недопустимые символы',
    },
  },
  image: {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['софт-скил', 'хард-скил', 'другое', 'дополнительное'],
      message: 'Недопустимая категория товара',
    },
  },
  description: {
    type: String,
    maxlength: [200, 'Описание не должно превышать 200 символов'],
  },
  price: {
    type: Number,
    min: [0, 'Цена не может быть отрицательной'],
    required: true,
  },
}, {
  versionKey: false, // Отключаем поле __v
});

export default mongoose.model('Product', productSchema);
