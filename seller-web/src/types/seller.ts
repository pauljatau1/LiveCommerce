// Seller user interface based on the API response structure

export interface SellerResponse {
  success: boolean;
  message: string;
  data: Seller;
  pagination: null;
}

export interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  storeName: string;
  businessName: string;
  accountType: "individual" | "business";
  emailVerified: boolean;
  isVerified: boolean;
  isDisabled: boolean;
  hasFilledAddress: boolean;
  hasFilledBusinessAddress: boolean;
  createdAt: string;
  walletBalance: number;
  bankDetails?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    accountCurrency: string;
  };
  businessAddress?: {
    country: string;
    city: string;
    state: string;
    addressLine1: string;
  };
  sellerAddress?: {
    country: string;
    city: string;
    state: string;
    addressLine1: string;
  };
  referralUsed: boolean;
  referrerId: string;
  storeAvatar: {
    public_id: string;
    url: string;
  };
}

// Top sold seller products interface
export interface TopSoldProducts {
  _id: string;
  name: string;
  images: [
    {
      url: string;
    }
  ];
  price: number;
  stats: {
    soldCount: number;
  };
}

// Notification data interfaces for different notification types
export interface BlipCommentData {
  blipId: string;
  buyerId: string;
  buyerName: string;
  comment: string;
  productId: string;
  productName: string;
}

export interface BuyerMessageData {
  // Add specific fields for buyer message data when available
  [key: string]: any;
}

// Individual notification interface
export interface Notification {
  _id: string;
  seller: string;
  recipient: string;
  type: "buyer_message" | "blip_comment";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data: BlipCommentData | BuyerMessageData;
  __v: number;
}

// Seller notifications response interface (paginated)
export interface SellerNotifications {
  notifications: Notification[];
  currentPage: number;
  totalPages: number;
  totalNotifications: number;
}

// Analytics data interfaces for different metrics
export interface WalletBalance {
  amount: number;
  currency: string;
  change: {
    value: number;
    type: string;
  };
}

export interface StoreVisits {
  count: number;
  change: {
    value: number;
    type: string;
  };
}

export interface TotalOrders {
  count: number;
  change: {
    value: number;
    type: string;
  };
}

export interface ConversionRate {
  percentage: number;
  change: {
    value: number;
    type: string;
  };
}

export interface NewCustomers {
  count: number;
  change: {
    value: number;
    type: string;
  };
}

// Analytics data object containing all metrics
export interface AnalyticsData {
  walletBalance: WalletBalance;
  storeVisits: StoreVisits;
  totalOrders: TotalOrders;
  conversionRate: ConversionRate;
  newCustomers: NewCustomers;
}

// Seller analytics API response interface
export interface SellerAnalytics {
  success: boolean;
  message: string;
  data: AnalyticsData;
  pagination: null;
}

// Seller conversations API response interface
export interface SellerConversations {
  _id: string;
  participant: {
    id: string;
    model: string;
    name: string;
    avatar: string | null;
    location: { country: string; city: string | null };
    verified: boolean;
    isOnline: boolean;
    lastActive: string;
  };
  lastMessage: {
    sender: { id: string; model: string };
    content: string;
    messageType: string;
    createdAt: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  settings: {
    isBlocked: boolean;
    isMuted: boolean;
    blockedBy: string | null;
    mutedBy: string | null;
  };
}

export interface SellerConversationsResponse {
  success: boolean;
  message: string;
  data: {
    conversations: SellerConversations[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalConversations: number;
      hasMore: boolean;
    };
  };
}
