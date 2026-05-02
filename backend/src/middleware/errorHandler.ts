import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof ZodError) {
    const errors = (err as any).errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(422).json({
      success: false,
      data: errors,
      message: 'Validation failed'
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, status, message);
};
