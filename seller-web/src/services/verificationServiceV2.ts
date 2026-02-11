import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";
import { trackEvent } from "@/util/analytics";
import { sellerUtils } from "@/util/auth";
import type { Seller } from "@/types";

const VERIFICATION_ENDPOINTS = {
  selectAccountType: "/sellers/profile/account-type",
  updateIndividualInformation: "/seller/individual-information",
  addBusinessInformation: "/sellers/business-information",
} as const;

export interface IndividualInformation {
  firstName: string;
  lastName: string;
  sellerAddress: {
    country: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    zipCode: string;
  };
}

export interface BusinessInformation {
  businessEmail: string;
  businessNumber: string;
  businessAddress: {
    country: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    zipCode: string;
  };
}

export interface AccountTypeResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    seller: Seller;
  };
  pagination: null;
}

export interface AddressUpdateResponse {
  status: number;
  data: {
    success: boolean;
    message: string;
    data: {
      message: string;
      seller: Seller;
    };
    pagination: null;
  };
}

export const verificationService = {
  /**
   * Selects the account type for a seller
   *
   * @param accountType - The account type ('individual' or 'business')
   * @returns Promise<AccountTypeResponse> - The API response
   */
  async selectAccountType(accountType: "individual" | "business"): Promise<AccountTypeResponse> {
    const url = VERIFICATION_ENDPOINTS.selectAccountType;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.put<AccountTypeResponse>(
      url,
      { accountType } as unknown as Record<string, unknown>,
      config
    );

    const sellerData = sellerUtils.getSeller();
    if (response.success && sellerData) {
      trackEvent("seller Account Type Selected", {
        "Account Type": accountType,
        "seller id": sellerData._id,
        "seller email": sellerData.email,
        "seller store name": sellerData.storeName,
        "seller first name": sellerData.firstName,
        "seller last name": sellerData.lastName,
        "seller phone number": sellerData.phoneNumber,
        "Signup Date": new Date(sellerData.createdAt).toISOString().split("T")[0],
        "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
      });
    }

    return response;
  },

  /**
   * Updates the individual seller information
   *
   * @param individualInfo - The individual information
   * @returns Promise<AddressUpdateResponse> - The API response
   */
  async updateIndividualInformation(individualInfo: IndividualInformation): Promise<AddressUpdateResponse> {
    const url = VERIFICATION_ENDPOINTS.updateIndividualInformation;
    const config = {
      baseURL: API_CONFIG.BASE_URL,
    };
    const response = await apiService.put<AccountTypeResponse>(
      url,
      individualInfo as unknown as Record<string, unknown>,
      config
    );

    const sellerDetails = sellerUtils.getSeller();
    if (response.success && sellerDetails) {
      trackEvent("seller pickup address verification completed", {
        "seller id": sellerDetails._id,
        "seller email": sellerDetails.email,
        "seller store name": sellerDetails.storeName,
        "seller first name": sellerDetails.firstName,
        "seller last name": sellerDetails.lastName,
        "seller phone number": sellerDetails.phoneNumber,
        "Country": individualInfo.sellerAddress.country,
        "State": individualInfo.sellerAddress.state,
        "City": individualInfo.sellerAddress.city,
        "Address Line 1": individualInfo.sellerAddress.addressLine1,
        "Address Line 2": individualInfo.sellerAddress.addressLine2 || "",
        "Zip Code": individualInfo.sellerAddress.zipCode,
      });
    }

    return {
      status: 200,
      data: response,
    };
  },

  /**
   * Adds business contact and address information
   *
   * @param businessInfo - The business information
   * @returns Promise<AddressUpdateResponse> - The API response
   */
  async addBusinessInformation(businessInfo: BusinessInformation): Promise<AddressUpdateResponse> {
    const url = VERIFICATION_ENDPOINTS.addBusinessInformation;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.put<AccountTypeResponse>(
      url,
      businessInfo as unknown as Record<string, unknown>,
      config
    );

    const sellerDetails = sellerUtils.getSeller();
    if (response.success && sellerDetails) {
      trackEvent("seller pickup address adddress verification completed", {
        "seller id": sellerDetails._id,
        "seller email": sellerDetails.email,
        "seller store name": sellerDetails.storeName,
        "seller first name": sellerDetails.firstName,
        "seller last name": sellerDetails.lastName,
        "seller phone number": sellerDetails.phoneNumber,
        "Country": businessInfo.businessAddress.country,
        "State": businessInfo.businessAddress.state,
        "City": businessInfo.businessAddress.city,
        "Address Line 1": businessInfo.businessAddress.addressLine1,
        "Address Line 2": businessInfo.businessAddress.addressLine2 || "",
        "Zip Code": businessInfo.businessAddress.zipCode,
      });
    }

    return {
      status: 200,
      data: response,
    };
  },
};

