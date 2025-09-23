import { Product } from '../types/product.types';
import database from '../database/connection';

export class ProductRepository {
    async getAllProducts(): Promise<Product[]> {
        try {
            const query = `
        SELECT 
          product_id,
          product_name,
          supplier_id,
          category_id,
          quantity_per_unit,
          unit_price,
          units_in_stock,
          units_on_order,
          reorder_level,
          discontinued
        FROM products 
        ORDER BY product_id
      `;

            const result = await database.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw new Error('Failed to fetch products from database');
        }
    }

    async getProductById(productId: number): Promise<Product | null> {
        try {
            const query = `
        SELECT 
          product_id,
          product_name,
          supplier_id,
          category_id,
          quantity_per_unit,
          unit_price,
          units_in_stock,
          units_on_order,
          reorder_level,
          discontinued
        FROM products 
        WHERE product_id = $1
      `;

            const result = await database.query(query, [productId]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Error fetching product by ID:', error);
            throw new Error('Failed to fetch product from database');
        }
    }

    async getProductsByCategory(categoryId: number): Promise<Product[]> {
        try {
            const query = `
        SELECT 
          product_id,
          product_name,
          supplier_id,
          category_id,
          quantity_per_unit,
          unit_price,
          units_in_stock,
          units_on_order,
          reorder_level,
          discontinued
        FROM products 
        WHERE category_id = $1
        ORDER BY product_name
      `;

            const result = await database.query(query, [categoryId]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw new Error('Failed to fetch products by category from database');
        }
    }

    async getProductsBySupplier(supplierId: number): Promise<Product[]> {
        try {
            const query = `
        SELECT 
          product_id,
          product_name,
          supplier_id,
          category_id,
          quantity_per_unit,
          unit_price,
          units_in_stock,
          units_on_order,
          reorder_level,
          discontinued
        FROM products 
        WHERE supplier_id = $1
        ORDER BY product_name
      `;

            const result = await database.query(query, [supplierId]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching products by supplier:', error);
            throw new Error('Failed to fetch products by supplier from database');
        }
    }

    async createProduct(product: Product): Promise<Product> {
        try {
            const query = `
                INSERT INTO products (
                    product_name, supplier_id, category_id, quantity_per_unit, unit_price, units_in_stock, units_on_order, reorder_level, discontinued
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
            `;
            const values = [
                product.product_name,
                product.supplier_id,
                product.category_id,
                product.quantity_per_unit,
                product.unit_price,
                product.units_in_stock,
                product.units_on_order,
                product.reorder_level,
                product.discontinued
            ];
            const result = await database.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating product:', error);
            throw new Error('Failed to create product');
        }
    }

    async updateProduct(productId: number, product: Partial<Product>): Promise<Product | null> {
        try {
            const query = `
                UPDATE products
                SET 
                    product_name = COALESCE($1, product_name),
                    supplier_id = COALESCE($2, supplier_id),
                    category_id = COALESCE($3, category_id),
                    quantity_per_unit = COALESCE($4, quantity_per_unit),
                    unit_price = COALESCE($5, unit_price),
                    units_in_stock = COALESCE($6, units_in_stock),
                    units_on_order = COALESCE($7, units_on_order),
                    reorder_level = COALESCE($8, reorder_level),
                    discontinued = COALESCE($9, discontinued)
                WHERE product_id = $10
                RETURNING *;
            `;
            const values = [
                product.product_name,
                product.supplier_id,
                product.category_id,
                product.quantity_per_unit,
                product.unit_price,
                product.units_in_stock,
                product.units_on_order,
                product.reorder_level,
                product.discontinued,
                productId
            ];
            const result = await database.query(query, values);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    }

    async deleteProduct(productId: number): Promise<boolean> {
        try {
            const query = `
                DELETE FROM products
                WHERE product_id = $1
            `;
            const result = await database.query(query, [productId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw new Error('Failed to delete product');
        }
    }
}