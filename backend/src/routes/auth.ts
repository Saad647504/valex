import { Router } from 'express';
import { register, login, getMe } from '../controllers/authcontroller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

export default router;