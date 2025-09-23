import authMiddleware from '../middleware/auth.middleware';
// import Keycloak from "keycloak-connect";
import serviceProxy from '../utils/service-proxy';
import express, { Router, Request, Response } from 'express';

const router = Router();

// Authentication routes - NO AUTHENTICATION REQUIRED
// These routes are public and handle login/logout
router.all('/auth*', async (req: Request, res: Response) => {
    const authPath = req.path.replace('/auth', '/auth');
    await serviceProxy.forwardRequest('auth', req, res, authPath);
});

// Products routes - AUTHENTICATION REQUIRED
// router.use('/products', authMiddleware.authenticate);
router.all('/products*', async (req: Request, res: Response) => {
    const productPath = req.path.replace('/products', '/api/v1/products');
    await serviceProxy.forwardRequest('products', req, res, productPath);
});

// Suppliers routes - AUTHENTICATION REQUIRED  
// router.use('/suppliers', authMiddleware.authenticate);
router.all('/suppliers*', async (req: Request, res: Response) => {
    const supplierPath = req.path.replace('/suppliers', '/api/v1/suppliers');
    await serviceProxy.forwardRequest('suppliers', req, res, supplierPath);
});

// Users routes - AUTHENTICATION REQUIRED
// router.use('/users', authMiddleware.authenticate);
router.all('/users*', async (req: Request, res: Response) => {
    const userPath = req.path.replace('/users', '/api/v1/users');
    await serviceProxy.forwardRequest('users', req, res, userPath);
});

export default router;