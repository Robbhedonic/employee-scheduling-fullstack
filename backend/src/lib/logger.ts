import { createLogger, format, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [new transports.Console()],
});

export default logger;
