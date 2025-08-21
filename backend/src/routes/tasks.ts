import { Router } from 'express';
import { createTask, updateTask, moveTask } from '../controllers/taskcontroller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', createTask);
router.patch('/:id', updateTask);
router.patch('/:id/move', moveTask); // New route for drag & drop

export default router;