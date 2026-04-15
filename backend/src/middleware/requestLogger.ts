import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import logger from '../lib/logger.js';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();

  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info('HTTP request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    });
  });

  next();
}
