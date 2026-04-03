import { Router } from 'express';

const router = Router();

// GET /        — employer only → employeesController.getAll

// POST /       — employer only, validate body with createEmployeeSchema → employeesController.create

// GET /:id     — employer only → employeesController.getById

export default router;
