import { Router } from 'express';
import * as scheduleController from '../controllers/schedule.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { scheduleQuerySchema, updateScheduleSchema } from '../schema.js';

const router = Router();

// GET /     — both roles (employee sees own shifts only), supports ?weekOf query → scheduleController.get
router.get(
  '/',
  authenticate,
  validate(scheduleQuerySchema, 'query'),
  scheduleController.get,
);

// PUT /     — employer only, validate body → scheduleController.update
router.put(
  '/',
  authenticate,
  requireRole('EMPLOYER'),
  validate(updateScheduleSchema),
  scheduleController.update,
);

// DELETE /:id — employer only, unassign a single schedule entry → scheduleController.remove
router.delete(
  '/:id',
  authenticate,
  requireRole('EMPLOYER'),
  scheduleController.remove,
);

export default router;
