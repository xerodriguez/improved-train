import { ProductService } from '../services/product.service';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../types/product.types';

// Mock the ProductRepository
jest.mock('../repositories/product.repository');

const MockedProductRepository = ProductRepository as jest.MockedClass<typeof ProductRepository>;

describe('ProductService', () => {
    let productService: ProductService;
    let mockProductRepository: jest.Mocked<ProductRepository>;

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
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockProductRepository = new MockedProductRepository() as jest.Mocked<ProductRepository>;
        productService = new ProductService();
        // Replace the repository instance
        (productService as any).productRepository = mockProductRepository;
    });

    describe('getAllProducts', () => {
        it('should return success response with products', async () => {
            mockProductRepository.getAllProducts.mockResolvedValueOnce(mockProducts);

            const result = await productService.getAllProducts();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProducts);
            expect(result.message).toContain('Retrieved 1 products successfully');
        });

        it('should return error response when repository throws error', async () => {
            const error = new Error('Database error');
            mockProductRepository.getAllProducts.mockRejectedValueOnce(error);

            const result = await productService.getAllProducts();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Database error');
        });
    });

    describe('getProductById', () => {
        it('should return success response when product found', async () => {
            mockProductRepository.getProductById.mockResolvedValueOnce(mockProducts[0]);

            const result = await productService.getProductById(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProducts[0]);
            expect(result.message).toBe('Product retrieved successfully');
        });

        it('should return error response when product not found', async () => {
            mockProductRepository.getProductById.mockResolvedValueOnce(null);

            const result = await productService.getProductById(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Product with ID 999 not found');
        });

        it('should return error response for invalid product ID', async () => {
            const result = await productService.getProductById(0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid product ID provided');
        });

        it('should return error response when repository throws error', async () => {
            const error = new Error('Database error');
            mockProductRepository.getProductById.mockRejectedValueOnce(error);

            const result = await productService.getProductById(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Database error');
        });
    });

    describe('getProductsByCategory', () => {
        it('should return success response with products for valid category', async () => {
            mockProductRepository.getProductsByCategory.mockResolvedValueOnce(mockProducts);

            const result = await productService.getProductsByCategory(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProducts);
            expect(result.message).toContain('Retrieved 1 products for category 1');
        });

        it('should return error response for invalid category ID', async () => {
            const result = await productService.getProductsByCategory(0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid category ID provided');
        });
    });

    describe('getProductsBySupplier', () => {
        it('should return success response with products for valid supplier', async () => {
            mockProductRepository.getProductsBySupplier.mockResolvedValueOnce(mockProducts);

            const result = await productService.getProductsBySupplier(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProducts);
            expect(result.message).toContain('Retrieved 1 products for supplier 1');
        });

        it('should return error response for invalid supplier ID', async () => {
            const result = await productService.getProductsBySupplier(0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid supplier ID provided');
        });
    });
});