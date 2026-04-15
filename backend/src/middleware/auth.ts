// authenticate — reads "Authorization: Bearer <token>" header
//   - Verifies JWT with process.env.JWT_SECRET
//   - Attaches decoded payload (userId, role) to req (e.g. req.user)
//   - Returns 401 if token is missing or invalid

// requireRole(role) — returns middleware that checks req.user.role
//   - Returns 403 if the user's role doesn't match
//   - Must run after authenticate

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type UserRole = 'EMPLOYER' | 'EMPLOYEE';

type JwtPayload = {
  userId: string;
  role: UserRole;
};

function getTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = getTokenFromHeader(req);
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET is not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}
