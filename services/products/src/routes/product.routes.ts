import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const productController = new ProductController();

// GET /api/v1/products - Get all products
router.get('/', productController.getAllProducts);

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', productController.getProductById);

// POST /api/v1/products - Create a new product
router.post('/', productController.createProduct);

// PUT /api/v1/products/:id - Update a product by ID
router.put('/:id', productController.updateProduct);

// DELETE /api/v1/products/:id - Delete a product by ID
router.delete('/:id', productController.deleteProduct);

// GET /api/v1/products?category=:categoryId - Get products by category
// GET /api/v1/products?supplier=:supplierId - Get products by supplier
// Note: These are handled within the getAllProducts method by checking query parameters

export default router;