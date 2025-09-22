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
}