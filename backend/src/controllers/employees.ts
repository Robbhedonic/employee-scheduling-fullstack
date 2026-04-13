import type { RequestHandler } from 'express';
import {
  createEmployeeRecord,
  getAllEmployees,
  getEmployeeById,
} from '../services/employees.js';

export const getAll: RequestHandler = async (_req, res) => {
  try {
    const employees = await getAllEmployees();
    res.status(200).json({ employees });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

type CreateEmployeeBody = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  position?: string;
  avatar?: string;
};

function parseCreateEmployeeBody(body: unknown): CreateEmployeeBody | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;

  const firstName = value.firstName;
  const lastName = value.lastName;
  const email = value.email;
  const password = value.password;
  const phone = value.phone;
  const position = value.position;
  const avatar = value.avatar;

  if (typeof firstName !== 'string' || firstName.trim() === '') return null;
  if (typeof lastName !== 'string' || lastName.trim() === '') return null;
  if (typeof email !== 'string' || !email.includes('@')) return null;
  if (typeof password !== 'string' || password.trim() === '') return null;
  if (phone !== undefined && typeof phone !== 'string') return null;
  if (position !== undefined && typeof position !== 'string') return null;
  if (avatar !== undefined && typeof avatar !== 'string') return null;

  return {
    firstName,
    lastName,
    email,
    password,
    phone,
    position,
    avatar,
  };
}

export const create: RequestHandler = async (req, res) => {
  try {
    const parsed = parseCreateEmployeeBody(req.body);
    if (!parsed) {
      res.status(400).json({ error: 'Validation error' });
      return;
    }

    const employee = await createEmployeeRecord(parsed);
    res.status(201).json({ employee });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already exists') {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getById: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const employee = await getEmployeeById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    res.status(200).json({ employee });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
