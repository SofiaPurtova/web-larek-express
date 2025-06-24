import AppError from './app-error';

export default class ServerError extends AppError {
  constructor(message: string = 'На сервере произошла ошибка') {
    super(message, 500);
  }
}
