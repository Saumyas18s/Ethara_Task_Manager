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
router.post('/', createProject); // Allow any user to create (Logic inside handles role)
router.get('/:id', getProjectDetail);
router.put('/:id', updateProject); // Logic inside handles ownership/admin
router.delete('/:id', deleteProject); // Logic inside handles ownership/admin

router.post('/:id/members', addMember); // Logic inside handles ownership/admin
router.delete('/:id/members/:uid', removeMember); // Logic inside handles ownership/admin

// Task routes nested in projects
router.get('/:id/tasks', listProjectTasks);
router.post('/:id/tasks', createTask);

export default router;
