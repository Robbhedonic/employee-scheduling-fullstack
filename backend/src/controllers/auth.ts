// login
import type { RequestHandler } from 'express';
import { login as loginService } from '../services/auth.js';
import type { LoginInput } from '../schema.js';

export const login: RequestHandler<
  Record<string, string>,
  unknown,
  LoginInput
> = async (req, res) => {
  try {
    const result = await loginService(req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};
