import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../core/ApiError';

export function validateRequest<T extends ZodSchema>(
  schema: T,
  property: 'body' | 'query' | 'params'| 'headers'= 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[property]);
    if (!parsed.success) {
      return next(
        new BadRequestError(
          parsed.error.issues.map(i => i.message).join(', ')
        )
      );
    }
    req[property] = parsed.data;
    next();
  };
}
