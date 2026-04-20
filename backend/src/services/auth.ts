// login — verify credentials, return a signed token

import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import type { LoginInput } from '../schema.js';

type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'EMPLOYER' | 'EMPLOYEE';
    employeeId?: string;
  };
};

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: { select: { id: true } } },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // JWT_SECRET presence is guaranteed by the startup check in index.ts.
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.employee ? { employeeId: user.employee.id } : {}),
    },
  };
}
