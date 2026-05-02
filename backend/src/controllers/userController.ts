import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendResponse, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { updateProfileSchema, createTeamSchema, joinTeamSchema } from '../validators/user';

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const userId = req.user?.id!;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: { id: true, name: true, email: true, role: true, avatar_url: true, created_at: true }
    });

    return sendResponse(res, 200, updatedUser, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = createTeamSchema.parse(req.body);
    const userId = req.user?.id!;

    // Generate a simple unique join code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const team = await prisma.team.create({
      data: {
        name,
        code,
        owner_id: userId,
        members: {
          create: {
            user_id: userId
          }
        }
      },
      include: {
        members: { include: { user: { select: { name: true, email: true, avatar_url: true } } } }
      }
    });

    return sendResponse(res, 201, team, 'Team created successfully');
  } catch (error) {
    next(error);
  }
};

export const joinTeam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = joinTeamSchema.parse(req.body);
    const userId = req.user?.id!;

    const team = await prisma.team.findUnique({
      where: { code }
    });

    if (!team) {
      return sendError(res, 404, 'Invalid team code');
    }

    const membership = await prisma.teamMember.upsert({
      where: { team_id_user_id: { team_id: team.id, user_id: userId } },
      update: {},
      create: {
        team_id: team.id,
        user_id: userId
      }
    });

    return sendResponse(res, 200, team, 'Joined team successfully');
  } catch (error) {
    next(error);
  }
};

export const listMyTeams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id!;

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } }
        ]
      },
      include: {
        _count: { select: { members: true, projects: true } }
      }
    });

    return sendResponse(res, 200, teams, 'Teams retrieved successfully');
  } catch (error) {
    next(error);
  }
};
