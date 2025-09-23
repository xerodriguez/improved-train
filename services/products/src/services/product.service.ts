import { Product, ApiResponse } from '../types/product.types';
import { ProductRepository } from '../repositories/product.repository';

export class ProductService {
    private productRepository: ProductRepository;

    constructor() {
        this.productRepository = new ProductRepository();
    }

    async getAllProducts(): Promise<ApiResponse<Product[]>> {
        try {
            const products = await this.productRepository.getAllProducts();
            return {
                success: true,
                data: products,
                message: `Retrieved ${products.length} products successfully`
            };
        } catch (error) {
            console.error('Service error in getAllProducts:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async getProductById(productId: number): Promise<ApiResponse<Product>> {
        try {
            if (!productId || productId <= 0) {
                return {
                    success: false,
                    error: 'Invalid product ID provided'
                };
            }

            const product = await this.productRepository.getProductById(productId);

            if (!product) {
                return {
                    success: false,
                    error: `Product with ID ${productId} not found`
                };
            }

            return {
                success: true,
                data: product,
                message: 'Product retrieved successfully'
            };
        } catch (error) {
            console.error('Service error in getProductById:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async getProductsByCategory(categoryId: number): Promise<ApiResponse<Product[]>> {
        try {
            if (!categoryId || categoryId <= 0) {
                return {
                    success: false,
                    error: 'Invalid category ID provided'
                };
            }

            const products = await this.productRepository.getProductsByCategory(categoryId);

            return {
                success: true,
                data: products,
                message: `Retrieved ${products.length} products for category ${categoryId}`
            };
        } catch (error) {
            console.error('Service error in getProductsByCategory:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async getProductsBySupplier(supplierId: number): Promise<ApiResponse<Product[]>> {
        try {
            if (!supplierId || supplierId <= 0) {
                return {
                    success: false,
                    error: 'Invalid supplier ID provided'
                };
            }

            const products = await this.productRepository.getProductsBySupplier(supplierId);

            return {
                success: true,
                data: products,
                message: `Retrieved ${products.length} products for supplier ${supplierId}`
            };
        } catch (error) {
            console.error('Service error in getProductsBySupplier:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async createProduct(product: Product): Promise<ApiResponse<Product>> {
        try {
            const newProduct = await this.productRepository.createProduct(product);
            return {
                success: true,
                data: newProduct,
                message: 'Product created successfully'
            };
        } catch (error) {
            console.error('Service error in createProduct:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async updateProduct(productId: number, product: Partial<Product>): Promise<ApiResponse<Product>> {
        try {
            const updatedProduct = await this.productRepository.updateProduct(productId, product);

            if (!updatedProduct) {
                return {
                    success: false,
                    error: `Product with ID ${productId} not found`
                };
            }

            return {
                success: true,
                data: updatedProduct,
                message: 'Product updated successfully'
            };
        } catch (error) {
            console.error('Service error in updateProduct:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async deleteProduct(productId: number): Promise<ApiResponse<null>> {
        try {
            const isDeleted = await this.productRepository.deleteProduct(productId);

            if (!isDeleted) {
                return {
                    success: false,
                    error: `Product with ID ${productId} not found`
                };
            }

            return {
                success: true,
                data: null,
                message: 'Product deleted successfully'
            };
        } catch (error) {
            console.error('Service error in deleteProduct:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}