import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { sendResponse, sendError } from '../utils/response';
import { registerSchema, loginSchema } from '../validators/auth';
import { AuthRequest } from '../middleware/auth';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return sendError(res, 400, 'User already exists');
    }

    const password_hash = await bcrypt.hash(validatedData.password, 10);

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'MEMBER';

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password_hash,
        role,
      },
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id, user.role);

    return sendResponse(res, 201, { user: userWithoutPassword, token }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !(await bcrypt.compare(validatedData.password, user.password_hash))) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id, user.role);

    return sendResponse(res, 200, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, name: true, email: true, role: true, avatar_url: true, created_at: true },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendResponse(res, 200, user, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};
