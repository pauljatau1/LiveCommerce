export interface ProductImage {
    url: string;
    _id?: string;
    id?: string;
    resizedImages?: Array<{
        width: number;
        url: string;
        _id?: string;
        id?: string;
        key?: string;
        location?: string;
    }>;
    originalUrl?: string;
    // Allow extra fields without losing type safety for known ones
    [key: string]: unknown;
}

export interface ProductStats {
    views?: number;
    soldCount?: number;
    lastViewed?: string;
    lastRestocked?: string;
    averageRating?: number;
    totalReviews?: number;
}

export interface ProductInventory {
    quantity: number;
    lowStockThreshold: number;
    sku: string;
}

export interface ProductDiscount {
    isActive: boolean;
    type: 'percentage' | 'fixed';
    value: number;
    startDate?: string | null;
    endDate?: string | null;
    couponName?: string | null;
    discountedPrice?: number | null;
}

export interface ProductPricing {
    taxable: boolean;
    taxRate: number;
}

export interface ProductBlip {
    url: string;
    contentType: string;
    thumbnail?: string;
    key?: string;
    likes?: string[];
    likesCount?: number;
    viewCount?: number;
    commentsCount?: number;
    processed?: boolean;
    createdAt?: string;
    _id?: string;
    blipLink?: string;
    viewedBy?: Array<{
        user: string;
        userType: string;
        lastViewed: string;
        _id?: string;
    }>;
    comments?: Array<{
        buyer: string;
        comment: string;
        likesCount?: number;
        repliesCount?: number;
        _id?: string;
        createdAt?: string;
        likes?: string[];
        replies?: unknown[];
    }>;
}

export interface ProductApiModel {
    _id: string;
    id?: string;
    name: string;
    description?: string;
    category: string;
    brand?: string;
    images: ProductImage[];
    sku: string;
    stock: number;
    price: number;
    discountedPrice?: number;
    condition?: 'new' | 'fairly-used' | 'refurbished';
    status: 'active' | 'draft' | 'inactive';
    variants?: unknown[];
    blips?: ProductBlip[];
    createdAt?: string;
    updatedAt?: string;
    isLowStock?: boolean;
    hasDiscount?: boolean;
    productLink?: string;
    blipLink?: string | null;
    discount?: ProductDiscount;
    stats?: ProductStats;
    inventory?: ProductInventory;
    pricing?: ProductPricing;
    productInfo?: {
        stock: number;
        sku: string;
        lowStockThreshold: number;
        isOutOfStock: boolean;
        variantsInfo?: unknown[];
    };
    seller?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        storeName?: string;
        [key: string]: unknown;
    };
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
    search?: string;
    sortBy?: 'createdAt' | 'price' | 'name' | 'popularity' | 'rating' | 'newest' | 'oldest' | 'price_desc' | 'price_asc';
    order?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
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