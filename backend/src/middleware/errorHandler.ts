import { Request, Response, NextFunction } from 'express';
import { winstonLogger } from './logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class APIError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { statusCode = 500, message, stack } = error;

  // Log error
  winstonLogger.error('API Error', {
    statusCode,
    message,
    stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Common error responses
export const notFound = (resource: string) => new APIError(`${resource} not found`, 404);
export const unauthorized = (message: string = 'Unauthorized') => new APIError(message, 401);
export const forbidden = (message: string = 'Forbidden') => new APIError(message, 403);
export const badRequest = (message: string) => new APIError(message, 400);
export const conflict = (message: string) => new APIError(message, 409);
export const internalError = (message: string = 'Internal server error') => new APIError(message, 500);