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
};
