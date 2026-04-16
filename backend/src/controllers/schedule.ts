import type { RequestHandler } from 'express';
import type { ScheduleQueryInput, UpdateScheduleInput } from '../schema.js';
import { getSchedule, updateSchedule } from '../services/schedule.js';

export const get: RequestHandler<
  Record<string, never>,
  unknown,
  never,
  ScheduleQueryInput
> = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { weekOf, startDate, endDate, employeeId } = req.query;

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

    next(error);
  }
};

export const update: RequestHandler<
  Record<string, never>,
  unknown,
  UpdateScheduleInput
> = async (req, res, next) => {
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

    next(error);
  }
};
