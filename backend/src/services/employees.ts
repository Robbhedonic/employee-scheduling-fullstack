import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import type { CreateEmployeeInput } from '../schema.js';

type EmployeeView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  avatar: string;
};

export const getAllEmployees = async (): Promise<EmployeeView[]> => {
  const rows = await prisma.employee.findMany({
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });

  const userIds = rows.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const userEmailById = new Map(users.map((user) => [user.id, user.email]));

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: userEmailById.get(row.userId) ?? '',
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
          avatar: avatar ?? '',
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

export const getEmployeeById = async (
  id: string,
): Promise<EmployeeView | null> => {
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) return null;

  const user = await prisma.user.findUnique({
    where: { id: employee.userId },
    select: { email: true },
  });

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: user?.email ?? '',
    phone: employee.phone,
    position: employee.position,
    avatar: employee.avatar,
  };
};
