import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  due_date: z.string().optional().refine(val => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, {
    message: "Invalid date format"
  }).refine(val => {
    if (!val) return true;
    return new Date(val) >= new Date(new Date().setHours(0,0,0,0));
  }, {
    message: "Due date cannot be in the past"
  }),
  assignee_id: z.string().optional(),
  order: z.number().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  due_date: z.string().optional().refine(val => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, {
    message: "Invalid date format"
  }),
  assignee_id: z.string().optional(),
  order: z.number().optional(),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    order: z.number(),
  })),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});
