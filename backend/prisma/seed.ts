import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.createMany({
    data: [
      {
        name: "Carlos Rivera",
        email: "carlos.rivera@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYER"
      },
      {
        name: "Lucia Mendoza",
        email: "lucia.mendoza@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYER"
      },
      {
        name: "Juan Garcia",
        email: "juan.garcia@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYEE"
      },
      {
        name: "Maria Fernandez",
        email: "maria.fernandez@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYEE"
      },
      {
        name: "Pedro Martinez",
        email: "pedro.martinez@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYEE"
      },
      {
        name: "Ana Lopez",
        email: "ana.lopez@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYEE"
      },
      {
        name: "David Sanchez",
        email: "david.sanchez@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYEE"
      },
      {
        name: "Rosa Torres",
        email: "rosa.torres@company.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "EMPLOYEE"
      }
    ],
    skipDuplicates: true
  });

  console.log(`Seeded ${users.count} users`);
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
