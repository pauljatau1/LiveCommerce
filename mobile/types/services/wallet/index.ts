import type { currencySymbol } from '@/core';

export type Wallet = {
  id: string;
  balance: number;
  bookBalance: number;
  paystackId: string;
  accountName: string;
  bankName: string;
  bankCode: number;
  accountNumber: string;
  currency: currencySymbol;
  nubanProvider: string;
  createdAt: string;
};

export type GetWalletResponse = {
  statusCode: number;
  message: string;
  data: Wallet;
};

export type CreateWalletRequest = {
  bvn: string;
  bvnDateOfBirth: string;
};

export type CreateWalletResponse = {
  statusCode: number;
  message: string;
  data: Wallet;
};
