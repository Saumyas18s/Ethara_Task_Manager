import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
