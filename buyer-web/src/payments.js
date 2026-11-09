// Paystack top-ups. The server credits only what Paystack confirms, for this
// buyer, as a wallet top-up; the amount always comes from verification.
import { PAYSTACK_KEY, api } from './api';

export const loadPaystack = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v2/inline.js';
    s.onload = () => resolve(window.PaystackPop);
    s.onerror = () => reject(new Error("Couldn't load Paystack. Check your connection."));
    document.head.appendChild(s);
  });

export class PaymentCancelled extends Error {}

// Opens Paystack for `amount` naira and resolves once the server has confirmed
// and credited the top-up. Rejects with PaymentCancelled if the buyer closes it.
export const topUpWithPaystack = async ({ email, buyerId, amount }) => {
  if (!PAYSTACK_KEY) throw new Error("Payments aren't switched on yet.");
  const PaystackPop = await loadPaystack();
  return new Promise((resolve, reject) => {
    new PaystackPop().newTransaction({
      key: PAYSTACK_KEY,
      email,
      amount: amount * 100,
      currency: 'NGN',
      metadata: { purpose: 'wallet_topup', buyerId },
      onSuccess: async (tx) => {
        try {
          await api.confirmTopUp(amount, tx.reference);
          resolve(tx.reference);
        } catch (e) {
          reject(e);
        }
      },
      onCancel: () => reject(new PaymentCancelled('Payment cancelled')),
      onError: (e) => reject(new Error(e?.message || 'Payment failed.')),
    });
  });
};
