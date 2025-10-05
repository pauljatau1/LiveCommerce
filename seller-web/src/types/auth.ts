/**
 * Type definitions for authentication context and related interfaces
 * This file provides comprehensive typing for the AuthContext migration
 */

// Seller user interface based on the API response structure
export interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  storeName: string;
  accountType: 'individual' | 'business';
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

// Token interface for authentication tokens
export interface AuthToken {
  data: string;
  isVerified?: boolean;
}

// OTP status types
export type OtpStatus = 'pending' | 'verified' | 'failed' | '';

// Auth action types for the reducer
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TOKEN'; payload: AuthToken }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SIGNUP_SUCCESS'; payload: Seller }
  | { type: 'SIGNUP_FAILED'; payload: string }
  | { type: 'VERIFY_OTP_SUCCESS' }
  | { type: 'VERIFY_OTP_FAILED'; payload: string }
  | { type: 'RESET' }
  | { type: 'REQUEST_OTP_SUCCESS'; payload: string }
  | { type: 'REQUEST_OTP_FAILED'; payload: string }
  | { type: 'LOGIN_SUCCESS'; payload: { seller: Seller; token: string } }
  | { type: 'LOGIN_FAILED'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SIGNUP_USER_EXISTS' }
  | { type: 'FETCH_SELLER_DETAILS'; payload: Seller }
  | { type: 'CHECK_TOKEN_SUCCESS' }
  | { type: 'CHECK_TOKEN_FAILED' }
  | { type: 'STORE_TOKEN'; payload: AuthToken }
  | { type: 'STORE_SELLER'; payload: Seller }
  | { type: 'FETCH_TOP_3_SELLING_PRODUCTS'; payload: any }
  | { type: 'FETCH_STUFF_TO_DO'; payload: any }
  | { type: 'UNVERIFIED_SELLER'; payload: Seller }
  | { type: 'FETCH_ONBOARDING_PROCESS'; payload: any }
  | { type: 'BLOCKED_USER' }
  | { type: 'RESET_PASSWORD_SUCCESS'; payload: string }
  | { type: 'RESET_PASSWORD_WITH_TOKEN_SUCCESS'; payload: string }
  | { type: 'CANCEL_RESET_PASSWORD' }
  | { type: 'SET_DATA_READY'; payload: boolean }
  | { type: 'ACCOUNT_DISABLED' }
  | { type: 'SET_SUBMITTING_OTP'; payload: boolean }
  | { type: 'SET_RESENDING_OTP'; payload: boolean };

// Auth state interface
export interface AuthState {
  seller: Seller | null;
  signUpSellerDetails: Seller | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: AuthToken | null;
  message: string;
  otpStatus: OtpStatus;
  isTokenValid: boolean;
  top3SellingProducts: any | null;
  stuffToDo: any | null;
  unverifiedUser: boolean | null;
  onboardingStep: any | null;
  blockedUser: boolean;
  isForgotPasswordRequestSuccessful: boolean;
  passwordResetSuccessful: boolean;
  isDataReady: boolean;
  emailVerified: boolean;
  isAccountDisabled: boolean;
  isSubmittingOtp: boolean;
  isResendingOtp: boolean;
}

// Auth context methods interface
export interface AuthContextMethods {
  dispatch: React.Dispatch<AuthAction>;
  createSeller: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    storeName: string
  ) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  requestNewOtp: (email: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  fetchSellerDetails: () => Promise<Seller | null>;
  checkTokenValidity: () => Promise<boolean>;
  getTop3SellingProducts: () => Promise<void>;
  getSellerNotifications: () => Promise<void>;
  getOnboardingProcess: () => Promise<void>;
  resetPasswordWithOtp: (resetData: {
    email: string;
    code: string;
    newPassword: string;
  }) => Promise<boolean>;
}

// Complete AuthContext type
export type AuthContextType = AuthState & AuthContextMethods;

// Props for AuthProvider component
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Login form data interface
export interface LoginFormData {
  email: string;
  password: string;
}

// Signup form data interface
export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  storeName: string;
}

// Password reset data interface
export interface PasswordResetData {
  email: string;
  code: string;
  newPassword: string;
}
