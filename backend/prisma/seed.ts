import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import 'dotenv/config';

const connectionString =
  process.env['DATABASE_URL'] ||
  'postgresql://postgres:password@localhost:5433/employee_scheduling';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';

function getMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

async function main() {
  // Shared password for all seeded accounts — dev only.
  const defaultPasswordHash = await hash('password123', 10);

  // Employer — single owner account used to manage the schedule.
  await prisma.user.upsert({
    where: { email: 'owner@company.com' },
    update: {
      role: 'EMPLOYER',
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: 'owner@company.com',
      passwordHash: defaultPasswordHash,
      role: 'EMPLOYER',
    },
  });

  // Employees — staff profiles, each with a matching User account for login.
  const employees = [
    {
      firstName: 'Juan',
      lastName: 'Garcia',
      email: 'juan.garcia@company.com',
      phone: '070-1111111',
      position: 'Chef',
      avatar: 'https://example.com/avatars/juan.png',
    },
    {
      firstName: 'Maria',
      lastName: 'Fernandez',
      email: 'maria.fernandez@company.com',
      phone: '070-2222222',
      position: 'Waiter',
      avatar: 'https://example.com/avatars/maria.png',
    },
    {
      firstName: 'Pedro',
      lastName: 'Martinez',
      email: 'pedro.martinez@company.com',
      phone: '070-3333333',
      position: 'Barista',
      avatar: 'https://example.com/avatars/pedro.png',
    },
  ];

  const employeeRecordsByEmail = new Map<string, { id: string }>();

  for (const employee of employees) {
    const user = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        role: 'EMPLOYEE',
        passwordHash: defaultPasswordHash,
      },
      create: {
        email: employee.email,
        passwordHash: defaultPasswordHash,
        role: 'EMPLOYEE',
      },
    });

    const record = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        position: employee.position,
        avatar: employee.avatar,
      },
      create: {
        userId: user.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        position: employee.position,
        avatar: employee.avatar,
      },
    });

    employeeRecordsByEmail.set(employee.email, { id: record.id });
  }

  // Seed availability and schedule for the current week (Mon-Sun).
  const monday = getMonday(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const juanId = employeeRecordsByEmail.get('juan.garcia@company.com')!.id;
  const mariaId = employeeRecordsByEmail.get('maria.fernandez@company.com')!.id;
  const pedroId = employeeRecordsByEmail.get('pedro.martinez@company.com')!.id;

  const allShifts: ShiftType[] = ['MORNING', 'AFTERNOON', 'NIGHT'];

  // Availability patterns per employee.
  const availabilityPatterns: Array<{
    employeeId: string;
    pattern: (dayIndex: number, shift: ShiftType) => boolean;
  }> = [
    {
      // Juan (Chef): weekdays all shifts, weekends off.
      employeeId: juanId,
      pattern: (dayIndex) => dayIndex < 5,
    },
    {
      // Maria (Waiter): weekdays afternoon/night, weekends night only.
      employeeId: mariaId,
      pattern: (dayIndex, shift) => {
        if (dayIndex < 5) return shift !== 'MORNING';
        return shift === 'NIGHT';
      },
    },
    {
      // Pedro (Barista): weekday mornings, weekend morning+afternoon.
      employeeId: pedroId,
      pattern: (dayIndex, shift) => {
        if (dayIndex < 5) return shift === 'MORNING';
        return shift !== 'NIGHT';
      },
    },
  ];

  let availabilityCount = 0;
  for (const { employeeId, pattern } of availabilityPatterns) {
    for (let dayIndex = 0; dayIndex < weekDates.length; dayIndex++) {
      const date = weekDates[dayIndex]!;
      for (const shiftType of allShifts) {
        const isAvailable = pattern(dayIndex, shiftType);
        await prisma.availability.upsert({
          where: {
            employeeId_date_shiftType: { employeeId, date, shiftType },
          },
          update: { isAvailable },
          create: { employeeId, date, shiftType, isAvailable },
        });
        availabilityCount++;
      }
    }
  }

  // Schedule entries: a partial week so there's data to read AND open slots to fill via PUT.
  const scheduleAssignments: Array<{
    dayIndex: number;
    shiftType: ShiftType;
    employeeId: string;
  }> = [
    { dayIndex: 0, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 0, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 0, shiftType: 'AFTERNOON', employeeId: mariaId },
    { dayIndex: 1, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 1, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 2, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 2, shiftType: 'NIGHT', employeeId: mariaId },
  ];

  for (const entry of scheduleAssignments) {
    const date = weekDates[entry.dayIndex]!;
    await prisma.scheduleEntry.upsert({
      where: {
        employeeId_date_shiftType: {
          employeeId: entry.employeeId,
          date,
          shiftType: entry.shiftType,
        },
      },
      update: {},
      create: {
        employeeId: entry.employeeId,
        date,
        shiftType: entry.shiftType,
      },
    });
  }

  console.log(
    `Seed completed: 1 employer, ${employees.length} employees, ${availabilityCount} availability rows, ${scheduleAssignments.length} scheduled shifts`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
