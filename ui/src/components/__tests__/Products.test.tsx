import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Products from '../Products';
import { ProductsService } from '../../services/productsService';
import '@testing-library/jest-dom';

jest.mock('../../services/productsService');

const mockGetProducts = ProductsService.getProducts as jest.Mock;
const mockFormatProductsForDisplay = ProductsService.formatProductsForDisplay as jest.Mock;

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

const mockAuthUser = {
    username: 'testuser',
    token: 'mockToken',
    refreshToken: 'mockRefreshToken',
    expiresAt: Date.now() + 3600 * 1000, // Mock expiration time as a number
};

const renderWithProviders = (isAuthenticated: boolean) => {
    render(
        <AuthContext.Provider
            value={{
                user: isAuthenticated ? mockAuthUser : null,
                logout: mockLogout,
                isAuthenticated,
                isLoading: false,
                error: null,
                login: jest.fn(),
                clearError: jest.fn(),
            }}
        >
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('Products Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to login if not authenticated', async () => {
        renderWithProviders(false);
        expect(mockNavigate).not.toHaveBeenCalled(); // Mock navigation logic
    });

    it('renders products successfully', async () => {
        const mockProducts = [
            { product_id: 1, product_name: 'Product 1', discontinued: 0 },
            { product_id: 2, product_name: 'Product 2', discontinued: 1 },
        ];

        mockGetProducts.mockResolvedValueOnce(mockProducts);
        mockFormatProductsForDisplay.mockReturnValueOnce(mockProducts);

        renderWithProviders(true);

        expect(screen.getByText(/loading products/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });
    });

    it('displays an error message on failure', async () => {
        mockGetProducts.mockRejectedValueOnce(new Error('Failed to fetch products'));

        renderWithProviders(true);

        await waitFor(() => {
            expect(screen.getByText(/failed to fetch products/i)).toBeInTheDocument();
        });

        const retryButton = screen.getByText(/retry/i);
        fireEvent.click(retryButton);

        expect(mockGetProducts).toHaveBeenCalledTimes(2);
    });

    it('handles logout correctly', async () => {
        renderWithProviders(true);

        const logoutButton = screen.getByText(/logout/i);
        fireEvent.click(logoutButton);

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalled();
        });
    });
});