// Product types based on the Northwind database structure
export interface Product {
    product_id: number;
    product_name: string;
    supplier_id: number | null;
    category_id: number | null;
    quantity_per_unit: string | null;
    unit_price: number | null;
    units_in_stock: number | null;
    units_on_order: number | null;
    reorder_level: number | null;
    discontinued: number;
}

// Authentication types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface AuthUser {
    username: string;
    token: string;
    refreshToken: string;
    expiresAt: number;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
}

// Application state types
export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface ProductsState {
    products: Product[];
    isLoading: boolean;
    error: string | null;
}

// Context types
export interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

// Form validation types
export interface LoginFormData {
    username: string;
    password: string;
}

export interface ValidationErrors {
    username?: string;
    password?: string;
}