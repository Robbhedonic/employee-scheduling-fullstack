import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '../schema.js';

type EmployeeView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  avatar: string | null;
};

export const getAllEmployees = async (): Promise<EmployeeView[]> => {
  const rows = await prisma.employee.findMany({
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    include: { user: { select: { email: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.user.email,
    phone: row.phone,
    position: row.position,
    avatar: row.avatar,
  }));
};

export const createEmployeeRecord = async (
  input: CreateEmployeeInput,
): Promise<EmployeeView> => {
  const { firstName, lastName, email, password, phone, position, avatar } =
    input;

  const passwordHash = await hash(password, 10);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'EMPLOYEE',
        },
      });

      return tx.employee.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          position,
          avatar: avatar ?? null,
        },
      });
    });

    return {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      email,
      phone: created.phone,
      position: created.position,
      avatar: created.avatar,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('Email already exists', { cause: error });
    }

    throw error;
  }
};

export const updateEmployee = async (
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeView | null> => {
  const { email, password, ...employeeFields } = input;
  const passwordHash = password ? await hash(password, 10) : undefined;
  const hasUserUpdate = email !== undefined || passwordHash !== undefined;
  const hasEmployeeUpdate = Object.keys(employeeFields).length > 0;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.employee.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!existing) return null;

      if (hasUserUpdate) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(email !== undefined && { email }),
            ...(passwordHash !== undefined && { passwordHash }),
          },
        });
      }

      if (hasEmployeeUpdate) {
        await tx.employee.update({
          where: { id },
          data: employeeFields,
        });
      }

      return tx.employee.findUniqueOrThrow({
        where: { id },
        include: { user: { select: { email: true } } },
      });
    });

    if (!updated) return null;

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.user.email,
      phone: updated.phone,
      position: updated.position,
      avatar: updated.avatar,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('Email already exists', { cause: error });
    }

    throw error;
  }
};

export const getEmployeeById = async (
  id: string,
): Promise<EmployeeView | null> => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  if (!employee) return null;

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.user.email,
    phone: employee.phone,
    position: employee.position,
    avatar: employee.avatar,
  };
};
