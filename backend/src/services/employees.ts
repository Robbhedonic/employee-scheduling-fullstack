import prisma from '../../prisma/index.js';
import { hash } from 'bcryptjs';
import type { Role } from '@prisma/client';

export const getAllEmployees = async () => {
  return prisma.employee.findMany({
    include: {
      availabilities: true,
      scheduleEntries: true,
    },
  });
};

export const createEmployee = async ({
  name,
  email,
  role,
  password,
  firstName,
  lastName,
  phone,
  position,
  avatar,
}: {
  name: string;
  email: string;
  role: Role;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  avatar: string;
}) => {
  const hashedPassword = await hash(password, 10);
  // Crear usuario
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashedPassword,
    },
  });
  // Crear empleado asociado
  const employee = await prisma.employee.create({
    data: {
      userId: user.id.toString(),
      firstName,
      lastName,
      phone,
      position,
      avatar,
    },
  });
  return { ...employee, user };
};

export const getEmployeeById = async (id: number) => {
  return prisma.employee.findUnique({
    where: { id: id.toString() }, // ✅ FIX
    include: {
      availabilities: true,
      scheduleEntries: true,
    },
  });
};
