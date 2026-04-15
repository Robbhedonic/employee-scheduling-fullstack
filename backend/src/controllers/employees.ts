import type { RequestHandler } from 'express';
import {
  createEmployeeRecord,
  getAllEmployees,
  getEmployeeById,
} from '../services/employees.js';
import type { CreateEmployeeInput } from '../schema.js';

export const getAll: RequestHandler = async (_req, res) => {
  try {
    const employees = await getAllEmployees();
    res.status(200).json({ employees });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const create: RequestHandler<
  Record<string, never>,
  unknown,
  CreateEmployeeInput
> = async (req, res) => {
  try {
    const employee = await createEmployeeRecord(req.body);
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
