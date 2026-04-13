// get — return schedule entries, filtered by date range, with employee info included

// update — create or update schedule entries, assigning employees to shifts

import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import type { UpdateScheduleInput } from '../schema.js';

type GetScheduleParams = {
  userId: string;
  role: 'EMPLOYER' | 'EMPLOYEE';
  weekOf?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
};

type ScheduleEmployee = {
  id: string;
  firstName: string;
  lastName: string;
};

type ScheduleView = {
  id: string;
  date: Date;
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  employee: ScheduleEmployee;
};

function getWeekRange(weekOf: string): { start: Date; end: Date } {
  const start = new Date(weekOf);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function toScheduleView(entry: {
  id: string;
  date: Date;
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  employee: { id: string; firstName: string; lastName: string };
}): ScheduleView {
  return {
    id: entry.id,
    date: entry.date,
    shiftType: entry.shiftType,
    employee: {
      id: entry.employee.id,
      firstName: entry.employee.firstName,
      lastName: entry.employee.lastName,
    },
  };
}

export function getSchedule(
  params: GetScheduleParams,
): Promise<{ schedule: ScheduleView[] }> {
  return (async () => {
    let scopedEmployeeId: string | undefined;

    if (params.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: params.userId },
        select: { id: true },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      scopedEmployeeId = employee.id;
    } else if (params.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: params.employeeId },
        select: { id: true },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      scopedEmployeeId = employee.id;
    }

    const where: Prisma.ScheduleEntryWhereInput = {};

    if (scopedEmployeeId) {
      where.employeeId = scopedEmployeeId;
    }

    if (params.weekOf) {
      const { start, end } = getWeekRange(params.weekOf);
      where.date = { gte: start, lte: end };
    } else if (params.startDate || params.endDate) {
      const dateRange: { gte?: Date; lte?: Date } = {};
      if (params.startDate) dateRange.gte = new Date(params.startDate);
      if (params.endDate) dateRange.lte = new Date(params.endDate);
      where.date = dateRange;
    }

    const rows = await prisma.scheduleEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { shiftType: 'asc' }],
    });

    return { schedule: rows.map(toScheduleView) };
  })();
}

export async function updateSchedule(input: UpdateScheduleInput) {
  const employeeIds = [
    ...new Set(input.entries.map((entry) => entry.employeeId)),
  ];

  const existingEmployees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true },
  });

  if (existingEmployees.length !== employeeIds.length) {
    throw new Error('Employee not found');
  }

  const rows = await Promise.all(
    input.entries.map((entry) =>
      prisma.scheduleEntry.upsert({
        where: {
          employeeId_date_shiftType: {
            employeeId: entry.employeeId,
            date: new Date(entry.date),
            shiftType: entry.shiftType,
          },
        },
        create: {
          employeeId: entry.employeeId,
          date: new Date(entry.date),
          shiftType: entry.shiftType,
        },
        update: {},
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ),
  );

  rows.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;

    const shiftDiff = a.shiftType.localeCompare(b.shiftType);
    if (shiftDiff !== 0) return shiftDiff;

    return a.employee.lastName.localeCompare(b.employee.lastName);
  });

  return { schedule: rows.map(toScheduleView) };
}
