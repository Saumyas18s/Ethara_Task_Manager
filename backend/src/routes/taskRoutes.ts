import { Router } from 'express';
import { 
  listProjectTasks, 
  createTask, 
  getTaskDetail, 
  updateTask, 
  deleteTask,
  reorderTasks,
  addComment,
  splitTask
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/reorder', reorderTasks);

// Individual task routes
router.get('/:id', getTaskDetail);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);
router.post('/:id/split', splitTask);

export default router;
