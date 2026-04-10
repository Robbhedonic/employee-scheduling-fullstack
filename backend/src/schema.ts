// Zod schemas — single source of truth for API input validation
// Export inferred types with: export type LoginInput = z.infer<typeof loginSchema>

// loginSchema             — POST /auth/login (email, password)

// createEmployeeSchema    — POST /employees (firstName, lastName, email, password, phone?, position?, avatar?)

// updateAvailabilitySchema — PUT /availability/:employeeId (entries: { date, shiftType, isAvailable }[])

// updateScheduleSchema    — PUT /schedule (entries: { date, shiftType, employeeId }[])

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

const shiftTypeSchema = z.enum(['MORNING', 'AFTERNOON', 'NIGHT']);

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  phone: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateAvailabilitySchema = z.object({
  entries: z
    .array(
      z.object({
        date: z.string().date(),
        shiftType: shiftTypeSchema,
        isAvailable: z.boolean(),
      }),
    )
    .min(1),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
