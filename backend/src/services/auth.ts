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
  };
};

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, secret, {
    expiresIn: '7d',
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}
