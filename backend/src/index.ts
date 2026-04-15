import express from 'express';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import availabilityRoutes from './routes/availability.js';
import scheduleRoutes from './routes/schedule.js';
import logger from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Fail-fast config check. Any required env var missing here should crash
// the process at startup rather than silently returning 500s per request.
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`${key} is required but not set. Refusing to start.`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);
// TODO: app.use(cors()) — needed for frontend on a different port

// Routes
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/availability', availabilityRoutes);
app.use('/schedule', scheduleRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    baseUrl: `http://localhost:${PORT}`,
  });
});
