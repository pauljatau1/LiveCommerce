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
} from "@/types";
import type { conversations } from "@/types/seller";

const SELLER_ENDPOINTS = {
  fetchSellerDetails: "/sellers/profile",
  topSoldProducts: "/seller/top-sold-products",
  notifications: "/notifications",
  analytics: "/sellers/statistics",
  fetchSellerConversations: "/conversations",
  completeProfile: "/sellers/profile/complete",
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
   * Fetch seller notifications with pagination (for infinite query)
   *
   * @param params - Pagination parameters
   * @returns Promise<SellerNotifications> - Seller notifications with pagination
   */
  async fetchSellerNotificationsPaginated(params?: { page?: number; limit?: number }): Promise<SellerNotifications> {
    const url = SELLER_ENDPOINTS.notifications;
    const config = params ? { params } : undefined;
    const response = await apiService.get<SellerNotifications>(url, config);
    console.log("seller notifications paginated service", response.data);
    return response.data;
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
   * @returns Promise<conversations[]> - Seller conversations array
   */
  async fetchSellerConversations(): Promise<conversations[]> {
    const url = SELLER_ENDPOINTS.fetchSellerConversations;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiService.get<any>(url);
    console.log("seller conversations service", response);
    // Handle multiple possible response structures
    const responseData = response.data;
    const conversationsData = responseData?.data?.conversations || responseData?.conversations || [];
    return conversationsData as conversations[];
  },

  /**
   * Complete seller profile (phone number and store name)
   *
   * @param payload - Object containing phoneNumber and storeName
   * @returns Promise<{ success: boolean; message: string; data: { message: string; seller: Seller } }>
   */
  async completeSellerProfile(payload: { phoneNumber: string; storeName: string }): Promise<{ success: boolean; message: string; data: { message: string; seller: Seller } }> {
    const url = SELLER_ENDPOINTS.completeProfile;
    // use v2 base url for this endpoint
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.put<{ success: boolean; message: string; data: { message: string; seller: Seller } }>(
      url,
      payload as unknown as Record<string, unknown>,
      config
    );
    // Ensure we return the full standard API response shape
    return (response as unknown) as { success: boolean; message: string; data: { message: string; seller: Seller } };
  },
};
