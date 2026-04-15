import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'EMPLOYER' | 'EMPLOYEE';
      };
    }
  }
}

export {};
