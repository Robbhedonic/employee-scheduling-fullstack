import express from 'express';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import availabilityRoutes from './routes/availability.js';
import scheduleRoutes from './routes/schedule.js';
import logger from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

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
