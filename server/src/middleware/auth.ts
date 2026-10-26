import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from './errorHandler';
import {
  hasPermission,
  type Permission,
  type StaffRole,
} from '../config/permissions';

export interface AuthUser {
  id: string;
  role: StaffRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'NO_TOKEN'));
  }

  let userId: string;
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as {
      id?: unknown;
    };
    if (typeof payload.id !== 'string') throw new Error('missing subject');
    userId = payload.id;
  } catch {
    return next(new AppError(401, 'INVALID_TOKEN'));
  }

  // Load the account on every request so role changes and deactivations
  // take effect immediately instead of waiting for token expiry.
  prisma.user
    .findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    })
    .then((user) => {
      if (!user || !user.isActive) {
        return next(new AppError(401, 'USER_INACTIVE'));
      }
      req.user = { id: user.id, role: user.role };
      next();
    })
    .catch(next);
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'NO_TOKEN'));
    if (!permissions.every((p) => hasPermission(req.user!.role, p))) {
      return next(new AppError(403, 'FORBIDDEN'));
    }
    next();
  };
}

export const authorize =
  (...roles: StaffRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN'));
    }
    next();
  };
