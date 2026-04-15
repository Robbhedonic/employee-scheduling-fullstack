import { Router } from 'express';
import * as employeesController from '../controllers/employees.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema } from '../schema.js';

const router = Router();

// GET /        — employer only → employeesController.getAll
router.get(
  '/',
  authenticate,
  requireRole('EMPLOYER'),
  employeesController.getAll,
);

// POST /       — employer only, validate body with createEmployeeSchema → employeesController.create
router.post(
  '/',
  authenticate,
  requireRole('EMPLOYER'),
  validate(createEmployeeSchema),
  employeesController.create,
);

// GET /:id     — employer only → employeesController.getById
router.get(
  '/:id',
  authenticate,
  requireRole('EMPLOYER'),
  employeesController.getById,
);

export default router;
