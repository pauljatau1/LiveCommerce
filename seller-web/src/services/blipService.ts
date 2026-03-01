import type { AxiosProgressEvent } from "axios";
import { apiService } from "@/services/apiService";
import type { ProductApiModel } from "@/types/products";

const BLIP_ENDPOINTS = {
  uploadProductBlipsRoute: (productId: string) => `/products/${productId}/blips`,
  sellerProducts: (sellerId: string) => `/products/seller/${sellerId}`,
  productDetails: (productId: string) => `/products/${productId}`,
};

async function uploadProductBlips(params: {
  productId: string;
  blipVideos: File[];
  onUploadProgress?: (event: AxiosProgressEvent) => void;
}): Promise<unknown> {
  const formData = new FormData();
  params.blipVideos.forEach((file) => {
    formData.append("blipVideos", file);
  });

  return apiService.post(
    BLIP_ENDPOINTS.uploadProductBlipsRoute(params.productId),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: params.onUploadProgress,
    }
  );
}

async function fetchSellerProducts(params: {
  sellerId: string;
  page: number;
  limit: number;
  status?: string;
}): Promise<{ products: ProductApiModel[]; totalPages: number; currentPage: number }> {
  const response = await apiService.get<{ products: ProductApiModel[]; totalPages: number; currentPage: number }>(
    BLIP_ENDPOINTS.sellerProducts(params.sellerId),
    {
      params: {
        status: params.status || "active",
        page: params.page,
        limit: params.limit,
      },
    }
  );
  return response.data;
}

async function fetchProductBlipsCount(productId: string): Promise<number> {
  try {
    const response = await apiService.get<ProductApiModel>(BLIP_ENDPOINTS.productDetails(productId));
    const data = response.data;
    const blips = Array.isArray(data?.blips) ? data.blips : [];
    return blips.length;
  } catch {
    return 0;
  }
}

export const blipService = {
  uploadProductBlips,
  fetchSellerProducts,
  fetchProductBlipsCount,
};

export default blipService;
