import type { Wallet } from "../wallet";

export interface User {
  __v: number;
  _id: string;
  activityFeed: any[];
  conversations: any[];
  country: string;
  createdAt: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  followers: any[];
  following: any[];
  isDisabled: boolean;
  isNew: boolean;
  lastName: string;
  messages: any[];
  otp: string;
  password: string;
  phoneNumber: string;
  phoneVerified: boolean;
  posts: any[];
  profileImage: any;
  selectedCategories: any[];
  shippingAddresses: any[];
  username: string;
  wishlist: any[];
  wallet: Wallet;
}

export interface LoginRequest {
  email: string;
  password: string;
  expoPushToken: string;
  googleToken: string;
  firstName: string;
  lastName: string;
  username: string;
}

export type LoginResponseData = {
  token: string;
  user: User;
}

export type LoginResponse = {
  success:boolean,
  message:string,
  data:LoginResponseData
};

export type SignUpRequest = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  country: string;
  phoneNumber: string;
  password: string;
  expoPushToken?: string;
};

type signUpResponseData = {
  token: string;
  user: User;
}

export type SignUpResponse = {
  success:boolean,
  message:string,
  data:signUpResponseData
};

export type ResendEmailOTPRequest = {
  email: string;
};

export type ResendEmailOTPResponse = {
  statusCode: number;
  message: string;
};

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export type VerifyEmailResponse = LoginResponse;

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  status: string;
  message: string;
  data: {
    email: string;
    temp_token: string;
  };
};

export type SetPINRequest = {
  txnPin: number;
};

export type SetPINResponse = {
  status: string;
  message: string;
  data: {};
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  newPassword: string;
  // confirmPassword: string;
};

export type ResetPasswordResponse = {
  status: string;
  message: string;
};

export type ResendEmailConfirmationRequest = {
  email: string;
};

export type ResendEmailConfirmationResponse = {
  success: boolean;
  statusCode: number;
  message: string;
};

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  statusCode: number;
  message: string;
};

export type ChangePinRequest = {
  oldTxnPin: number;
  newTxnPin: number;
};

export type ChangePinResponse = {
  success: boolean;
  statusCode: number;
  message: string;
};

export type VerifyPinRequest = {
  txnPin: number;
};

export type VerifyPinResponse = {
  success: boolean;
  statusCode: number;
  message: string;
};
