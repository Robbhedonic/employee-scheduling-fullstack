import express from 'express';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import availabilityRoutes from './routes/availability.js';
import scheduleRoutes from './routes/schedule.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
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

// TODO: app.use(errorHandler) — global error handler, must be registered after all routes

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
