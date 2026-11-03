import type { currencySymbol } from '@/core';

export type PaymentMethods = 'wallet' | 'bank_transfer' | 'card';

export type Service = {
  createdAt: string;
  description: string;
  identifier: string;
  name: string;
  updatedAt: string;
  _id: string;
};

export type ServiceProvider = {
  _id: string;
  name: string;
  identifier: string;
  service: string;
  vendor: string;
  isFixedAmount: boolean;
  description: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type Beneficiary = {
  id: string;
  service: string;
  serviceProvider: string;
  serviceProviderId: string;
  gatewayProvider: string;
  amount: number;
  currency: currencySymbol;
  phoneNumber: string;
  cardNumber: string;
  meterNumber: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  bundleName: string;
  bundleCode: string;
  vendType: string;
  bundleValidity: string;
  senderName: string;
  logoUrl: string;
  packageSlug: string;
  frequency: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type EventTicket = {
  id: number;
  eventName: string;
  eventOrganizer: string;
  eventType: string;
  eventCategory: string;
  eventDescription: string;
  salesStartDate: string;
  salesEndDate: string;
  eventDateTime: string;
  eventLocation: string;
  eventImage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  eventTickets: {
    id: number;
    ticketType: string;
    ticketPrice: number;
    quantityToBeSold: number;
    quantitySold: number;
    createdAt: string;
    updatedAt: string;
  }[];
};

export type GiftCard = {
  productId: number;
  productName: string;
  global: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  supportsPreOrder: boolean;
  senderFee: number;
  senderFeePercentage: number;
  discountPercentage: number;
  denominationType: 'FIXED' | 'RANGE';
  recipientCurrencyCode: currencySymbol;
  minRecipientDenomination: number | null;
  maxRecipientDenomination: number | null;
  senderCurrencyCode: currencySymbol;
  minSenderDenomination: number | null;
  maxSenderDenomination: number | null;
  fixedRecipientDenominations: number[];
  fixedSenderDenominations: number[];
  fixedRecipientToSenderDenominationsMap: {
    [key: number]: number;
  };
  metadata: {};
  logoUrls: string[];
  brand: {
    brandId: number;
    brandName: string;
  };
  category: {
    id: number;
    name: string;
  };
  country: {
    isoName: string;
    name: string;
    flagUrl: string;
  };
  redeemInstruction: {
    concise: string;
    verbose: string;
  };
  additionalRequirements: {
    userIdRequired: boolean;
  };
};

export type ServiceProviderProduct = {
  validity: string;
  bundleCode: string;
  amount: string;
  isAmountFixed: boolean;
  name?: string;
};

export type PurchaseServiceRequestBody = {
  serviceProviderId: string; // required when purchasing all bills
  serviceProvider: string; // required when purchasing all bills eg MTN, AIRTEL, GOTV, BEDC etc
  phoneNumber?: string; // only required when billServiceType is airtime and data
  txnPin: number; // required when purchasing all bills
  amount: number; // required when purchasing all bills
  bundleCode?: string; // only required when billServiceType is data and cable-tv
  bundleName?: string; // only required when billServiceType is data and cable-tv
  bundleValidity?: string; // only required when billServiceType is data and cable-tv
  cardNumber?: string; // only required when billServiceType is cable-tv
  meterNumber?: string; // only required when billServiceType is utility
  vendType?: string; // only required when billServiceType is utility
  customerAddress?: string; // only required when billServiceType is utility
  customerName?: string; // only required when billServiceType is utility
  logoUrl?: string;
  saveAsBeneficiary?: boolean;
  paymentMethod: PaymentMethods;
  isScheduled?: boolean;
  frequency?: string; // daily|3days|weekly|biweekly|monthly|quarterly|yearly
  startDate?: string;
  endDate?: string;
};

export type PurchaseGiftCardRequestBody = {
  productId: number;
  quantity: number;
  unitPrice: number; //in USD
  preOrder: boolean; //Default value is false. Set it to true if your users want to pre-order the gift card.
  senderToReceiverRate: number; //Value based on exchange rate NGN per USD
  senderFee: number;
  smsFee: number;
  discountPercentage: number;
  senderName: string;
  recipientEmail: string;
  recipientPhoneDetails: {
    countryCode: string;
    phoneNumber: string;
  };
  txnPin: number;
  logoUrl: string;
  saveAsBeneficiary: boolean;
  paymentMethod: PaymentMethods;
  customerEmail?: string; // mandatory for unauthorized purchase
};

export type FundBettingAccountRequestBody = {
  serviceProvider: string;
  customerId: string;
  customerName: string;
  packageSlug: string;
  amount: number;
  phoneNumber: string;
  txnPin: number;
  paymentMethod: PaymentMethods;
  saveAsBeneficiary: boolean;
  //This section here for scheduled bills paymenent
  isScheduled?: boolean;
  frequency?: string;
  startDate?: string;
  endDate?: string;
};

export type PurchaseEventTicketsRequestBody = {
  ticketId: string;
  quantity: number;
  txnPin: number;
  logoUrl: string;
  paymentMethod: PaymentMethods;
  customerEmail: string;
};

export type GetServicesResponse = {
  statusCode: number;
  message: string;
  data: Service[];
};

export type GetServiceProvidersRequest = {
  billServiceId: string;
};

export type GetServiceProvidersResponse = {
  statusCode: number;
  message: string;
  data: ServiceProvider[];
};

export type GetSAvailableGiftcardsByCountryRequest = {
  countryCode: string;
};

export type GetSAvailableGiftcardsByCountryResponse = {
  statusCode: number;
  message: string;
  data: GiftCard[];
};

export type GetServiceProviderProductsRequest = {
  serviceProviderId: string;
};

export type GetServiceProviderProductsResponse = {
  statusCode: number;
  message: string;
  data: ServiceProviderProduct[];
};

export type GetGiftCardExchangeRateRequest = {
  currencyCode: currencySymbol;
  amount: number;
};

export type GetGiftCardExchangeRateResponse = {
  statusCode: number;
  message: string;
  data: {
    senderCurrency: currencySymbol;
    senderAmount: number;
    recipientCurrency: currencySymbol;
    recipientAmount: number;
  };
};

export type PurchaseServiceRequest = {
  billServiceType: string;
  body: PurchaseServiceRequestBody;
};

export type PurchaseServiceResponse = {
  statusCode: number;
  message: string;
  data: {
    authorization_url?: string;
    reference?: string;
  };
};

export type PurchaseGiftCardRequest = {
  body: PurchaseGiftCardRequestBody;
};

export type PurchaseGiftCardResponse = {
  statusCode: number;
  message: string;
  data: {};
};

export type VerifyInfoRequest = {
  serviceProviderId: string;
  entityNumber: string;
};

export type VerifyInfoResponse = {
  statusCode: number;
  message: string;
  data: {
    data: {
      status: string;
      name: string;
      customernumber: string;
    };
  };
};

export type VerifyBettingCustomerRequest = {
  customerId: string;
  providerSlug: string;
  packageSlug: string;
};

export type VerifyBettingCustomerResponse = {
  statusCode: number;
  message: string;
  data: {
    billerName: string;
    paid: boolean;
    narration: string;
    statusCode: string;
    customer: {
      firstName: string;
      lastName: string;
      accountNumber: string;
      userName: string;
      customerType: string;
      canVend: boolean;
      phoneNumber: string;
      emailAddress: string;
    };
  };
};

export type GetBettingServicesRequest = {};

export type GetBettingServicesResponse = {
  statusCode: number;
  message: string;
  data: ServiceProviderProduct[];
};

export type GetBettingServicesProvidersRequest = {};

export type GetBettingServicesProvidersResponse = {
  statusCode: number;
  message: string;
  data: {
    id: number;
    name: string;
    slug: string;
    groupId: number;
    skipValidation: boolean;
    handleWithProductCode: boolean;
    isRestricted: boolean;
    hideInstitution: boolean;
  }[];
};

export type GetBettingServicesProvidersPackagesRequest = {
  id: string;
};

export type GetBettingServicesProvidersPackagesResponse = {
  statusCode: number;
  message: string;
  data: {
    id: number;
    name: string;
    slug: string;
    amount: number;
    billerId: number;
    sequenceNumber: number;
  }[];
};

export type FundBettingAccountRequest = {
  body: FundBettingAccountRequestBody;
};

export type FundBettingAccountResponse = {
  statusCode: number;
  message: string;
  data: {};
};

export type PurchaseEventTicketsRequest = {
  body: PurchaseEventTicketsRequestBody;
};

export type PurchaseEventTicketsResponse = {
  statusCode: number;
  message: string;
  data: {};
};

export type GetEventTicketsRequest = void;

export type GetEventTicketsResponse = {
  statusCode: number;
  message: string;
  data: EventTicket[];
};

export type GetBeneficiariesRequest = void;

export type GetBeneficiariesResponse = {
  statusCode: number;
  message: string;
  data: Beneficiary[];
};

export type GetScheduledBillsRequest = void;

export type GetScheduledBillsResponse = {
  statusCode: number;
  message: string;
  data: Beneficiary[];
};

export type DeleteBeneficiariesRequest = {
  id: string;
};

export type DeleteBeneficiariesResponse = {
  statusCode: number;
  message: string;
};
