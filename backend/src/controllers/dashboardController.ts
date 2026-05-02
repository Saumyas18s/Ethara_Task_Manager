import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id!;

    // Total tasks the user is involved in (assigned or in projects they belong to)
    const totalTasks = await prisma.task.count({
      where: {
        OR: [
          { assignee_id: userId },
          { project: { OR: [ { owner_id: userId }, { members: { some: { user_id: userId } } } ] } }
        ]
      }
    });

    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: {
        OR: [
          { assignee_id: userId },
          { project: { OR: [ { owner_id: userId }, { members: { some: { user_id: userId } } } ] } }
        ]
      },
      _count: { _all: true }
    });

    const overdueCount = await prisma.task.count({
      where: {
        OR: [
          { assignee_id: userId },
          { project: { OR: [ { owner_id: userId }, { members: { some: { user_id: userId } } } ] } }
        ],
        status: { not: 'DONE' },
        due_date: { lt: new Date() }
      }
    });

    const myTasks = await prisma.task.findMany({
      where: { assignee_id: userId },
      include: { project: { select: { name: true } } },
      take: 5,
      orderBy: { created_at: 'desc' }
    });

    const stats = {
      total_tasks: totalTasks,
      by_status: tasksByStatus.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count._all;
        return acc;
      }, {}),
      overdue_count: overdueCount,
      my_tasks: myTasks
    };

    return sendResponse(res, 200, stats, 'Dashboard stats retrieved');
  } catch (error) {
    next(error);
  }
};
