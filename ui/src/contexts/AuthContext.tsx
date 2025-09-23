import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthUser, AuthState } from '../types';
import { AuthService } from '../services/authService';

// Initial state
const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Action types
type AuthAction =
    | { type: 'LOGIN_START' }
    | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
    | { type: 'LOGIN_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RESTORE_SESSION'; payload: AuthUser };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        case 'RESTORE_SESSION':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        default:
            return state;
    }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Restore session on app load
    useEffect(() => {
        const restoreSession = async () => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });

                // Check if user is authenticated from stored data
                if (AuthService.isAuthenticated()) {
                    const userData = AuthService.getStoredUserData();
                    const token = AuthService.getStoredToken();

                    if (userData && token) {
                        // Validate token with server
                        const isValid = await AuthService.validateToken();

                        if (isValid) {
                            const user: AuthUser = {
                                ...userData,
                                token,
                                refreshToken: localStorage.getItem('northwind_refresh_token') || '',
                            };
                            dispatch({ type: 'RESTORE_SESSION', payload: user });
                            return;
                        }
                    }
                }

                // If no valid session, try to refresh token
                const refreshedUser = await AuthService.refreshToken();
                if (refreshedUser) {
                    dispatch({ type: 'RESTORE_SESSION', payload: refreshedUser });
                } else {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } catch (error) {
                console.warn('Session restoration failed:', error);
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        restoreSession();
    }, []);

    // Login function
    const login = async (username: string, password: string): Promise<void> => {
        try {
            dispatch({ type: 'LOGIN_START' });

            const user = await AuthService.login(username, password);
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
            throw error; // Re-throw to allow component-level error handling
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            await AuthService.logout();
        } catch (error) {
            console.warn('Logout error:', error);
        } finally {
            dispatch({ type: 'LOGOUT' });
        }
    };

    // Clear error function
    const clearError = (): void => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // Context value
    const value: AuthContextType = {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        login,
        logout,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = {
        // TODO: SOLVE KEYCLOAK hardcode token til solve keycloak
        user: { username: "Admin", token: "token", refreshToken: "token", expiresAt: Date.now() + 3600 * 1000 },
        isAuthenticated: true, isLoading: false, login: (username: string, password: string) => Promise.resolve(),
        logout: () => { },
        clearError: () => { },
        error: ""
    };

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export const withAuth = <P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> => {
    const AuthenticatedComponent: React.FC<P> = (props) => {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return <div>Loading...</div>;
        }

        if (!isAuthenticated) {
            return <div>Please log in to access this content.</div>;
        }

        return <Component {...props} />;
    };

    AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

    return AuthenticatedComponent;
};

export { AuthContext };