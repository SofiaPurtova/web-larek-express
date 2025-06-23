import { AppError } from "./app-error";

export class ValidationError extends AppError {
  details: Record<string, string>;

  constructor(message: string, details: Record<string, string>) {
    super(message, 400);
    this.details = details;
  }
}