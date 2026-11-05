const topUpWalletService = require('@modules/buyer/services/topUpWallet.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const topUpWalletValidator = require('@modules/buyer/validators/topUpWallet.validator');
const verifyWalletTopUpService = require('@modules/buyer/services/verifyWalletTopUp.service');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/topUpWallet.validator');
jest.mock('@modules/buyer/services/verifyWalletTopUp.service', () => ({
  verifyWalletTopUp: jest.fn(),
  WALLET_TOPUP_PURPOSE: 'wallet_topup',
}));

describe('topUpWallet.service', () => {
  const buyerId = '507f1f77bcf86cd799439011';
  const buyer = {
    _id: buyerId,
    email: 'john@example.com',
    wallet: { balance: 5000, transactions: [] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
  });

  describe('buyers paying through Paystack', () => {
    const buyerUser = { isAdmin: false };

    it('credits only what Paystack confirms, by verifying the reference', async () => {
      const verified = { message: 'Wallet topped up successfully', newBalance: 6000 };
      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(verified);

      // The request claims ₦1,000,000; only Paystack's confirmed amount counts
      const result = await topUpWalletService.topUpWallet(
        buyerId,
        { amount: 1000000, paymentReference: 'PAY-REF-1' },
        buyerUser,
        'production'
      );

      expect(result).toBe(verified);
      expect(verifyWalletTopUpService.verifyWalletTopUp).toHaveBeenCalledWith('PAY-REF-1', { expectedBuyerId: buyerId });
      expect(buyerRepository.updateWalletWithTransaction).not.toHaveBeenCalled();
    });

    it('refuses a top-up with no Paystack payment reference', async () => {
      await expect(
        topUpWalletService.topUpWallet(buyerId, { amount: 50000 }, buyerUser, 'production')
      ).rejects.toThrow(ValidationError);
      expect(buyerRepository.updateWalletWithTransaction).not.toHaveBeenCalled();
      expect(verifyWalletTopUpService.verifyWalletTopUp).not.toHaveBeenCalled();
    });

    it('ignores bypassPaystack for a non-admin outside development', async () => {
      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue({ message: 'ok' });
      await topUpWalletService.topUpWallet(
        buyerId,
        { amount: 50000, bypassPaystack: true, paymentReference: 'PAY-REF-2' },
        buyerUser,
        'production'
      );
      expect(verifyWalletTopUpService.verifyWalletTopUp).toHaveBeenCalled();
      expect(buyerRepository.updateWalletWithTransaction).not.toHaveBeenCalled();
    });

    it('passes verification failures through unchanged', async () => {
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new ValidationError([{ field: 'reference', message: 'This payment does not belong to your account' }])
      );
      await expect(
        topUpWalletService.topUpWallet(buyerId, { amount: 1000, paymentReference: 'SOMEONE-ELSE' }, buyerUser, 'production')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('direct top-ups (admin, or local development)', () => {
    const admin = { isAdmin: true };

    it('lets an admin credit directly, recording and crediting in one write', async () => {
      buyerRepository.findByIdWithWallet.mockResolvedValue(buyer);
      buyerRepository.updateWalletWithTransaction.mockResolvedValue({ ...buyer, wallet: { ...buyer.wallet, balance: 6000 } });

      const result = await topUpWalletService.topUpWallet(
        buyerId,
        { amount: 1000, bypassPaystack: true, description: 'Refund' },
        admin,
        'production'
      );

      expect(result.newBalance).toBe(6000);
      expect(result.transaction).toMatchObject({ type: 'credit', amount: 1000, status: 'completed' });
      expect(result.transaction.description).toBe('Refund (Direct)');
      expect(buyerRepository.updateWalletWithTransaction).toHaveBeenCalledWith(
        buyerId,
        expect.objectContaining({ amount: 1000, paymentReference: expect.any(String) })
      );
      expect(verifyWalletTopUpService.verifyWalletTopUp).not.toHaveBeenCalled();
    });

    it('allows direct top-ups in local development', async () => {
      buyerRepository.findByIdWithWallet.mockResolvedValue(buyer);
      buyerRepository.updateWalletWithTransaction.mockResolvedValue({ ...buyer, wallet: { ...buyer.wallet, balance: 7000 } });

      const result = await topUpWalletService.topUpWallet(
        buyerId,
        { amount: 2000, bypassPaystack: true },
        { isAdmin: false },
        'development'
      );
      expect(result.newBalance).toBe(7000);
    });

    it('returns the existing record for a reference already credited', async () => {
      const existing = { paymentReference: 'DIRECT-1', status: 'completed', amount: 1000 };
      buyerRepository.findByIdWithWallet.mockResolvedValue({ ...buyer, wallet: { ...buyer.wallet, transactions: [existing] } });

      const result = await topUpWalletService.topUpWallet(
        buyerId,
        { amount: 1000, bypassPaystack: true, paymentReference: 'DIRECT-1' },
        admin,
        'production'
      );

      expect(result.message).toBe('Payment already processed');
      expect(buyerRepository.updateWalletWithTransaction).not.toHaveBeenCalled();
    });

    it('completes a pending transaction by its own amount', async () => {
      const pending = { paymentReference: 'DIRECT-2', status: 'pending', amount: 1500 };
      buyerRepository.findByIdWithWallet.mockResolvedValue({ ...buyer, wallet: { ...buyer.wallet, transactions: [pending] } });
      buyerRepository.updateWalletTransactionStatus.mockResolvedValue({ ...buyer, wallet: { ...buyer.wallet, balance: 6500 } });

      const result = await topUpWalletService.topUpWallet(
        buyerId,
        { amount: 1500, bypassPaystack: true, paymentReference: 'DIRECT-2' },
        admin,
        'production'
      );

      expect(buyerRepository.updateWalletTransactionStatus).toHaveBeenCalledWith(buyerId, 'DIRECT-2', 'completed', 1500);
      expect(result.newBalance).toBe(6500);
    });

    it('throws NotFoundException when the buyer does not exist', async () => {
      buyerRepository.findByIdWithWallet.mockResolvedValue(null);
      await expect(
        topUpWalletService.topUpWallet(buyerId, { amount: 1000, bypassPaystack: true }, admin, 'production')
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('throws ValidationError when validation fails', async () => {
    topUpWalletValidator.validateTopUpWalletData.mockRejectedValue(new ValidationError([{ field: 'amount', message: 'bad' }]));
    await expect(
      topUpWalletService.topUpWallet(buyerId, { amount: -1 }, { isAdmin: false }, 'production')
    ).rejects.toThrow(ValidationError);
  });
});
