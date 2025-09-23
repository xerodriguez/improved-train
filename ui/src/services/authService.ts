import axios, { AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse, AuthUser } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const AUTH_SERVICE_URL = `${API_BASE_URL}/api/auth`;

// Token storage keys
const ACCESS_TOKEN_KEY = 'northwind_access_token';
const REFRESH_TOKEN_KEY = 'northwind_refresh_token';
const USER_DATA_KEY = 'northwind_user_data';

export class AuthService {
    /**
     * Login user with username and password
     */
    static async login(username: string, password: string): Promise<AuthUser> {
        try {
            const loginData: LoginRequest = { username, password };

            const response: AxiosResponse<any> = await axios.post(
                `${AUTH_SERVICE_URL}/login`,
                loginData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 second timeout
                }
            );

            const { accessToken, refreshToken, expiresIn } = response.data.data;

            // Calculate expiration time
            const expiresAt = Date.now() + (expiresIn * 1000);

            const user: AuthUser = {
                username,
                token: accessToken,
                refreshToken: refreshToken,
                expiresAt,
            };

            // Store tokens and user data
            this.storeAuthData(user);

            return user;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Invalid username or password');
                } else if (error.response && error.response.status >= 500) {
                    throw new Error('Authentication service is temporarily unavailable');
                } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
                    throw new Error('Unable to connect to authentication service');
                } else {
                    throw new Error(error.response?.data?.message || 'Login failed');
                }
            }
            throw new Error('An unexpected error occurred during login');
        }
    }

    /**
     * Logout user and clear stored data
     */
    static async logout(): Promise<void> {
        try {
            const token = this.getStoredToken();

            if (token) {
                // Call logout endpoint to invalidate token on server
                await axios.post(
                    `${AUTH_SERVICE_URL}/logout`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 5000,
                    }
                );
            }
        } catch (error) {
            // Log error but don't throw - we still want to clear local storage
            console.warn('Error during server logout:', error);
        } finally {
            // Always clear local storage
            this.clearAuthData();
        }
    }

    /**
     * Refresh access token using refresh token
     */
    static async refreshToken(): Promise<AuthUser | null> {
        try {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

            if (!refreshToken) {
                return null;
            }

            const response: AxiosResponse<LoginResponse> = await axios.post(
                `${AUTH_SERVICE_URL}/refresh`,
                { refresh_token: refreshToken },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
            const userData = this.getStoredUserData();

            if (!userData) {
                return null;
            }

            const expiresAt = Date.now() + (expires_in * 1000);

            const user: AuthUser = {
                ...userData,
                token: access_token,
                refreshToken: new_refresh_token || refreshToken,
                expiresAt,
            };

            this.storeAuthData(user);
            return user;
        } catch (error) {
            // If refresh fails, clear stored data
            this.clearAuthData();
            return null;
        }
    }

    /**
     * Validate current token
     */
    static async validateToken(): Promise<boolean> {
        try {
            const token = this.getStoredToken();

            if (!token) {
                return false;
            }

            await axios.get(`${AUTH_SERVICE_URL}/validate`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                timeout: 5000,
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get stored authentication token
     */
    static getStoredToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    /**
     * Get stored user data
     */
    static getStoredUserData(): AuthUser | null {
        try {
            const userData = localStorage.getItem(USER_DATA_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        const token = this.getStoredToken();
        const userData = this.getStoredUserData();

        if (!token || !userData) {
            return false;
        }

        // Check if token is expired
        if (userData.expiresAt && Date.now() >= userData.expiresAt) {
            this.clearAuthData();
            return false;
        }

        return true;
    }

    /**
     * Store authentication data in localStorage
     */
    private static storeAuthData(user: AuthUser): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, user.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, user.refreshToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify({
            username: user.username,
            expiresAt: user.expiresAt,
        }));
    }

    /**
     * Clear all authentication data from localStorage
     */
    private static clearAuthData(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
    }

    /**
     * Get authorization header for API requests
     */
    static getAuthorizationHeader(): Record<string, string> | {} {
        const token = this.getStoredToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
}