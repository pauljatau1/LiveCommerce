import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// import { API_URL } from '@env'

import { getRequest, patchRequest, postRequest } from '@/core';
import { getToken } from '@/store/features/auth/utils';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResendEmailOTPRequest,
  ResendEmailOTPResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SignUpRequest,
  SignUpResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@/types/services/auth';

export const auth = createApi({
  reducerPath: 'auth',
  baseQuery: fetchBaseQuery({
      baseUrl: process.env.EXPO_PUBLIC_API_URL + 'api',
    prepareHeaders: async (headers) => {
      const token = getToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => postRequest('/buyer/login', credentials),
    }),
    signUp: builder.mutation<SignUpResponse, SignUpRequest>({
      query: (credentials) => postRequest('/buyer/register', credentials),
    }),
    verifyEmail: builder.mutation<VerifyEmailResponse, VerifyEmailRequest>({
      query: (credentials) => postRequest('/buyer/verify-otp', credentials),
    }),
    resendEmailOTP: builder.query<
      ResendEmailOTPResponse,
      ResendEmailOTPRequest
    >({
      query: (credentials) => getRequest('/resendEmailOtp', credentials),
    }),
    forgotPassword: builder.mutation<
      ForgotPasswordResponse,
      ForgotPasswordRequest
    >({
        query: (credentials) => postRequest('/buyer/forgot-password', credentials),
    }),
    resetPassword: builder.mutation<
      ResetPasswordResponse,
      ResetPasswordRequest
    >({
      query: (credentials) => postRequest('resetPassword', credentials),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignUpMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = auth;
