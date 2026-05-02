import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendResponse, sendError } from '../utils/response';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from '../validators/project';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activity';

export const listProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { members: true, tasks: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    return sendResponse(res, 200, projects, 'Projects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const userId = req.user?.id!;

    console.log(`Creating project: ${validatedData.name} for user ${userId}`);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || '',
        color: validatedData.color || '#5B4FCF',
        emoji: validatedData.emoji || '🚀',
        owner_id: userId,
        members: {
          create: {
            user_id: userId,
            role: 'ADMIN'
          }
        }
      }
    });

    await logActivity(project.id, userId, 'PROJECT_CREATED', `Project "${project.name}" created`);

    return sendResponse(res, 201, project, 'Project created successfully');
  } catch (error: any) {
    console.error('Project creation failed:', error);
    next(error);
  }
};

export const getProjectDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const userId = req.user?.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        activityLogs: {
          include: { user: { select: { name: true } } },
          orderBy: { created_at: 'desc' },
          take: 20
        }
      }
    });

    if (!project) {
      return sendError(res, 404, 'Project not found');
    }

    const isMember = project.members.some((m: any) => m.user_id === userId) || project.owner_id === userId;
    if (!isMember) {
      return sendError(res, 403, 'Access denied');
    }

    return sendResponse(res, 200, project, 'Project details retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateProjectSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return sendError(res, 404, 'Project not found');
    
    if (project.owner_id !== req.user?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 403, 'Only project owner or admin can update');
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: validatedData
    });

    await logActivity(id, req.user?.id!, 'PROJECT_UPDATED', `Project details updated`);

    return sendResponse(res, 200, updatedProject, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return sendError(res, 404, 'Project not found');

    if (project.owner_id !== req.user?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 403, 'Only project owner or admin can delete');
    }

    await prisma.project.delete({ where: { id } });

    return sendResponse(res, 200, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project_id = req.params['id'] as string;
    const { email, role } = addMemberSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: project_id } });
    if (!project) return sendError(res, 404, 'Project not found');

    if (project.owner_id !== req.user?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 403, 'Only project owner or admin can add members');
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return sendError(res, 404, 'User not found');

    const member = await prisma.projectMember.upsert({
      where: { project_id_user_id: { project_id, user_id: userToAdd.id } },
      update: { role },
      create: { project_id, user_id: userToAdd.id, role }
    });

    await logActivity(project_id, req.user?.id!, 'MEMBER_ADDED', `Added ${userToAdd.name} as ${role}`);

    return sendResponse(res, 200, member, 'Member added successfully');
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project_id = req.params['id'] as string;
    const user_id = req.params['uid'] as string;

    const project = await prisma.project.findUnique({ where: { id: project_id } });
    if (!project) return sendError(res, 404, 'Project not found');

    if (project.owner_id !== req.user?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 403, 'Only project owner or admin can remove members');
    }

    if (project.owner_id === user_id) {
      return sendError(res, 400, 'Cannot remove project owner');
    }

    const memberToRemove = await prisma.user.findUnique({ where: { id: user_id } });

    await prisma.projectMember.deleteMany({
      where: { project_id, user_id }
    });

    if (memberToRemove) {
      await logActivity(project_id, req.user?.id!, 'MEMBER_REMOVED', `Removed ${memberToRemove.name}`);
    }

    return sendResponse(res, 200, null, 'Member removed successfully');
  } catch (error) {
    next(error);
  }
};
