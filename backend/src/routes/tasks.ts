import { Router } from 'express';
import { createTask, updateTask } from '../controllers/taskcontroller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', createTask);
router.patch('/:id', updateTask);

export default router;