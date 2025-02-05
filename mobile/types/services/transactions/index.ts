import type { currencySymbol } from '@/core';

import type { PaymentMethods } from '../services';

export type Transaction = {
  id: string;
  type: 'WALLET_DEPOSIT' | 'WALLET_WITHDRAWAL';
  trxOwner: string;
  service: string;
  serviceProvider: string;
  gatewayProvider: string;
  providerTxnRefId: string;
  amount: number;
  currentWalletBalance: number;
  previousWalletBalance: number;
  currency: currencySymbol;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  senderName: string;
  senderBankCode: string;
  senderBank: string;
  senderAccountNumber: string;
  narration: string;
  utilityToken: string;
  package: string;
  logoUrl: string;
  customer: string;
  customerAddress: string;
  customerName: string;
  updatedAt: string;
  createdAt: string;
  paymentMethod: PaymentMethods;
};

export type GetTransactionsRequest = {
  startDate?: string;
  endDate?: string;
  type?: string;
};

export type GetTransactionsResponse = {
  statusCode: number;
  message: string;
  data: Transaction[];
};
