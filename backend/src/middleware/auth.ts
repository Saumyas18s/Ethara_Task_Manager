import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MEMBER';
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; role: 'ADMIN' | 'MEMBER' };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true }
    });

    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid token');
  }
};

export const verifyRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'Permission denied');
    }
    next();
  };
};
