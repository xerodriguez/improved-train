import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    public getAllProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            // Check for query parameters
            const categoryId = req.query.category ? parseInt(req.query.category as string, 10) : null;
            const supplierId = req.query.supplier ? parseInt(req.query.supplier as string, 10) : null;

            let result;

            if (categoryId && !isNaN(categoryId)) {
                result = await this.productService.getProductsByCategory(categoryId);
            } else if (supplierId && !isNaN(supplierId)) {
                result = await this.productService.getProductsBySupplier(supplierId);
            } else {
                result = await this.productService.getAllProducts();
            }

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Controller error in getAllProducts:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    public getProductById = async (req: Request, res: Response): Promise<void> => {
        try {
            const productId = parseInt(req.params.id, 10);

            if (isNaN(productId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid product ID format'
                });
                return;
            }

            const result = await this.productService.getProductById(productId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                const statusCode = result.error?.includes('not found') ? 404 : 400;
                res.status(statusCode).json(result);
            }
        } catch (error) {
            console.error('Controller error in getProductById:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    public getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
        try {
            const categoryId = parseInt(req.query.category as string, 10);

            if (isNaN(categoryId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid category ID format'
                });
                return;
            }

            const result = await this.productService.getProductsByCategory(categoryId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Controller error in getProductsByCategory:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    public getProductsBySupplier = async (req: Request, res: Response): Promise<void> => {
        try {
            const supplierId = parseInt(req.query.supplier as string, 10);

            if (isNaN(supplierId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid supplier ID format'
                });
                return;
            }

            const result = await this.productService.getProductsBySupplier(supplierId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Controller error in getProductsBySupplier:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
}