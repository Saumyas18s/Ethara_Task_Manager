import prisma from './prisma';

export const logActivity = async (projectId: string, userId: string, action: string, details?: string) => {
  try {
    await prisma.activityLog.create({
      data: {
        project_id: projectId,
        user_id: userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
