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

export interface ProductFilters {
    search?: string;
    status?: 'active' | 'draft' | 'all';
    stockFilter?: 'all' | 'in-stock' | 'out-of-stock';
    blipsFilter?: 'all' | '0' | '1' | '4+';
    minPrice?: number;
    maxPrice?: number;
    startDate?: string | null;
    endDate?: string | null;
}

export interface ProductTableProps {
    products: ProductApiModel[];
    loading: boolean;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalProducts: number;
    };
    onFiltersChange: (filters: ProductFilters) => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    selectedRowKeys?: string[];
    onSelectionChange?: (selectedKeys: string[]) => void;
}