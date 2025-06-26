import { api } from '@/api/axios';

// Define types for the update seller information
export interface BusinessAddress {
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  zipCode: string;
}

export interface BankDetails {
  bankCountry: string;
  bankName: string;
  bankAccountType: string;
  accountCurrency: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string;
  bankIdentifierCode?: string;
}

export interface WarehouseDetails {
  name: string;
  contactNumber: string;
  address: BusinessAddress;
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OperatingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface StorePolicy {
  deliveryTimes?: string;
  freeShippingPolicy?: string;
  processingTime?: string;
  refundMethod?: string;
  nonRefundableItems?: string[];
  returnWindow?: number;
  returnShipping?: string;
  exchangePolicy?: string;
  allowsCod?: boolean;
}

export interface UpdateSellerData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  
  // Business Information
  businessName?: string;
  businessType?: string;
  businessEmail?: string;
  businessNumber?: string;
  taxInformation?: string;
  accountType?: string;
  
  // Addresses
  businessAddress?: BusinessAddress;
  sellerAddress?: BusinessAddress;
  warehouseDetails?: WarehouseDetails;
  
  // Bank Details
  bankDetails?: BankDetails;
  
  // Store Details
  storeName?: string;
  aboutStore?: string;
  socialMedia?: SocialMedia;
  
  // Store Settings
  operatingHours?: OperatingHours;
  timezone?: string;
  storePolicy?: StorePolicy;
  offersStorePickup?: boolean;
  
  // Status Flags
  isVerified?: boolean;
  isFeatured?: boolean;
  isDisabled?: boolean;
  isInternational?: boolean;
  accountPending?: boolean;
}

export interface SellerProductsParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  search?: string;
}

export const SellerService = {
  // Verify a seller's business account
  verifySeller: async (sellerId: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/verify`);
  },
  
  // Revoke a seller's verification status
  revokeVerification: async (sellerId: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/revoke-verification`);
  },
  
  // Disable a seller
  disableSeller: async (sellerId: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/disable`);
  },
  
  // Enable a seller
  enableSeller: async (sellerId: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/enable`);
  },
  
  // Mark a seller as featured
  toggleFeature: async (sellerId: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/feature`);
  },
  
  // Toggle a seller's international status
  toggleInternational: async (sellerId: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/international`);
  },
  
  // Reject a seller's verification
  rejectVerification: async (sellerId: string, data: { reason: string, details?: string }) => {
    return await api.put(`/api/admin/sellers/${sellerId}/reject`, data);
  },
  
  // Get seller data by ID
  getSellerById: async (sellerId: string) => {
    return await api.get(`/api/admin/sellers/${sellerId}`);
  },
  
  // Update seller information
  updateSellerInfo: async (sellerId: string, data: UpdateSellerData) => {
    return await api.put(`/api/admin/sellers/${sellerId}/update`, data);
  },
  
  // Get seller's products
  getSellerProducts: async (sellerId: string, params?: SellerProductsParams) => {
    return await api.get(`/api/admin/sellers/${sellerId}/products`, { params });
  },
  
  // Delete a product
  deleteProduct: async (productId: string, data?: { reason: string }) => {
    return await api.delete(`/api/admin/products/${productId}`, { data });
  },
  
  // Disable a product
  disableProduct: async (productId: string, data?: { reason: string }) => {
    return await api.put(`/api/admin/products/${productId}/disable`, data);
  },
  
  // Add funds to seller wallet
  addToSellerWallet: async (sellerId: string, data: { amount: number, reason: string }) => {
    return await api.post(`/api/admin/sellers/${sellerId}/wallet/add`, data);
  },
  
  // Deduct funds from seller wallet
  deductFromSellerWallet: async (sellerId: string, data: { amount: number, reason: string }) => {
    return await api.post(`/api/admin/sellers/${sellerId}/wallet/deduct`, data);
  },
  
  // Bulk update product condition for all seller products
  bulkUpdateProductCondition: async (sellerId: string, condition: string) => {
    return await api.put(`/api/admin/sellers/${sellerId}/products/bulk-update-condition`, { condition });
  }
}; 