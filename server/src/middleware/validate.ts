import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schemas: Partial<Record<Source, ZodSchema>>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const [key, schema] of Object.entries(schemas) as [Source, ZodSchema][]) {
        req[key] = schema.parse(req[key]);
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}