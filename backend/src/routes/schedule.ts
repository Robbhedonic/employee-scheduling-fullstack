import { Router } from 'express';

const router = Router();

// GET /     — both roles (employee sees own shifts only), supports ?weekOf query → scheduleController.get

// PUT /     — employer only, validate body → scheduleController.update

export default router;
