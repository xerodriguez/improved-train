import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { LoginRequest, ApiResponse, LoginResponse } from '../types/auth.types';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Handle login requests
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: 'Invalid request parameters',
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
                return;
            }

            const { username, password }: LoginRequest = req.body;

            console.log(`Login attempt for username: ${username}`);

            const result = await this.authService.authenticate(username, password);

            if (result.success) {
                console.log(`Login successful for username: ${username}`);
                res.status(200).json({
                    success: true,
                    data: {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        tokenType: result.tokenType,
                        expiresIn: result.expiresIn,
                        refreshExpiresIn: result.refreshExpiresIn
                    },
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<Partial<LoginResponse>>);
            } else {
                console.log(`Login failed for username: ${username} - ${result.error}`);
                const statusCode = this.getStatusCodeFromError(result.error || '');
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
            }

        } catch (error) {
            console.error('Login controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during authentication',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            } as ApiResponse<null>);
        }
    };

    /**
     * Handle token refresh requests
     */
    public refreshToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: 'Invalid request parameters',
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
                return;
            }

            const { refreshToken } = req.body;

            const result = await this.authService.refreshToken(refreshToken);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        tokenType: result.tokenType,
                        expiresIn: result.expiresIn,
                        refreshExpiresIn: result.refreshExpiresIn
                    },
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<Partial<LoginResponse>>);
            } else {
                const statusCode = this.getStatusCodeFromError(result.error || '');
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
            }

        } catch (error) {
            console.error('Token refresh controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during token refresh',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            } as ApiResponse<null>);
        }
    };

    /**
     * Handle logout requests
     */
    public logout = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: 'Invalid request parameters',
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
                return;
            }

            const { refreshToken } = req.body;

            const success = await this.authService.logout(refreshToken);

            if (success) {
                res.status(200).json({
                    success: true,
                    message: 'Logout successful',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Logout failed',
                    message: 'Failed to invalidate tokens',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
            }

        } catch (error) {
            console.error('Logout controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during logout',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            } as ApiResponse<null>);
        }
    };

    /**
     * Handle token validation requests
     */
    public validateToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid authorization header',
                    message: 'Bearer token required',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
                return;
            }

            const token = authHeader.substring(7);
            const tokenInfo = await this.authService.validateToken(token);

            if (tokenInfo.active) {
                res.status(200).json({
                    success: true,
                    data: tokenInfo,
                    message: 'Token is valid',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<any>);
            } else {
                res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                    message: 'Token is not active or has expired',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                } as ApiResponse<null>);
            }

        } catch (error) {
            console.error('Token validation controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during token validation',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            } as ApiResponse<null>);
        }
    };

    /**
     * Health check endpoint
     */
    public healthCheck = async (req: Request, res: Response): Promise<void> => {
        try {
            const isKeycloakHealthy = await this.authService.healthCheck();

            res.status(isKeycloakHealthy ? 200 : 503).json({
                success: isKeycloakHealthy,
                data: {
                    service: 'auth-service',
                    keycloak: isKeycloakHealthy ? 'healthy' : 'unhealthy'
                },
                message: isKeycloakHealthy ? 'Service is healthy' : 'Keycloak is not available',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            } as ApiResponse<any>);

        } catch (error) {
            console.error('Health check error:', error);
            res.status(500).json({
                success: false,
                error: 'Health check failed',
                message: 'Unable to perform health check',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            } as ApiResponse<null>);
        }
    };

    /**
     * Map error messages to appropriate HTTP status codes
     */
    private getStatusCodeFromError(error: string): number {
        if (error.includes('Invalid credentials') || error.includes('invalid_grant')) {
            return 401;
        }
        if (error.includes('Validation failed') || error.includes('Bad request')) {
            return 400;
        }
        if (error.includes('Forbidden')) {
            return 403;
        }
        if (error.includes('not available') || error.includes('timeout')) {
            return 503;
        }
        return 500;
    }
}