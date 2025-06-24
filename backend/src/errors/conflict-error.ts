import AppError from './app-error';

export default class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
