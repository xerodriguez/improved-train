import { KeycloakClient } from '../services/keycloak.service';
import { KeycloakConfig } from '../types/auth.types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KeycloakClient', () => {
    let keycloakClient: KeycloakClient;
    const mockConfig: KeycloakConfig = {
        serverUrl: 'http://localhost:8080',
        realm: 'myrealm',
        clientId: 'backend',
        clientSecret: 'secret'
    };

    beforeEach(() => {
        keycloakClient = new KeycloakClient(mockConfig);
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should return success response for valid credentials', async () => {
            const mockTokenResponse = {
                status: 200,
                data: {
                    access_token: 'mock-access-token',
                    refresh_token: 'mock-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 300,
                    refresh_expires_in: 1800
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

            const result = await keycloakClient.authenticate('testuser', 'testpass');

            expect(result.success).toBe(true);
            expect(result.accessToken).toBe('mock-access-token');
            expect(result.refreshToken).toBe('mock-refresh-token');
            expect(result.tokenType).toBe('Bearer');
            expect(result.expiresIn).toBe(300);
            expect(result.refreshExpiresIn).toBe(1800);
            expect(result.message).toBe('Authentication successful');
        });

        it('should return error response for invalid credentials', async () => {
            const mockErrorResponse = {
                response: {
                    status: 400,
                    data: {
                        error: 'invalid_grant',
                        error_description: 'Invalid user credentials'
                    }
                }
            };

            mockedAxios.post.mockRejectedValueOnce(mockErrorResponse);

            const result = await keycloakClient.authenticate('testuser', 'wrongpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid credentials');
            expect(result.message).toBe('Username or password is incorrect');
        });

        it('should handle network connection errors', async () => {
            const networkError = new Error('Network Error');
            (networkError as any).code = 'ECONNREFUSED';

            mockedAxios.post.mockRejectedValueOnce(networkError);

            const result = await keycloakClient.authenticate('testuser', 'testpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Keycloak server is not available');
            expect(result.message).toBe('Authentication service is currently unavailable. Please try again later.');
        });

        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Timeout');
            (timeoutError as any).code = 'ETIMEDOUT';

            mockedAxios.post.mockRejectedValueOnce(timeoutError);

            const result = await keycloakClient.authenticate('testuser', 'testpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Request timeout');
            expect(result.message).toBe('Authentication request timed out. Please try again.');
        });

        it('should handle 401 unauthorized response', async () => {
            const unauthorizedError = {
                response: {
                    status: 401,
                    data: {
                        error: 'unauthorized_client'
                    }
                }
            };

            mockedAxios.post.mockRejectedValueOnce(unauthorizedError);

            const result = await keycloakClient.authenticate('testuser', 'testpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
            expect(result.message).toBe('Invalid credentials or client configuration');
        });

        it('should handle 500 server error response', async () => {
            const serverError = {
                response: {
                    status: 500,
                    data: {
                        error: 'internal_server_error'
                    }
                }
            };

            mockedAxios.post.mockRejectedValueOnce(serverError);

            const result = await keycloakClient.authenticate('testuser', 'testpass');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Server error');
            expect(result.message).toBe('Keycloak server error. Please try again later.');
        });
    });

    describe('refreshToken', () => {
        it('should successfully refresh token', async () => {
            const mockTokenResponse = {
                status: 200,
                data: {
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 300,
                    refresh_expires_in: 1800
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

            const result = await keycloakClient.refreshToken('old-refresh-token');

            expect(result.success).toBe(true);
            expect(result.accessToken).toBe('new-access-token');
            expect(result.refreshToken).toBe('new-refresh-token');
            expect(result.message).toBe('Token refreshed successfully');
        });

        it('should handle invalid refresh token', async () => {
            const invalidTokenError = {
                response: {
                    status: 400,
                    data: {
                        error: 'invalid_grant',
                        error_description: 'Invalid refresh token'
                    }
                }
            };

            mockedAxios.post.mockRejectedValueOnce(invalidTokenError);

            const result = await keycloakClient.refreshToken('invalid-refresh-token');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid credentials');
        });
    });

    describe('introspectToken', () => {
        it('should successfully introspect valid token', async () => {
            const mockIntrospectResponse = {
                status: 200,
                data: {
                    active: true,
                    sub: 'user-id',
                    username: 'testuser',
                    exp: 1234567890
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockIntrospectResponse);

            const result = await keycloakClient.introspectToken('valid-token');

            expect(result.active).toBe(true);
            expect(result.username).toBe('testuser');
        });

        it('should handle introspection errors', async () => {
            const introspectError = new Error('Network Error');
            mockedAxios.post.mockRejectedValueOnce(introspectError);

            await expect(keycloakClient.introspectToken('invalid-token')).rejects.toThrow('Token introspection failed');
        });
    });

    describe('logout', () => {
        it('should successfully logout user', async () => {
            mockedAxios.post.mockResolvedValueOnce({ status: 200 });

            const result = await keycloakClient.logout('refresh-token');

            expect(result).toBe(true);
        });

        it('should handle logout errors gracefully', async () => {
            mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

            const result = await keycloakClient.logout('refresh-token');

            expect(result).toBe(false);
        });
    });

    describe('healthCheck', () => {
        it('should return true when Keycloak is available', async () => {
            mockedAxios.get.mockResolvedValueOnce({ status: 200 });

            const result = await keycloakClient.healthCheck();

            expect(result).toBe(true);
        });

        it('should return false when Keycloak is not available', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));

            const result = await keycloakClient.healthCheck();

            expect(result).toBe(false);
        });
    });
});