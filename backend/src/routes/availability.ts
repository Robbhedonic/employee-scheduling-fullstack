import { Router } from 'express';
import {
  get as getAvailability,
  update as updateAvailability,
} from '../controllers/availability.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  availabilityQuerySchema,
  updateAvailabilitySchema,
} from '../schema.js';

const router = Router();

// GET /:employeeId    — both roles (employee can only view own) → availabilityController.get
router.get(
  '/:employeeId',
  authenticate,
  validate(availabilityQuerySchema, 'query'),
  getAvailability,
);

// PUT /:employeeId    — employee only (own data), validate body → availabilityController.update
router.put(
  '/:employeeId',
  authenticate,
  requireRole('EMPLOYEE'),
  validate(updateAvailabilitySchema),
  updateAvailability,
);

export default router;
