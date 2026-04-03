import { Router } from 'express';

const router = Router();

// GET /:employeeId    — both roles (employee can only view own) → availabilityController.get

// PUT /:employeeId    — employee only (own data), validate body → availabilityController.update

export default router;
