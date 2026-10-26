import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      issues: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.code, message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'UNIQUE_CONSTRAINT',
        fields: (err.meta?.target as string[]) ?? [],
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
  }

  logger.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
}