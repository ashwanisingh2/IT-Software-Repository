import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
export class CustomError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    logger.warn('Validation error', { details: err.errors });
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.errors }
    });
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  if (status >= 500) {
    logger.error('Unhandled Server Error', { err: err.stack || err });
  } else {
    logger.warn(`Client Error ${status}`, { message: err.message });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
      ...(process.env.NODE_ENV !== 'production' && { details: err.stack }),
    },
  });
};
