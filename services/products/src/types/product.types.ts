export interface Product {
    product_id: number;
    product_name: string;
    supplier_id: number | null;
    category_id: number | null;
    quantity_per_unit: string | null;
    unit_price: number | null;
    units_in_stock: number | null;
    units_on_order: number | null;
    reorder_level: number | null;
    discontinued: number;
}

export interface CreateProductRequest {
    product_name: string;
    supplier_id?: number;
    category_id?: number;
    quantity_per_unit?: string;
    unit_price?: number;
    units_in_stock?: number;
    units_on_order?: number;
    reorder_level?: number;
    discontinued: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
    product_id: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}