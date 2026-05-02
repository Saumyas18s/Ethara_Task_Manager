import { Router } from 'express';
import { updateProfile, createTeam, joinTeam, listMyTeams } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.put('/profile', updateProfile);
router.get('/teams', listMyTeams);
router.post('/teams', createTeam);
router.post('/teams/join', joinTeam);

export default router;
