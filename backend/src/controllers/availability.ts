import type { RequestHandler } from 'express';
import prisma from '../lib/prisma.js';
import {
  availabilityQuerySchema,
  type UpdateAvailabilityInput,
} from '../schema.js';
import * as availabilityService from '../services/availability.js';

async function employeeOwnsAvailability(
  userId: string,
  targetEmployeeId: string,
): Promise<boolean> {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true },
  });

  return employee?.id === targetEmployeeId;
}

export const get: RequestHandler<{ employeeId: string }> = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { employeeId } = req.params;
    const parsedQuery = availabilityQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parsedQuery.error.flatten(),
      });
      return;
    }

    const { weekOf, startDate, endDate } = parsedQuery.data;

    if (req.user.role === 'EMPLOYEE') {
      const canAccess = await employeeOwnsAvailability(
        req.user.userId,
        employeeId,
      );
      if (!canAccess) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const result = await availabilityService.getAvailability({
      employeeId,
      weekOf,
      startDate,
      endDate,
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
  { employeeId: string },
  unknown,
  UpdateAvailabilityInput
> = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { employeeId } = req.params;
    const canAccess = await employeeOwnsAvailability(
      req.user.userId,
      employeeId,
    );
    if (!canAccess) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await availabilityService.updateAvailability({
      employeeId,
      input: req.body,
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
