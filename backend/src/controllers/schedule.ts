import type { RequestHandler } from 'express';
import { scheduleQuerySchema, type UpdateScheduleInput } from '../schema.js';
import { getSchedule, updateSchedule } from '../services/schedule.js';

export const get: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const parsedQuery = scheduleQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parsedQuery.error.flatten(),
      });
      return;
    }

    const { weekOf, startDate, endDate, employeeId } = parsedQuery.data;

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
