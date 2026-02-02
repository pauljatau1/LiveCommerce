import { apiService } from "@/services/apiService";

const HEADER_ENDPOINTS = {
  markAllNotificationsRead: "/notifications/mark-all-read",
};

export const headerService = {
  /**
   * Mark all notifications as read
   *
   * @returns Promise<void>
   */
  async markAllNotificationsRead(): Promise<void> {
    const url = HEADER_ENDPOINTS.markAllNotificationsRead;
    await apiService.put<void>(url);
  },
};

