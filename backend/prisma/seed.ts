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

async function main() {
  const defaultPasswordHash = await hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'owner@company.com' },
    update: {
      name: 'Owner Employer',
      role: 'EMPLOYER',
      passwordHash: defaultPasswordHash,
    },
    create: {
      name: 'Owner Employer',
      email: 'owner@company.com',
      passwordHash: defaultPasswordHash,
      role: 'EMPLOYER',
    },
  });

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

  for (const employee of employees) {
    const user = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        name: `${employee.firstName} ${employee.lastName}`,
        role: 'EMPLOYEE',
        passwordHash: defaultPasswordHash,
      },
      create: {
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        passwordHash: defaultPasswordHash,
        role: 'EMPLOYEE',
      },
    });

    await prisma.employee.upsert({
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
  }

  console.log('Seed completed: 1 employer and 3 employees');
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
