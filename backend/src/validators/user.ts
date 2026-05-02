import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
});

export const joinTeamSchema = z.object({
  code: z.string().min(4, 'Join code is too short'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
});
