import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendResponse, sendError } from '../utils/response';
import { createTaskSchema, updateTaskSchema, reorderTasksSchema, commentSchema } from '../validators/task';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activity';

export const listProjectTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project_id = req.params['id'] as string;
    const userId = req.user?.id;

    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: { members: true }
    });

    if (!project) return sendError(res, 404, 'Project not found');
    
    const hasAccess = project.owner_id === userId || (project as any).members.some((m: any) => m.user_id === userId);
    if (!hasAccess) return sendError(res, 403, 'Access denied');

    const tasks = await prisma.task.findMany({
      where: { project_id, parent_id: null }, // Only list parent tasks in main board
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar_url: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true, subtasks: true } },
        subtasks: {
          include: { assignee: { select: { name: true, avatar_url: true } } }
        }
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' }
      ]
    });

    return sendResponse(res, 200, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project_id = req.params['id'] as string;
    const validatedData = createTaskSchema.parse(req.body);
    const userId = req.user?.id!;

    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: { members: true }
    });

    if (!project) return sendError(res, 404, 'Project not found');
    
    const hasAccess = project.owner_id === userId || (project as any).members.some((m: any) => m.user_id === userId);
    if (!hasAccess) return sendError(res, 403, 'Access denied');

    // Get max order in current status
    const maxOrder = await prisma.task.aggregate({
      where: { project_id, status: validatedData.status },
      _max: { order: true }
    });

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        due_date: validatedData.due_date ? new Date(validatedData.due_date) : null,
        project_id,
        assignee_id: validatedData.assignee_id,
        created_by: userId,
        order: (maxOrder._max.order || 0) + 1,
        parent_id: (req.body as any).parent_id || null // Support creating subtask
      }
    });

    await logActivity(project_id, userId, 'TASK_CREATED', `Task "${task.title}" created`);

    return sendResponse(res, 201, task, 'Task created successfully');
  } catch (error) {
    next(error);
  }
};

export const getTaskDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const userId = req.user?.id;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { include: { members: true } },
        assignee: { select: { id: true, name: true, email: true, avatar_url: true } },
        creator: { select: { id: true, name: true, email: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatar_url: true } } },
          orderBy: { created_at: 'desc' }
        },
        subtasks: {
          include: { assignee: { select: { name: true, avatar_url: true } } }
        },
        parent: { select: { id: true, title: true } }
      }
    });

    if (!task) return sendError(res, 404, 'Task not found');

    const hasAccess = (task as any).project.owner_id === userId || (task as any).project.members.some((m: any) => m.user_id === userId);
    if (!hasAccess) return sendError(res, 403, 'Access denied');

    return sendResponse(res, 200, task, 'Task details retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateTaskSchema.parse(req.body);
    const userId = req.user?.id!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { members: true } } }
    });

    if (!task) return sendError(res, 404, 'Task not found');

    const hasAccess = (task as any).project.owner_id === userId || (task as any).project.members.some((m: any) => m.user_id === userId);
    if (!hasAccess) return sendError(res, 403, 'Access denied');

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        due_date: validatedData.due_date ? new Date(validatedData.due_date) : undefined
      }
    });

    if (validatedData.status && validatedData.status !== task.status) {
      await logActivity(task.project_id, userId, 'TASK_STATUS_CHANGED', `Task "${task.title}" moved to ${validatedData.status}`);
    } else {
      await logActivity(task.project_id, userId, 'TASK_UPDATED', `Task "${task.title}" updated`);
    }

    return sendResponse(res, 200, updatedTask, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

export const reorderTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tasks } = reorderTasksSchema.parse(req.body);

    const updatePromises = tasks.map(task => 
      prisma.task.update({
        where: { id: task.id },
        data: { status: task.status, order: task.order }
      })
    );

    await Promise.all(updatePromises);

    return sendResponse(res, 200, null, 'Tasks reordered successfully');
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task_id = req.params['id'] as string;
    const { content } = commentSchema.parse(req.body);
    const userId = req.user?.id!;

    const task = await prisma.task.findUnique({
      where: { id: task_id },
      include: { project: { include: { members: true } } }
    });

    if (!task) return sendError(res, 404, 'Task not found');

    const hasAccess = (task as any).project.owner_id === userId || (task as any).project.members.some((m: any) => m.user_id === userId);
    if (!hasAccess) return sendError(res, 403, 'Access denied');

    const comment = await prisma.comment.create({
      data: {
        content,
        task_id,
        author_id: userId
      },
      include: { author: { select: { id: true, name: true, avatar_url: true } } }
    });

    await logActivity(task.project_id, userId, 'COMMENT_ADDED', `Commented on task "${task.title}"`);

    return sendResponse(res, 201, comment, 'Comment added successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const userId = req.user?.id!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!task) return sendError(res, 404, 'Task not found');

    if (req.user?.role !== 'ADMIN' && (task as any).project.owner_id !== userId) {
      return sendError(res, 403, 'Only admins or project owners can delete tasks');
    }

    await prisma.task.delete({ where: { id } });

    await logActivity(task.project_id, userId, 'TASK_DELETED', `Task "${task.title}" deleted`);

    return sendResponse(res, 200, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const splitTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task_id = req.params['id'] as string;
    const { subtasks } = req.body; // Array of titles

    const userId = req.user?.id!;

    const originalTask = await prisma.task.findUnique({
      where: { id: task_id },
      include: { project: true }
    });

    if (!originalTask) return sendError(res, 404, 'Task not found');

    const createdSubtasks = await Promise.all(subtasks.map((title: string, index: number) => 
      prisma.task.create({
        data: {
          title,
          project_id: originalTask.project_id,
          created_by: userId,
          parent_id: originalTask.id,
          order: index,
          status: originalTask.status,
          priority: originalTask.priority
        }
      })
    ));

    await logActivity(originalTask.project_id, userId, 'TASK_SPLIT', `Split task "${originalTask.title}" into ${subtasks.length} subtasks`);

    return sendResponse(res, 201, createdSubtasks, 'Task split into subtasks successfully');
  } catch (error) {
    next(error);
  }
};
