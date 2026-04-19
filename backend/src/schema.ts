// Zod schemas — single source of truth for API input validation
// Export inferred types with: export type LoginInput = z.infer<typeof loginSchema>

// loginSchema             — POST /auth/login (email, password)

// createEmployeeSchema    — POST /employees (firstName, lastName, email, password, phone?, position?, avatar?)

// updateEmployeeSchema    — PUT /employees/:id (any subset of firstName, lastName, email, password, phone, position, avatar)

// updateAvailabilitySchema — PUT /availability/:employeeId (entries: { date, shiftType, isAvailable }[])

// updateScheduleSchema    — PUT /schedule (entries: { date, shiftType, employeeId }[])

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

const shiftTypeSchema = z.enum(['MORNING', 'AFTERNOON', 'NIGHT']);

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
  phone: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  avatar: z.url().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.email().optional(),
    password: z.string().min(1).optional(),
    phone: z.string().min(1).nullable().optional(),
    position: z.string().min(1).nullable().optional(),
    avatar: z.url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const updateAvailabilitySchema = z.object({
  entries: z
    .array(
      z.object({
        date: z.iso.date(),
        shiftType: shiftTypeSchema,
        isAvailable: z.boolean(),
      }),
    )
    .min(1),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

export const availabilityQuerySchema = z
  .object({
    weekOf: z.iso.date().optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.weekOf && (value.startDate || value.endDate)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Use either weekOf or startDate/endDate, not both',
      });
    }

    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (start > end) {
        ctx.addIssue({
          code: 'custom',
          message: 'startDate must be before or equal to endDate',
        });
      }
    }
  });

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;

export const updateScheduleSchema = z.object({
  entries: z
    .array(
      z.object({
        date: z.iso.date(),
        shiftType: shiftTypeSchema,
        employeeId: z.uuid(),
      }),
    )
    .min(1),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const scheduleQuerySchema = z
  .object({
    weekOf: z.iso.date().optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
    employeeId: z.uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.weekOf && (value.startDate || value.endDate)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Use either weekOf or startDate/endDate, not both',
      });
    }

    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (start > end) {
        ctx.addIssue({
          code: 'custom',
          message: 'startDate must be before or equal to endDate',
        });
      }
    }
  });

export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
