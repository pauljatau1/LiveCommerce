import axios, { AxiosResponse } from 'axios';
import { BASE_URL } from '@/Constants/Server';
import { ProductsSearchParams, ProductsSearchResponse } from '@/types';

async function searchSellerProducts(
    sellerId: string,
    params: ProductsSearchParams
): Promise<ProductsSearchResponse> {
    const response: AxiosResponse<ProductsSearchResponse> = await axios.get(
        `${BASE_URL}/products/seller/${sellerId}/search`,
        { params: {
            query: params.query,
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            sortBy: params.sortBy,
            order: params.order,
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
            category: params.category,
            status: params.status
        } }
    );
    return response.data;
}

export const productService = {
    searchSellerProducts,
};

export default productService;


