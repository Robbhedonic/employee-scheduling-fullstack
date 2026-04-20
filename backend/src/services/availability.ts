// get — return availability entries for an employee, filtered by date range

// getAll — return availability entries across all employees, filtered by date range (employer view)

// update — create or update availability entries for an employee

import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import type { UpdateAvailabilityInput } from '../schema.js';

type GetAvailabilityParams = {
  employeeId: string;
  weekOf?: string;
  startDate?: string;
  endDate?: string;
};

type GetAllAvailabilityParams = {
  weekOf?: string;
  startDate?: string;
  endDate?: string;
};

type UpdateAvailabilityParams = {
  employeeId: string;
  input: UpdateAvailabilityInput;
};

function getWeekRange(weekOf: string): { start: Date; end: Date } {
  const start = new Date(weekOf);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export async function getAvailability(params: GetAvailabilityParams) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.employeeId },
    select: { id: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const where = (() => {
    if (params.weekOf) {
      const { start, end } = getWeekRange(params.weekOf);
      return {
        employeeId: params.employeeId,
        date: { gte: start, lte: end },
      };
    }

    if (params.startDate || params.endDate) {
      const dateRange: { gte?: Date; lte?: Date } = {};
      if (params.startDate) dateRange.gte = new Date(params.startDate);
      if (params.endDate) dateRange.lte = new Date(params.endDate);

      return {
        employeeId: params.employeeId,
        date: dateRange,
      };
    }

    return { employeeId: params.employeeId };
  })();

  const availability = await prisma.availability.findMany({
    where,
    orderBy: [{ date: 'asc' }, { shiftType: 'asc' }],
  });

  return { availability };
}

export async function getAllAvailability(params: GetAllAvailabilityParams) {
  const where: Prisma.AvailabilityWhereInput = {};

  if (params.weekOf) {
    const { start, end } = getWeekRange(params.weekOf);
    where.date = { gte: start, lte: end };
  } else if (params.startDate || params.endDate) {
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (params.startDate) dateRange.gte = new Date(params.startDate);
    if (params.endDate) dateRange.lte = new Date(params.endDate);
    where.date = dateRange;
  }

  const availability = await prisma.availability.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ employeeId: 'asc' }, { date: 'asc' }, { shiftType: 'asc' }],
  });

  return { availability };
}

export async function updateAvailability(params: UpdateAvailabilityParams) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.employeeId },
    select: { id: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const rows = await Promise.all(
    params.input.entries.map((entry) =>
      prisma.availability.upsert({
        where: {
          employeeId_date_shiftType: {
            employeeId: params.employeeId,
            date: new Date(entry.date),
            shiftType: entry.shiftType,
          },
        },
        create: {
          employeeId: params.employeeId,
          date: new Date(entry.date),
          shiftType: entry.shiftType,
          isAvailable: entry.isAvailable,
        },
        update: {
          isAvailable: entry.isAvailable,
        },
      }),
    ),
  );

  rows.sort((a, b) => {
    const d = a.date.getTime() - b.date.getTime();
    if (d !== 0) return d;
    return a.shiftType.localeCompare(b.shiftType);
  });

  return { availability: rows };
}
