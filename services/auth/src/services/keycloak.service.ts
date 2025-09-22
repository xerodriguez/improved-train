import axios, { AxiosResponse, AxiosError } from 'axios';
import {
    KeycloakConfig,
    TokenResponse,
    KeycloakErrorResponse,
    AuthError,
    LoginResponse
} from '../types/auth.types';

export class KeycloakClient {
    private config: KeycloakConfig;

    constructor(config: KeycloakConfig) {
        this.config = config;
    }

    /**
     * Authenticate user with username and password
     * Uses Keycloak's Direct Access Grant (Resource Owner Password Credentials flow)
     */
    async authenticate(username: string, password: string): Promise<LoginResponse> {
        try {
            const tokenUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;

            const requestData = new URLSearchParams({
                grant_type: 'password',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                username: username,
                password: password,
                scope: 'openid profile email'
            });

            console.log(`Attempting authentication for user: ${username}`);
            console.log(`Token URL: ${tokenUrl}`);

            const response: AxiosResponse<TokenResponse> = await axios.post(
                tokenUrl,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 10000, // 10 second timeout
                }
            );

            if (response.status === 200 && response.data.access_token) {
                console.log(`Authentication successful for user: ${username}`);

                return {
                    success: true,
                    accessToken: response.data.access_token,
                    refreshToken: response.data.refresh_token,
                    tokenType: response.data.token_type,
                    expiresIn: response.data.expires_in,
                    refreshExpiresIn: response.data.refresh_expires_in,
                    message: 'Authentication successful'
                };
            } else {
                throw new Error('Invalid response from Keycloak server');
            }

        } catch (error) {
            return this.handleAuthenticationError(error as AxiosError, username);
        }
    }

    /**
     * Refresh an access token using a refresh token
     */
    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        try {
            const tokenUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;

            const requestData = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                refresh_token: refreshToken
            });

            const response: AxiosResponse<TokenResponse> = await axios.post(
                tokenUrl,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 10000,
                }
            );

            if (response.status === 200 && response.data.access_token) {
                return {
                    success: true,
                    accessToken: response.data.access_token,
                    refreshToken: response.data.refresh_token,
                    tokenType: response.data.token_type,
                    expiresIn: response.data.expires_in,
                    refreshExpiresIn: response.data.refresh_expires_in,
                    message: 'Token refreshed successfully'
                };
            } else {
                throw new Error('Invalid response from Keycloak server');
            }

        } catch (error) {
            return this.handleAuthenticationError(error as AxiosError);
        }
    }

    /**
     * Validate a JWT token with Keycloak
     */
    async introspectToken(token: string): Promise<any> {
        try {
            const introspectUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/token/introspect`;

            const requestData = new URLSearchParams({
                token: token,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret
            });

            const response = await axios.post(
                introspectUrl,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 5000,
                }
            );

            return response.data;

        } catch (error) {
            console.error('Token introspection failed:', error);
            throw this.createAuthError('Token introspection failed', 500, 'INTROSPECTION_ERROR');
        }
    }

    /**
     * Logout a user by invalidating their refresh token
     */
    async logout(refreshToken: string): Promise<boolean> {
        try {
            const logoutUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/logout`;

            const requestData = new URLSearchParams({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                refresh_token: refreshToken
            });

            await axios.post(
                logoutUrl,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 5000,
                }
            );

            return true;

        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }

    /**
     * Handle authentication errors and convert them to appropriate responses
     */
    private handleAuthenticationError(error: AxiosError, username?: string): LoginResponse {
        console.error('Authentication error:', error.message);

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return {
                success: false,
                error: 'Keycloak server is not available',
                message: 'Authentication service is currently unavailable. Please try again later.'
            };
        }

        if (error.code === 'ETIMEDOUT') {
            return {
                success: false,
                error: 'Request timeout',
                message: 'Authentication request timed out. Please try again.'
            };
        }

        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data as KeycloakErrorResponse;

            switch (status) {
                case 400:
                    if (errorData.error === 'invalid_grant') {
                        return {
                            success: false,
                            error: 'Invalid credentials',
                            message: 'Username or password is incorrect'
                        };
                    }
                    return {
                        success: false,
                        error: 'Bad request',
                        message: errorData.error_description || 'Invalid request parameters'
                    };

                case 401:
                    return {
                        success: false,
                        error: 'Unauthorized',
                        message: 'Invalid credentials or client configuration'
                    };

                case 403:
                    return {
                        success: false,
                        error: 'Forbidden',
                        message: 'Access denied'
                    };

                case 500:
                    return {
                        success: false,
                        error: 'Server error',
                        message: 'Keycloak server error. Please try again later.'
                    };

                default:
                    return {
                        success: false,
                        error: 'Authentication failed',
                        message: `Unexpected error occurred (${status})`
                    };
            }
        }

        // Network or other errors
        return {
            success: false,
            error: 'Network error',
            message: 'Failed to connect to authentication server'
        };
    }

    /**
     * Create a structured authentication error
     */
    private createAuthError(message: string, status: number, code: string): AuthError {
        const error = new Error(message) as AuthError;
        error.status = status;
        error.code = code;
        return error;
    }

    /**
     * Health check for Keycloak server
     */
    async healthCheck(): Promise<boolean> {
        try {
            const healthUrl = `${this.config.serverUrl}/realms/${this.config.realm}/.well-known/openid_configuration`;
            const response = await axios.get(healthUrl, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.error('Keycloak health check failed:', error);
            return false;
        }
    }
}