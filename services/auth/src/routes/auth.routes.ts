import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import {
    loginValidation,
    refreshTokenValidation,
    logoutValidation
} from '../middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

// Login endpoint
router.post('/login', loginValidation, authController.login);

// Token refresh endpoint
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

// Logout endpoint
router.post('/logout', logoutValidation, authController.logout);

// Token validation endpoint
router.get('/validate', authController.validateToken);

// Health check endpoint
router.get('/health', authController.healthCheck);

export default router;