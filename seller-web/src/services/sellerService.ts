import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";
import type {
  Seller,
  SellerResponse,
  SellerAnalytics,
  TopSoldProducts,
  SellerNotifications,
  Notification,
  AnalyticsData,
  SellerConversations,
  SellerConversationsResponse,
} from "@/types";

const SELLER_ENDPOINTS = {
  fetchSellerDetails: "/sellers/profile",
  topSoldProducts: "/seller/top-sold-products",
  notifications: "/notifications",
  analytics: "/sellers/statistics",
  fetchSellerConversations: "/conversations",
};

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
    const response = await apiService.get<SellerResponse>(url, config);
    console.log("seller details service", response.data);
    return response.data.data as Seller;
  },

  /**
   * Fetch top sold products
   *
   * @returns Promise<TopSoldProducts> - Top sold products
   */
  async fetchTopSoldProducts(): Promise<TopSoldProducts> {
    const url = SELLER_ENDPOINTS.topSoldProducts;
    const response = await apiService.get<TopSoldProducts>(url);
    console.log("top sold products service", response.data);
    return response.data;
  },

  /**
   * Fetch seller notifications
   *
   * @returns Promise<SellerNotifications> - Seller notifications
   */
  async fetchSellerNotifications(): Promise<Notification[]> {
    const url = SELLER_ENDPOINTS.notifications;
    const response = await apiService.get<SellerNotifications>(url);
    console.log("seller notifications service", response.data);
    return response.data.notifications as Notification[];
  },

  /**
   * Fetch seller analytics
   *
   * @returns Promise<SellerAnalytics> - Seller analytics
   */
  async fetchSellerAnalytics(): Promise<AnalyticsData> {
    const url = SELLER_ENDPOINTS.analytics;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<SellerAnalytics>(url, config);
    console.log("seller analytics service", response.data);
    return response.data.data as AnalyticsData;
  },

  /**
   * Fetch seller conversations
   * 
   * @returns Promise<SellerConversations[]> - Seller conversations
   */
  async fetchSellerConversations(): Promise<SellerConversations[]> {
    const url = SELLER_ENDPOINTS.fetchSellerConversations;
    const response = await apiService.get<SellerConversationsResponse>(url);
    console.log("seller conversations service", response.data);
    return response.data.data.conversations as SellerConversations[];
  },
};
