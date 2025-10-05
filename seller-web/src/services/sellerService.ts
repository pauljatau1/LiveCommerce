import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";
import type {
  Seller,
  TopSoldProducts,
  SellerNotifications,
} from "@/types";

const SELLER_ENDPOINTS = {
    fetchSellerDetails: "/sellers/profile",
    topSoldProducts: "/sellers/top-sold-products",
    notifications: "/notifications",
}

export const sellerService = {
    /**
     * Fetch seller details
     * 
     * @returns Promise<Seller> - Seller details
     */

    async fetchSellerDetails(): Promise<Seller> {
        const url = SELLER_ENDPOINTS.fetchSellerDetails;
        // use v2 base url for this fetch seller details endpoint
        const config = {
            baseURL: API_CONFIG.BASE_URL_V2,
        };
        const response = await apiService.get<Seller>(url, config);
        return response.data;
    },

    /**
     * Fetch top sold products
     * 
     * @returns Promise<TopSoldProducts> - Top sold products
     */
    async fetchTopSoldProducts(): Promise<TopSoldProducts> {
        const url = SELLER_ENDPOINTS.topSoldProducts;
        const response = await apiService.get<TopSoldProducts>(url);
        return response.data;
    },

    /**
     * Fetch seller notifications
     * 
     * @returns Promise<SellerNotifications> - Seller notifications
     */
    async fetchSellerNotifications(): Promise<SellerNotifications> {
        const url = SELLER_ENDPOINTS.notifications;
        const response = await apiService.get<SellerNotifications>(url);
        return response.data;
    },

}