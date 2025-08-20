// backend/src/routes/projects.ts
import { Router } from 'express';
import { getProjects, createProject, getProject } from '../controllers/projectcontroller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(requireAuth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);

export default router;