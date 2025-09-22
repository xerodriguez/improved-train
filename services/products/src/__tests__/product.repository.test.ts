import { ProductRepository } from '../repositories/product.repository';
import database from '../database/connection';
import { Product } from '../types/product.types';

// Mock the database module
jest.mock('../database/connection');

const mockDatabase = database as jest.Mocked<typeof database>;

describe('ProductRepository', () => {
    let productRepository: ProductRepository;

    const mockProducts: Product[] = [
        {
            product_id: 1,
            product_name: 'Test Product 1',
            supplier_id: 1,
            category_id: 1,
            quantity_per_unit: '10 boxes x 20 bags',
            unit_price: 18.0,
            units_in_stock: 39,
            units_on_order: 0,
            reorder_level: 10,
            discontinued: 0
        },
        {
            product_id: 2,
            product_name: 'Test Product 2',
            supplier_id: 1,
            category_id: 2,
            quantity_per_unit: '24 - 12 oz bottles',
            unit_price: 19.0,
            units_in_stock: 17,
            units_on_order: 40,
            reorder_level: 25,
            discontinued: 0
        }
    ];

    beforeEach(() => {
        productRepository = new ProductRepository();
        jest.clearAllMocks();
    });

    describe('getAllProducts', () => {
        it('should return all products when query is successful', async () => {
            mockDatabase.query.mockResolvedValueOnce({ rows: mockProducts });

            const result = await productRepository.getAllProducts();

            expect(result).toEqual(mockProducts);
            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT')
            );
        });

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDatabase.query.mockRejectedValueOnce(dbError);

            await expect(productRepository.getAllProducts()).rejects.toThrow(
                'Failed to fetch products from database'
            );
        });
    });

    describe('getProductById', () => {
        it('should return product when found', async () => {
            mockDatabase.query.mockResolvedValueOnce({ rows: [mockProducts[0]] });

            const result = await productRepository.getProductById(1);

            expect(result).toEqual(mockProducts[0]);
            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE product_id = $1'),
                [1]
            );
        });

        it('should return null when product not found', async () => {
            mockDatabase.query.mockResolvedValueOnce({ rows: [] });

            const result = await productRepository.getProductById(999);

            expect(result).toBeNull();
        });

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDatabase.query.mockRejectedValueOnce(dbError);

            await expect(productRepository.getProductById(1)).rejects.toThrow(
                'Failed to fetch product from database'
            );
        });
    });

    describe('getProductsByCategory', () => {
        it('should return products for valid category', async () => {
            const categoryProducts = [mockProducts[0]];
            mockDatabase.query.mockResolvedValueOnce({ rows: categoryProducts });

            const result = await productRepository.getProductsByCategory(1);

            expect(result).toEqual(categoryProducts);
            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE category_id = $1'),
                [1]
            );
        });

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDatabase.query.mockRejectedValueOnce(dbError);

            await expect(productRepository.getProductsByCategory(1)).rejects.toThrow(
                'Failed to fetch products by category from database'
            );
        });
    });

    describe('getProductsBySupplier', () => {
        it('should return products for valid supplier', async () => {
            mockDatabase.query.mockResolvedValueOnce({ rows: mockProducts });

            const result = await productRepository.getProductsBySupplier(1);

            expect(result).toEqual(mockProducts);
            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE supplier_id = $1'),
                [1]
            );
        });

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection failed');
            mockDatabase.query.mockRejectedValueOnce(dbError);

            await expect(productRepository.getProductsBySupplier(1)).rejects.toThrow(
                'Failed to fetch products by supplier from database'
            );
        });
    });
});