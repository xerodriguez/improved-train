import { Router } from 'express';
import authMiddleware, { AuthenticatedRequest } from '../middleware/auth.middleware';
import serviceProxy from '../utils/service-proxy';
import { Response } from 'express';

const router = Router();

// Authentication routes - NO AUTHENTICATION REQUIRED
// These routes are public and handle login/logout
router.all('/auth*', async (req: AuthenticatedRequest, res: Response) => {
    const authPath = req.path.replace('/auth', '/auth');
    await serviceProxy.forwardRequest('auth', req, res, authPath);
});

// Products routes with authentication
router.use('/products', authMiddleware.authenticate);

// Forward all products requests to the products service
router.all('/products*', async (req: AuthenticatedRequest, res: Response) => {
    const productPath = req.path.replace('/products', '/api/v1/products');
    await serviceProxy.forwardRequest('products', req, res, productPath);
});

// Suppliers routes with authentication (placeholder for future implementation)
router.use('/suppliers', authMiddleware.authenticate);
router.all('/suppliers*', async (req: AuthenticatedRequest, res: Response) => {
    const supplierPath = req.path.replace('/suppliers', '/api/v1/suppliers');
    await serviceProxy.forwardRequest('suppliers', req, res, supplierPath);
});

// Users routes with authentication (placeholder for future implementation)
router.use('/users', authMiddleware.authenticate);
router.all('/users*', async (req: AuthenticatedRequest, res: Response) => {
    const userPath = req.path.replace('/users', '/api/v1/users');
    await serviceProxy.forwardRequest('users', req, res, userPath);
});

export default router;