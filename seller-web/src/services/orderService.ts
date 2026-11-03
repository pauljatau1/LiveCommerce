import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";
import type {
  SellerOrders,
  Order,
} from "@/types";

const ORDERS_ENDPOINTS = {
    fetchSellerOrders: "/sellers/orders"
}

export const orderService = {
  /**
   * Fetch seller orders
   *
   * @returns Promise<OrdersData> - Seller orders data
   */
  async fetchSellerOrders(): Promise<Order[]> {
    const url = ORDERS_ENDPOINTS.fetchSellerOrders;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<SellerOrders>(url, config);
    console.log("seller orders service", response.data);
    return response.data.data.orders as Order[];
  },

  /**
   * Fetch paginated seller orders
   *
   * @param page - Page number (default: 1)
   * @param limit - Number of orders per page (default: 10)
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Promise<SellerOrders> - Paginated seller orders data
   */
  async fetchPaginatedOrders(
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<SellerOrders> {
    const url = ORDERS_ENDPOINTS.fetchSellerOrders;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
      params,
    };
    
    const response = await apiService.get<SellerOrders>(url, config);
    console.log("paginated seller orders service", response.data);
    return response.data;
  },
};
