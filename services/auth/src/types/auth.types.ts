export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    refreshExpiresIn?: number;
    error?: string;
    message?: string;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    'not-before-policy': number;
    session_state: string;
    scope: string;
}

export interface KeycloakErrorResponse {
    error: string;
    error_description?: string;
}

export interface KeycloakConfig {
    serverUrl: string;
    realm: string;
    clientId: string;
    clientSecret: string;
}

export interface AuthError extends Error {
    status?: number;
    code?: string;
    details?: any;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
    requestId?: string;
}