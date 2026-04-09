import type { Request, Response } from 'express';
import * as employeeService from '../services/employees.js';

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json(employees);
  } catch {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      role,
      password,
      firstName,
      lastName,
      phone,
      position,
      avatar,
    } = req.body as {
      name: string;
      email: string;
      role: 'EMPLOYER' | 'EMPLOYEE';
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      position?: string;
      avatar: string;
    };
    const employee = await employeeService.createEmployee({
      name,
      email,
      role,
      password,
      firstName,
      lastName,
      phone,
      position,
      avatar,
    });
    res.status(201).json(employee);
  } catch {
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const employee = await employeeService.getEmployeeById(Number(id));
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};
