import { Router } from 'express';
import { getProjects, createProject, getProject, getProjectByKey, deleteProject } from '../controllers/projectcontroller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(requireAuth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/key/:key', getProjectByKey);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);

export default router;
