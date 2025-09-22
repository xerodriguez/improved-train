import { AuthService } from '../services/auth.service';
import { KeycloakClient } from '../services/keycloak.service';

// Mock the KeycloakClient
jest.mock('../services/keycloak.service');

const MockedKeycloakClient = KeycloakClient as jest.MockedClass<typeof KeycloakClient>;

describe('AuthService', () => {
    let authService: AuthService;
    let mockKeycloakClient: jest.Mocked<KeycloakClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockKeycloakClient = new MockedKeycloakClient({} as any) as jest.Mocked<KeycloakClient>;
        authService = new AuthService();
        // Replace the keycloakClient instance
        (authService as any).keycloakClient = mockKeycloakClient;
    });

    describe('authenticate', () => {
        it('should return success response for valid credentials', async () => {
            const mockResponse = {
                success: true,
                accessToken: 'mock-token',
                refreshToken: 'mock-refresh',
                tokenType: 'Bearer',
                expiresIn: 300,
                refreshExpiresIn: 1800,
                message: 'Authentication successful'
            };

            mockKeycloakClient.authenticate.mockResolvedValueOnce(mockResponse);

            const result = await authService.authenticate('testuser', 'testpass');

            expect(result.success).toBe(true);
            expect(result.accessToken).toBe('mock-token');
            expect(mockKeycloakClient.authenticate).toHaveBeenCalledWith('testuser', 'testpass');
        });

        it('should return error for missing username', async () => {
            const result = await authService.authenticate('', 'testpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Missing credentials');
            expect(result.message).toBe('Username and password are required');
            expect(mockKeycloakClient.authenticate).not.toHaveBeenCalled();
        });

        it('should return error for missing password', async () => {
            const result = await authService.authenticate('testuser', '');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Missing credentials');
            expect(mockKeycloakClient.authenticate).not.toHaveBeenCalled();
        });

        it('should return error for whitespace-only username', async () => {
            const result = await authService.authenticate('   ', 'testpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid credentials');
            expect(result.message).toBe('Username and password cannot be empty');
        });

        it('should return error for whitespace-only password', async () => {
            const result = await authService.authenticate('testuser', '   ');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid credentials');
            expect(result.message).toBe('Username and password cannot be empty');
        });

        it('should trim whitespace from credentials', async () => {
            const mockResponse = {
                success: true,
                accessToken: 'mock-token',
                message: 'Authentication successful'
            };

            mockKeycloakClient.authenticate.mockResolvedValueOnce(mockResponse);

            await authService.authenticate('  testuser  ', 'testpass');

            expect(mockKeycloakClient.authenticate).toHaveBeenCalledWith('testuser', 'testpass');
        });
    });

    describe('refreshToken', () => {
        it('should successfully refresh token', async () => {
            const mockResponse = {
                success: true,
                accessToken: 'new-token',
                refreshToken: 'new-refresh',
                message: 'Token refreshed successfully'
            };

            mockKeycloakClient.refreshToken.mockResolvedValueOnce(mockResponse);

            const result = await authService.refreshToken('old-refresh-token');

            expect(result.success).toBe(true);
            expect(result.accessToken).toBe('new-token');
            expect(mockKeycloakClient.refreshToken).toHaveBeenCalledWith('old-refresh-token');
        });

        it('should return error for missing refresh token', async () => {
            const result = await authService.refreshToken('');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Missing refresh token');
            expect(result.message).toBe('Refresh token is required');
            expect(mockKeycloakClient.refreshToken).not.toHaveBeenCalled();
        });

        it('should return error for whitespace-only refresh token', async () => {
            const result = await authService.refreshToken('   ');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Missing refresh token');
            expect(mockKeycloakClient.refreshToken).not.toHaveBeenCalled();
        });

        it('should trim whitespace from refresh token', async () => {
            const mockResponse = {
                success: true,
                accessToken: 'new-token',
                message: 'Token refreshed successfully'
            };

            mockKeycloakClient.refreshToken.mockResolvedValueOnce(mockResponse);

            await authService.refreshToken('  refresh-token  ');

            expect(mockKeycloakClient.refreshToken).toHaveBeenCalledWith('refresh-token');
        });
    });

    describe('validateToken', () => {
        it('should successfully validate token', async () => {
            const mockTokenInfo = {
                active: true,
                username: 'testuser',
                exp: 1234567890
            };

            mockKeycloakClient.introspectToken.mockResolvedValueOnce(mockTokenInfo);

            const result = await authService.validateToken('valid-token');

            expect(result.active).toBe(true);
            expect(result.username).toBe('testuser');
            expect(mockKeycloakClient.introspectToken).toHaveBeenCalledWith('valid-token');
        });

        it('should throw error for missing token', async () => {
            await expect(authService.validateToken('')).rejects.toThrow('Token is required');
            expect(mockKeycloakClient.introspectToken).not.toHaveBeenCalled();
        });

        it('should throw error for whitespace-only token', async () => {
            await expect(authService.validateToken('   ')).rejects.toThrow('Token is required');
            expect(mockKeycloakClient.introspectToken).not.toHaveBeenCalled();
        });

        it('should trim whitespace from token', async () => {
            const mockTokenInfo = { active: true };
            mockKeycloakClient.introspectToken.mockResolvedValueOnce(mockTokenInfo);

            await authService.validateToken('  token  ');

            expect(mockKeycloakClient.introspectToken).toHaveBeenCalledWith('token');
        });
    });

    describe('logout', () => {
        it('should successfully logout user', async () => {
            mockKeycloakClient.logout.mockResolvedValueOnce(true);

            const result = await authService.logout('refresh-token');

            expect(result).toBe(true);
            expect(mockKeycloakClient.logout).toHaveBeenCalledWith('refresh-token');
        });

        it('should return false for missing refresh token', async () => {
            const result = await authService.logout('');

            expect(result).toBe(false);
            expect(mockKeycloakClient.logout).not.toHaveBeenCalled();
        });

        it('should return false for whitespace-only refresh token', async () => {
            const result = await authService.logout('   ');

            expect(result).toBe(false);
            expect(mockKeycloakClient.logout).not.toHaveBeenCalled();
        });

        it('should trim whitespace from refresh token', async () => {
            mockKeycloakClient.logout.mockResolvedValueOnce(true);

            await authService.logout('  refresh-token  ');

            expect(mockKeycloakClient.logout).toHaveBeenCalledWith('refresh-token');
        });
    });

    describe('healthCheck', () => {
        it('should return health check result', async () => {
            mockKeycloakClient.healthCheck.mockResolvedValueOnce(true);

            const result = await authService.healthCheck();

            expect(result).toBe(true);
            expect(mockKeycloakClient.healthCheck).toHaveBeenCalled();
        });

        it('should return false when health check fails', async () => {
            mockKeycloakClient.healthCheck.mockResolvedValueOnce(false);

            const result = await authService.healthCheck();

            expect(result).toBe(false);
        });
    });
});