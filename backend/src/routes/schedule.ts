import { Router } from 'express';
import * as scheduleController from '../controllers/schedule.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateScheduleSchema } from '../schema.js';

const router = Router();

// GET /     — both roles (employee sees own shifts only), supports ?weekOf query → scheduleController.get
router.get('/', authenticate, scheduleController.get);

// PUT /     — employer only, validate body → scheduleController.update
router.put(
  '/',
  authenticate,
  requireRole('EMPLOYER'),
  validate(updateScheduleSchema),
  scheduleController.update,
);

export default router;
