import { KeycloakClient } from './keycloak.service';
import { KeycloakConfig, LoginResponse } from '../types/auth.types';

export class AuthService {
    private keycloakClient: KeycloakClient;

    constructor() {
        const config: KeycloakConfig = {
            serverUrl: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
            realm: process.env.KEYCLOAK_REALM || 'myrealm',
            clientId: process.env.KEYCLOAK_CLIENT_ID || 'backend',
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'secret'
        };

        this.keycloakClient = new KeycloakClient(config);
    }

    /**
     * Authenticate user with username and password
     */
    async authenticate(username: string, password: string): Promise<LoginResponse> {
        // Input validation
        if (!username || !password) {
            return {
                success: false,
                error: 'Missing credentials',
                message: 'Username and password are required'
            };
        }

        if (username.trim().length === 0 || password.trim().length === 0) {
            return {
                success: false,
                error: 'Invalid credentials',
                message: 'Username and password cannot be empty'
            };
        }

        // Attempt authentication with Keycloak
        return await this.keycloakClient.authenticate(username.trim(), password);
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        if (!refreshToken || refreshToken.trim().length === 0) {
            return {
                success: false,
                error: 'Missing refresh token',
                message: 'Refresh token is required'
            };
        }

        return await this.keycloakClient.refreshToken(refreshToken.trim());
    }

    /**
     * Validate JWT token
     */
    async validateToken(token: string): Promise<any> {
        if (!token || token.trim().length === 0) {
            throw new Error('Token is required');
        }

        return await this.keycloakClient.introspectToken(token.trim());
    }

    /**
     * Logout user by invalidating refresh token
     */
    async logout(refreshToken: string): Promise<boolean> {
        if (!refreshToken || refreshToken.trim().length === 0) {
            return false;
        }

        return await this.keycloakClient.logout(refreshToken.trim());
    }

    /**
     * Check if Keycloak server is available
     */
    async healthCheck(): Promise<boolean> {
        return await this.keycloakClient.healthCheck();
    }
}