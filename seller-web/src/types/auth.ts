/**
 * Type definitions for authentication context and related interfaces
 * This file provides comprehensive typing for the AuthContext migration
 */

import type { Seller } from "./seller";


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
  | { type: 'AUTH_SUCCESS'; payload: { seller: Seller; token: string } }
  | { type: 'AUTH_FAILED'; payload: string }
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
}

// Auth login activity interface
export interface AuthLoginActivity {
  handleLoginActivity: (seller: Seller, token: string, destination?: string) => void;
}

// Auth signup activity interface
export interface AuthSignupActivity {
  handleSignupActivity: (seller: Seller, token: string) => Promise<boolean>;
}

// Auth logout activity interface
export interface AuthLogoutActivity {
  logout: () => void;
}

// Complete AuthContext type
export type AuthContextType = AuthState & AuthContextMethods & AuthLoginActivity & AuthLogoutActivity & AuthSignupActivity;

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
  fullName: string;
  email: string;
  storeName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

// Verify OTP form data interface
export interface VerifyOtpFormData {
  email: string;
  otp: string;
}

// Password reset data interface
export interface PasswordResetData {
  email: string;
  code: string;
  newPassword: string;
}

// Login response interface
export interface LoginResponse {
  data: {
    token: string;
    user: Seller;
  };
}

// Signup response interface
export interface SignupResponse {
  data: {
    token: string;
    user: Seller;
  };
}

// Verify OTP response interface
export interface VerifyOtpResponse {
  data: {
    token: string;
    user: Seller;
  };
}

// Request OTP response interface
export interface RequestOtpResponse {
  data: {
    message: string;
  };
}

// Reset password response interface
export interface ResetPasswordResponse {
  data: {
    message: string;
  };
}

// Reset password with OTP response interface
export interface ResetPasswordWithOtpResponse {
  data: {
    message: string;
  };
}

// Check token validity response interface
export interface CheckTokenValidityResponse {
  data: {
    token: string;
    user: Seller;
  };
}

// Google OAuth request data interface
export interface GoogleOAuthRequestData {
  token: string;
}

// Google OAuth response interface
export interface GoogleOAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: Seller;
    token: string;
  };
}

