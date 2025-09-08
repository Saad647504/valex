import { Router } from 'express';
import { createTask, updateTask, moveTask, deleteTask, autoAssignTask } from '../controllers/taskcontroller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', createTask);
router.patch('/:id', updateTask);
router.patch('/:id/move', moveTask); // New route for drag & drop
router.post('/:id/auto-assign', autoAssignTask);
router.delete('/:id', deleteTask); // New route for task deletion

export default router;
