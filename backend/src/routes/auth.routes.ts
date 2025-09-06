import { Router } from 'express';
import { AuthController } from '../controllers/auth.controllers';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/perfil', authMiddleware, AuthController.perfil);

export default router;