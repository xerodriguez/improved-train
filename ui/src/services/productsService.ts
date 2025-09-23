import axios, { AxiosResponse } from 'axios';
import { Product } from '../types';
import { AuthService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/api/products`;

export class ProductsService {
    static async getProducts(): Promise<Product[]> {
        try {
            const authHeaders = AuthService.getAuthorizationHeader();

            // if (!('Authorization' in authHeaders)) {
            //     throw new Error('Authentication required to access products');
            // }

            const response: AxiosResponse<any> = await axios.get(
                PRODUCTS_ENDPOINT,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    timeout: 15000, // 15 second timeout for data fetching
                }
            );

            // Validate response data
            if (!Array.isArray(response.data.data)) {
                throw new Error('Invalid response format from products service');
            }

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    // Token might be expired, try to refresh
                    const refreshedUser = await AuthService.refreshToken();
                    if (refreshedUser) {
                        // Retry the request with new token
                        return this.getProducts();
                    }
                    throw new Error('Authentication expired. Please login again.');
                } else if (error.response?.status === 403) {
                    throw new Error('You do not have permission to access products');
                } else if (error.response?.status === 404) {
                    throw new Error('Products service not found');
                } else if (error.response && error.response.status >= 500) {
                    throw new Error('Products service is temporarily unavailable');
                } else if (error.response?.status === 502) {
                    throw new Error('Products service is currently unreachable');
                } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
                    throw new Error('Unable to connect to products service');
                } else if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timeout - products service is taking too long to respond');
                } else {
                    throw new Error(
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        'Failed to fetch products'
                    );
                }
            }
            throw new Error('An unexpected error occurred while fetching products');
        }
    }

    static async getProductById(productId: number): Promise<Product> {
        try {
            const authHeaders = AuthService.getAuthorizationHeader();

            // if (!('Authorization' in authHeaders)) {
            //     throw new Error('Authentication required to access product details');
            // }

            const response: AxiosResponse<Product> = await axios.get(
                `${PRODUCTS_ENDPOINT}/${productId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    timeout: 10000,
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    const refreshedUser = await AuthService.refreshToken();
                    if (refreshedUser) {
                        return this.getProductById(productId);
                    }
                    throw new Error('Authentication expired. Please login again.');
                } else if (error.response?.status === 404) {
                    throw new Error(`Product with ID ${productId} not found`);
                } else if (error.response && error.response.status >= 500) {
                    throw new Error('Products service is temporarily unavailable');
                } else {
                    throw new Error(
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        'Failed to fetch product details'
                    );
                }
            }
            throw new Error('An unexpected error occurred while fetching product details');
        }
    }

    /**
     * Check if products service is available
     */
    static async healthCheck(): Promise<boolean> {
        try {
            await axios.get(`${API_BASE_URL}/health`, {
                timeout: 5000,
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Format product data for display
     */
    static formatProductForDisplay(product: Product): Product {
        return {
            ...product,
            unit_price: product.unit_price ? Number(product.unit_price.toFixed(2)) : null,
            discontinued: product.discontinued === 1,
        } as any; // Type assertion needed for discontinued boolean conversion
    }

    /**
     * Format multiple products for display
     */
    static formatProductsForDisplay(products: Product[]): Product[] {
        return products.map(product => this.formatProductForDisplay(product));
    }
}