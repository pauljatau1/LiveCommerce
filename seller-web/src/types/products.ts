export interface ProductImage {
    url: string;
    // Allow extra fields without losing type safety for known ones
    [key: string]: unknown;
}

export interface ProductApiModel {
    _id: string;
    name: string;
    category: string;
    images: ProductImage[];
    sku: string;
    stock: number;
    price: number;
}

export interface ProductsSearchResponse {
    success: boolean;
    data: ProductApiModel[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalProducts: number;
        hasMore: boolean;
    };
}

export interface ProductsSearchParams {
    page?: number;
    limit?: number;
    query?: string;
    sortBy?: 'createdAt' | 'price' | 'name' | 'popularity' | 'rating';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    status?: string;
}