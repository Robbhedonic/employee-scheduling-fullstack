import { createLogger, format, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

function str(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

const devFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize({ level: true }),
  format.printf((info) => {
    const meta = { ...info } as Record<string, unknown>;
    const timestamp = str(meta.timestamp);
    const level = str(meta.level);
    const message = str(meta.message);
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;

    // HTTP request lines — inline the well-known fields in fixed columns.
    if (message === 'HTTP request') {
      const method = str(meta.method).padEnd(6);
      const path = str(meta.path).padEnd(50);
      const status = str(meta.statusCode);
      const duration = `${str(meta.durationMs).padStart(4)}ms`;
      return `${timestamp} ${level} HTTP ${method}${path} ${status}  ${duration}`;
    }

    // Everything else: message + compact JSON meta; stack (if present) on a new line.
    const stack = meta.stack;
    delete meta.stack;
    const metaStr =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${str(stack)}` : '';
    return `${timestamp} ${level} ${message}${metaStr}${stackStr}`;
  }),
);

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  format: isProduction ? prodFormat : devFormat,
  transports: [new transports.Console()],
});

export default logger;
