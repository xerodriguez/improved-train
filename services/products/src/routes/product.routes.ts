import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const productController = new ProductController();

// GET /api/v1/products - Get all products
router.get('/', productController.getAllProducts);

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', productController.getProductById);

// GET /api/v1/products?category=:categoryId - Get products by category
// GET /api/v1/products?supplier=:supplierId - Get products by supplier
// Note: These are handled within the getAllProducts method by checking query parameters

export default router;