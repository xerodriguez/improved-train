import request from 'supertest';
import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

// Mock the AuthService
jest.mock('../services/auth.service');

const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('AuthController', () => {
    let app: express.Application;
    let mockAuthService: jest.Mocked<AuthService>;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());

        // Add request ID middleware
        app.use((req, res, next) => {
            req.headers['x-request-id'] = 'test-request-id';
            next();
        });

        const authController = new AuthController();

        // Replace the AuthService instance
        mockAuthService = new MockedAuthService() as jest.Mocked<AuthService>;
        (authController as any).authService = mockAuthService;

        // Setup routes
        app.post('/login', authController.login);
        app.post('/refresh', authController.refreshToken);
        app.post('/logout', authController.logout);
        app.get('/validate', authController.validateToken);
        app.get('/health', authController.healthCheck);
    });

    describe('POST /login', () => {
        it('should return 200 and tokens for valid credentials', async () => {
            const mockResponse = {
                success: true,
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                tokenType: 'Bearer',
                expiresIn: 300,
                refreshExpiresIn: 1800,
                message: 'Authentication successful'
            };

            mockAuthService.authenticate.mockResolvedValueOnce(mockResponse);

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'testpass'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBe('mock-access-token');
            expect(response.body.data.refreshToken).toBe('mock-refresh-token');
            expect(mockAuthService.authenticate).toHaveBeenCalledWith('testuser', 'testpass');
        });

        it('should return 401 for invalid credentials', async () => {
            const mockResponse = {
                success: false,
                error: 'Invalid credentials',
                message: 'Username or password is incorrect'
            };

            mockAuthService.authenticate.mockResolvedValueOnce(mockResponse);

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpass'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 503 for service unavailable', async () => {
            const mockResponse = {
                success: false,
                error: 'Keycloak server is not available',
                message: 'Authentication service is currently unavailable. Please try again later.'
            };

            mockAuthService.authenticate.mockResolvedValueOnce(mockResponse);

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'testpass'
                });

            expect(response.status).toBe(503);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Keycloak server is not available');
        });

        it('should return 500 for unexpected errors', async () => {
            mockAuthService.authenticate.mockRejectedValueOnce(new Error('Unexpected error'));

            const response = await request(app)
                .post('/login')
                .send({
                    username: 'testuser',
                    password: 'testpass'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Internal server error');
        });

        it('should handle missing request body', async () => {
            const response = await request(app)
                .post('/login')
                .send({});

            expect(response.status).toBe(500); // Because no validation middleware in this test
        });
    });

    describe('POST /refresh', () => {
        it('should return 200 and new tokens for valid refresh token', async () => {
            const mockResponse = {
                success: true,
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                tokenType: 'Bearer',
                expiresIn: 300,
                refreshExpiresIn: 1800,
                message: 'Token refreshed successfully'
            };

            mockAuthService.refreshToken.mockResolvedValueOnce(mockResponse);

            const response = await request(app)
                .post('/refresh')
                .send({
                    refreshToken: 'valid-refresh-token'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBe('new-access-token');
            expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
        });

        it('should return 401 for invalid refresh token', async () => {
            const mockResponse = {
                success: false,
                error: 'Invalid credentials',
                message: 'Refresh token is invalid or expired'
            };

            mockAuthService.refreshToken.mockResolvedValueOnce(mockResponse);

            const response = await request(app)
                .post('/refresh')
                .send({
                    refreshToken: 'invalid-refresh-token'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });
    });

    describe('POST /logout', () => {
        it('should return 200 for successful logout', async () => {
            mockAuthService.logout.mockResolvedValueOnce(true);

            const response = await request(app)
                .post('/logout')
                .send({
                    refreshToken: 'valid-refresh-token'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
            expect(mockAuthService.logout).toHaveBeenCalledWith('valid-refresh-token');
        });

        it('should return 500 for logout failure', async () => {
            mockAuthService.logout.mockResolvedValueOnce(false);

            const response = await request(app)
                .post('/logout')
                .send({
                    refreshToken: 'valid-refresh-token'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Logout failed');
        });
    });

    describe('GET /validate', () => {
        it('should return 200 for valid token', async () => {
            const mockTokenInfo = {
                active: true,
                username: 'testuser',
                exp: 1234567890
            };

            mockAuthService.validateToken.mockResolvedValueOnce(mockTokenInfo);

            const response = await request(app)
                .get('/validate')
                .set('Authorization', 'Bearer valid-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.active).toBe(true);
            expect(response.body.data.username).toBe('testuser');
            expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
        });

        it('should return 401 for inactive token', async () => {
            const mockTokenInfo = {
                active: false
            };

            mockAuthService.validateToken.mockResolvedValueOnce(mockTokenInfo);

            const response = await request(app)
                .get('/validate')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid token');
        });

        it('should return 400 for missing authorization header', async () => {
            const response = await request(app)
                .get('/validate');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid authorization header');
        });

        it('should return 400 for invalid authorization header format', async () => {
            const response = await request(app)
                .get('/validate')
                .set('Authorization', 'InvalidFormat');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid authorization header');
        });
    });

    describe('GET /health', () => {
        it('should return 200 when service is healthy', async () => {
            mockAuthService.healthCheck.mockResolvedValueOnce(true);

            const response = await request(app)
                .get('/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.service).toBe('auth-service');
            expect(response.body.data.keycloak).toBe('healthy');
        });

        it('should return 503 when Keycloak is unhealthy', async () => {
            mockAuthService.healthCheck.mockResolvedValueOnce(false);

            const response = await request(app)
                .get('/health');

            expect(response.status).toBe(503);
            expect(response.body.success).toBe(false);
            expect(response.body.data.keycloak).toBe('unhealthy');
        });

        it('should return 500 for health check errors', async () => {
            mockAuthService.healthCheck.mockRejectedValueOnce(new Error('Health check failed'));

            const response = await request(app)
                .get('/health');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Health check failed');
        });
    });
});