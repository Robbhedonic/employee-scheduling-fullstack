import { Router } from 'express';
import { login } from '../controllers/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schema.js';

const router = Router();

// POST /auth/login
router.post('/login', validate(loginSchema), login);

export default router;
