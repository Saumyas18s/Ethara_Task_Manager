import { Router } from 'express';
import { 
  listProjects, 
  createProject, 
  getProjectDetail, 
  updateProject, 
  deleteProject, 
  addMember, 
  removeMember 
} from '../controllers/projectController';
import { listProjectTasks, createTask } from '../controllers/taskController';
import { authenticate, verifyRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listProjects);
router.post('/', verifyRole(['ADMIN']), createProject);
router.get('/:id', getProjectDetail);
router.put('/:id', verifyRole(['ADMIN']), updateProject);
router.delete('/:id', verifyRole(['ADMIN']), deleteProject);

router.post('/:id/members', verifyRole(['ADMIN']), addMember);
router.delete('/:id/members/:uid', verifyRole(['ADMIN']), removeMember);

// Task routes nested in projects
router.get('/:id/tasks', listProjectTasks);
router.post('/:id/tasks', createTask);

export default router;
