import axios from 'axios';
import { BASE_URL, BASE_URL_V2 } from '@/Constants/Server';

const getAuthHeader = () => {
  const token = localStorage.getItem('sellerToken');
  const { data: authToken } = JSON.parse(token);
  return { Authorization: `Bearer ${authToken}` };
};

export const settingsService = {
  // Store Profile
  updateStoreProfile: async (data) => {
    const response = await axios.put(
      `${BASE_URL}/seller/store-profile`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Warehouse Details
  updateWarehouseDetails: async (data) => {
    const response = await axios.put(
      `${BASE_URL}/seller/warehouse-details`,
      { warehouseDetails: data },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Business Address
  updateBusinessAddress: async (data) => {
    const response = await axios.put(
      `${BASE_URL}/seller/business-address`,
      { businessAddress: data },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Notification Preferences
  updateNotificationPreferences: async (data) => {
    const response = await axios.put(
      `${BASE_URL}/seller/notification-preferences`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Upload Store Avatar
  uploadStoreAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await axios.post(
      `${BASE_URL_V2}/sellers/profile/avatar`,
      formData,
      { 
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.data;
  },

  // Get seller statistics
  getStatistics: async () => {
    const response = await axios.get(
      `${BASE_URL_V2}/sellers/statistics`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  // Update business details
  updateBusinessDetails: async (data) => {
    const response = await axios.put(
      `${BASE_URL}/seller/business-details`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Update individual information
  updateIndividualInformation: async (data) => {
    const response = await axios.put(
      `${BASE_URL}/seller/individual-information`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get followers
  getFollowers: async (page = 1, limit = 10) => {
    const response = await axios.get(
      `${BASE_URL}/seller/followers?page=${page}&limit=${limit}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Password Management
  forgotPassword: async (email) => {
    const response = await axios.post(
      `${BASE_URL}/seller/forgot-password`,
      { email }
    );
    return response.data;
  },

  resetPassword: async (email, token, newPassword) => {
    const response = await axios.post(
      `${BASE_URL}/seller/reset-password`,
      { email, token, newPassword }
    );
    return response.data;
  }
}; 