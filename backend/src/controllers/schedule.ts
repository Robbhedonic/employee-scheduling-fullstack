import type { RequestHandler } from 'express';
import type { UpdateScheduleInput } from '../schema.js';
import { getSchedule, updateSchedule } from '../services/schedule.js';

export const get: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const weekOf =
      typeof req.query.weekOf === 'string' ? req.query.weekOf : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const employeeId =
      typeof req.query.employeeId === 'string'
        ? req.query.employeeId
        : undefined;

    const result = await getSchedule({
      userId: req.user.userId,
      role: req.user.role,
      weekOf,
      startDate,
      endDate,
      employeeId,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Employee not found') {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const update: RequestHandler<
  Record<string, never>,
  unknown,
  UpdateScheduleInput
> = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await updateSchedule(req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Employee not found') {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};
