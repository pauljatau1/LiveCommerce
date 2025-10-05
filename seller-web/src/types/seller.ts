// Seller user interface based on the API response structure
export interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  storeName: string;
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
};

// Seller notifications interface
export interface SellerNotifications {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}
