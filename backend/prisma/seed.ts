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

// Work in UTC so @db.Date columns store the same YYYY-MM-DD regardless of
// the machine's timezone. Local-time math drifts by one day in timezones
// east of UTC.
function getMonday(d: Date): Date {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setUTCDate(date.getUTCDate() + n);
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

  // Seed availability + schedule across this week and next (14 days, Mon-Sun x 2).
  const thisMonday = getMonday(new Date());
  const nextMonday = addDays(thisMonday, 7);
  const windowStart = thisMonday;
  const windowEnd = addDays(thisMonday, 13);
  const days = Array.from({ length: 14 }, (_, i) => addDays(thisMonday, i));

  const juanId = employeeRecordsByEmail.get('juan.garcia@company.com')!.id;
  const mariaId = employeeRecordsByEmail.get('maria.fernandez@company.com')!.id;
  const pedroId = employeeRecordsByEmail.get('pedro.martinez@company.com')!.id;
  const seededIds = [juanId, mariaId, pedroId];

  // Wipe seeded employees' availability + schedule rows in the 14-day window so
  // re-running the seed is idempotent and any manual UI edits get reset.
  await prisma.availability.deleteMany({
    where: {
      employeeId: { in: seededIds },
      date: { gte: windowStart, lte: windowEnd },
    },
  });
  await prisma.scheduleEntry.deleteMany({
    where: {
      employeeId: { in: seededIds },
      date: { gte: windowStart, lte: windowEnd },
    },
  });

  const allShifts: ShiftType[] = ['MORNING', 'AFTERNOON', 'NIGHT'];

  // Per-week availability patterns. Day index 0 = Monday, 6 = Sunday.
  // Two weeks, two slightly different lives:
  //   - this week is the "normal" rhythm
  //   - next week introduces variety: Juan takes Wed-Fri off (vacation),
  //     Maria picks up morning shifts to cover, Pedro stays consistent.
  type Pattern = (dayIndex: number, shift: ShiftType) => boolean;
  const weekPatterns: Array<{
    monday: Date;
    patterns: Array<{ employeeId: string; pattern: Pattern }>;
  }> = [
    {
      monday: thisMonday,
      patterns: [
        // Juan (Chef): weekdays all shifts, weekends off.
        { employeeId: juanId, pattern: (di) => di < 5 },
        // Maria (Waiter): weekdays afternoon/night, weekends night only.
        {
          employeeId: mariaId,
          pattern: (di, s) => (di < 5 ? s !== 'MORNING' : s === 'NIGHT'),
        },
        // Pedro (Barista): weekday mornings, weekend morning+afternoon.
        {
          employeeId: pedroId,
          pattern: (di, s) => (di < 5 ? s === 'MORNING' : s !== 'NIGHT'),
        },
      ],
    },
    {
      monday: nextMonday,
      patterns: [
        // Juan: vacation Wed-Fri (di 2-4); otherwise his usual all-shifts weekday.
        {
          employeeId: juanId,
          pattern: (di) => di < 5 && (di < 2 || di > 4),
        },
        // Maria: full availability Mon-Sat (covering Juan's vacation),
        // Sunday off.
        { employeeId: mariaId, pattern: (di) => di < 6 },
        // Pedro: same as this week.
        {
          employeeId: pedroId,
          pattern: (di, s) => (di < 5 ? s === 'MORNING' : s !== 'NIGHT'),
        },
      ],
    },
  ];

  let availabilityCount = 0;
  for (const { monday, patterns } of weekPatterns) {
    for (const { employeeId, pattern } of patterns) {
      for (let di = 0; di < 7; di++) {
        const date = addDays(monday, di);
        for (const shiftType of allShifts) {
          await prisma.availability.create({
            data: {
              employeeId,
              date,
              shiftType,
              isAvailable: pattern(di, shiftType),
            },
          });
          availabilityCount++;
        }
      }
    }
  }

  // Schedule entries spanning both weeks, with variety:
  //   - both weekdays and weekends covered
  //   - some shifts double-staffed (Fri afternoon, Sat night)
  //   - one employee picking up a double on a single day (Maria on Tue-next)
  //   - Sun-next intentionally empty so the manager has something to fill
  const scheduleAssignments: Array<{
    dayIndex: number; // 0..13
    shiftType: ShiftType;
    employeeId: string;
  }> = [
    // ---- This week ----
    // Mon
    { dayIndex: 0, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 0, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 0, shiftType: 'AFTERNOON', employeeId: mariaId },
    // Tue
    { dayIndex: 1, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 1, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 1, shiftType: 'NIGHT', employeeId: mariaId },
    // Wed
    { dayIndex: 2, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 2, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 2, shiftType: 'NIGHT', employeeId: mariaId },
    // Thu
    { dayIndex: 3, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 3, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 3, shiftType: 'NIGHT', employeeId: mariaId },
    // Fri (busy night - both Juan and Maria cover)
    { dayIndex: 4, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 4, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 4, shiftType: 'AFTERNOON', employeeId: mariaId },
    { dayIndex: 4, shiftType: 'NIGHT', employeeId: mariaId },
    // Sat (weekend coverage)
    { dayIndex: 5, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 5, shiftType: 'NIGHT', employeeId: mariaId },
    // Sun (lighter weekend)
    { dayIndex: 6, shiftType: 'AFTERNOON', employeeId: pedroId },
    { dayIndex: 6, shiftType: 'NIGHT', employeeId: mariaId },

    // ---- Next week ----
    // Mon
    { dayIndex: 7, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 7, shiftType: 'AFTERNOON', employeeId: juanId },
    { dayIndex: 7, shiftType: 'NIGHT', employeeId: mariaId },
    // Tue (Maria pulls a double - afternoon AND night)
    { dayIndex: 8, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 8, shiftType: 'AFTERNOON', employeeId: mariaId },
    { dayIndex: 8, shiftType: 'NIGHT', employeeId: mariaId },
    // Wed (Juan on vacation - Maria covers afternoon)
    { dayIndex: 9, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 9, shiftType: 'AFTERNOON', employeeId: mariaId },
    { dayIndex: 9, shiftType: 'NIGHT', employeeId: mariaId },
    // Thu (Juan still on vacation)
    { dayIndex: 10, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 10, shiftType: 'AFTERNOON', employeeId: mariaId },
    // Fri (Juan still on vacation; Pedro pulls a double - morning AND afternoon)
    { dayIndex: 11, shiftType: 'MORNING', employeeId: pedroId },
    { dayIndex: 11, shiftType: 'AFTERNOON', employeeId: pedroId },
    { dayIndex: 11, shiftType: 'NIGHT', employeeId: mariaId },
    // Sat (light - one shift)
    { dayIndex: 12, shiftType: 'MORNING', employeeId: pedroId },
    // Sun: intentionally empty so the manager has something to plan
  ];

  for (const entry of scheduleAssignments) {
    const date = days[entry.dayIndex]!;
    await prisma.scheduleEntry.create({
      data: {
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
