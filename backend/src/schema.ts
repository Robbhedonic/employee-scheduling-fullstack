// Zod schemas — single source of truth for API input validation
// Export inferred types with: export type LoginInput = z.infer<typeof loginSchema>

// loginSchema             — POST /auth/login (email, password)

// createEmployeeSchema    — POST /employees (firstName, lastName, email, password, phone?, position?, avatar?)

// updateAvailabilitySchema — PUT /availability/:employeeId (entries: { date, shiftType, isAvailable }[])

// updateScheduleSchema    — PUT /schedule (entries: { date, shiftType, employeeId }[])
