import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";
import { authUtils } from "@/util/auth";
import type {
  LoginFormData,
  SignupFormData,
  PasswordResetData,
  LoginResponse,
  SignupResponse,
  VerifyOtpResponse,
  VerifyOtpFormData,
  RequestOtpResponse,
  ResetPasswordResponse,
  CheckTokenValidityResponse,
} from "@/types";

const AUTH_ENDPOINTS = {
  login: "/sellers/login",
  signUp: "/sellers/register",
  forgotPassword: "/seller/forgot-password",
  resetPassword: "/seller/reset-password",
  verifyOtp: "/sellers/verify-otp",
  requestOtp: "/sellers/request-otp",
  checkTokenValidity: "/sellers/check-token",
  getTop3SellingProducts: "/sellers/top-3-selling-products",
  getSellerNotifications: "/sellers/notifications",
  getOnboardingProcess: "/sellers/onboarding-process",
};

export const authService = {
  /**
   * Login User with email and/or password
   *
   * @param email - Sellers's email
   * @param password - Sellers's password
   * @returns Promise<LoginResponse> - Login response
   */

  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const url = AUTH_ENDPOINTS.login;
    // use v2 base url for this login endpoint
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.post<LoginResponse>(
      url,
      credentials as unknown as Record<string, unknown>,
      config
    );
    return response;
  },

  /**
   * Sign up a new seller
   *
   * @param credentials - Signup form data
   * @returns Promise<SignupResponse> - Signup response
   */
  async signUp(credentials: SignupFormData): Promise<SignupResponse> {
    const url = AUTH_ENDPOINTS.signUp;
    // use v2 base url for this signup endpoint
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };

    // create a temporary credentials object with the first name till endpoint changes are made
    const tempCredentials = {
      ...credentials,
      firstName: credentials.fullName.split(" ")[0],
      lastName: credentials.fullName.split(" ")[1],
    }

    const response = await apiService.post<SignupResponse>(
      url,
      tempCredentials as unknown as Record<string, unknown>,
      config
    );
    return response;
  },

  /**
   * Verify OTP for signup
   *
   * @param credentials - Verify OTP form data
   * @returns Promise<VerifyOtpResponse> - Verify OTP response
   */
  async verifyOtp(credentials: VerifyOtpFormData): Promise<VerifyOtpResponse> {
    const url = AUTH_ENDPOINTS.verifyOtp;
    // use v2 base url for this verify otp endpoint
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.post<VerifyOtpResponse>(
      url,
      credentials as unknown as Record<string, unknown>,
      config
    );
    return response;
  },

  /**
   * Request New OTP
   *
   * @param email - Seller's email
   * @returns Promise<RequestOtpResponse> - Request OTP response
   */
  async requestOtp(email: string): Promise<RequestOtpResponse> {
    const url = AUTH_ENDPOINTS.requestOtp;
    // use v2 base url for this request otp endpoint
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.post<RequestOtpResponse>(
      url,
      { email },
      config
    );
    return response;
  },

  /**
   * Forgot seller password request
   *
   * @params email - Seller's email
   * @returns Promise<ResetPasswordResponse> - Reset password response
   */
  async forgotPasswordRequest(
    email: string
  ): Promise<ResetPasswordResponse> {
    const url = AUTH_ENDPOINTS.forgotPassword;
    const response = await apiService.post<ResetPasswordResponse>(
      url,
      { email } as unknown as Record<string, unknown>
    );
    return response;
  },

  /**
   * Reset password with OTP
   *
   * @params credentials - Reset password form data
   * @returns Promise<ResetPasswordWithOtpResponse> - Reset password response
   */
  async resetPasswordWithOtp(
    credentials: PasswordResetData
  ): Promise<ResetPasswordResponse> {
    const url = AUTH_ENDPOINTS.resetPassword;
    const response = await apiService.post<ResetPasswordResponse>(
      url,
      credentials as unknown as Record<string, unknown>
    );
    return response;
  },

  /**
   * Check token validity
   * 
   * @returns Promise<CheckTokenValidityResponse> - Check token validity response
   */
  async checkTokenValidity(): Promise<CheckTokenValidityResponse> {
    const url = AUTH_ENDPOINTS.checkTokenValidity;
    // use v2 base url for this check token validity endpoint
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<CheckTokenValidityResponse>(url, config);
    return response.data;
  },

  /**
   * Log out user
   * 
   * @returns Promise<void> - Log out user
   */
  async logout(): Promise<void> {
    authUtils.clearAllAuthData();
  },
};
