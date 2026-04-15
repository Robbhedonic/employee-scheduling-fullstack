import type { ErrorRequestHandler } from 'express';
import logger from '../lib/logger.js';

type AppError = Error & {
  statusCode?: number;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    _next(err);
    return;
  }

  const error = err as AppError;
  const statusCode = error.statusCode ?? 500;

  logger.error('Unhandled request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
    stack: error.stack,
  });

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : error.message,
  });
};
