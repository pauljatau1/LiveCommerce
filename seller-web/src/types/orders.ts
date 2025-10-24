// Order-related interfaces
export interface OrderAddress {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    _id: string;
  }
  
  export interface OrderBuyer {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }
  
  export interface OrderBuyerDetails {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profileImage: Array<{
      _id: string;
      url?: string;
    }>;
  }
  
  export interface OrderProductImage {
    url: string;
    _id: string;
    resizedImages?: Array<{
      _id: string;
      width: number;
      url: string;
      key: string;
      location: string;
      id: string;
    }>;
    id?: string;
    originalUrl?: string;
  }
  
  export interface OrderProduct {
    _id: string;
    name: string;
    price: number;
    seller: {
      warehouseDetails: {
        address: {
          country: string;
          state: string;
          city: string;
          addressLine1: string;
          addressLine2: string;
          zipCode: string;
        };
      };
      storeAvatar: {
        url: string;
        public_id: string;
      };
      storeBanner: {
        url: string;
        public_id: string;
      };
      stats: {
        ratingDistribution: {
          "1": number;
          "2": number;
          "3": number;
          "4": number;
          "5": number;
        };
        averageRating: number;
        totalReviews: number;
      };
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      isVerified: boolean;
      createdAt: string;
      aboutStore: string;
      storeName: string;
      offersStorePickup: boolean;
    };
    images: OrderProductImage[];
    discountedPrice: number;
    id: string;
  }
  
  export interface OrderItem {
    specifications: {
      color: string;
      size: string;
      material: string;
    };
    product: OrderProduct;
    productName: string;
    seller: string;
    productImages: Array<{
      url: string;
      _id: string;
    }>;
    quantity: number;
    price: number;
    status: string;
    _id: string;
    statusHistory: Array<{
      status: string;
      timestamp: string;
      _id: string;
      note?: string;
    }>;
  }
  
  export interface ShippingTrackingHistory {
    status: string;
    timestamp: string;
    description: string;
    _id: string;
    location?: string;
  }
  
  export interface ShippingTracking {
    number: string;
    status: string;
    history: ShippingTrackingHistory[];
    lastUpdate?: string;
    url?: string;
  }
  
  export interface ShippingDocuments {
    commercialInvoice: string;
    shippingLabel: string;
  }
  
  export interface ShippingDelivery {
    estimatedDate: string;
    actualDate?: string;
  }
  
  export interface ShippingCarrier {
    name: string;
    reference: string;
  }
  
  export interface ShippingFee {
    amount: number;
    currency: string;
  }
  
  export interface OrderShipping {
    carrier: ShippingCarrier;
    fee: ShippingFee;
    tracking: ShippingTracking;
    documents?: ShippingDocuments;
    delivery: ShippingDelivery;
    shipment_id: string;
    estimatedDeliveryDate: string;
    estimatedPickupDate: string;
    rate_id: string;
  }
  
  export interface OrderPaymentInfo {
    status: string;
    method: string;
    isCashOnDelivery: boolean;
    isWalletCredit: boolean;
    walletAmountUsed: number;
    paidAt: string;
    paymentReference: string;
  }
  
  export interface OrderStatus {
    hasReturn: boolean;
    hasDispute: boolean;
    hasRefund: boolean;
  }
  
  export interface RefundRequest {
    requested: boolean;
    status: string;
  }
  
  export interface StorePickupStatus {
    state: string;
  }
  
  export interface Order {
    storePickupStatus: StorePickupStatus;
    buyerDetails: OrderBuyerDetails;
    shipping: OrderShipping;
    paymentInfo: OrderPaymentInfo;
    orderStatus: OrderStatus;
    refundRequest: RefundRequest;
    _id: string;
    order_id: string;
    isStorePickup: boolean;
    isInternational: boolean;
    isStale: boolean;
    buyer: OrderBuyer;
    seller: string;
    channel: string;
    status: string;
    items: OrderItem[];
    totalAmount: number;
    delivery_address: OrderAddress;
    pickup_address: OrderAddress;
    paid: boolean;
    isOpen: boolean;
    notificationsSent: boolean;
    notes: any[];
    createdAt: string;
    __v: number;
    closedAt?: string;
    closedBy?: string;
    closedReason?: string;
  }
  
  export interface OrdersData {
    orders: Order[];
    currentPage: number;
    totalPages: number;
  }
  
  export interface OrdersPagination {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasMore: boolean;
    hasPrevious: boolean;
  }
  
  // Seller orders API response interface
  export interface SellerOrders {
    success: boolean;
    message: string;
    data: OrdersData;
    pagination: OrdersPagination;
  }
  