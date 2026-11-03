const topUpWalletService = require('@modules/buyer/services/topUpWallet.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const topUpWalletValidator = require('@modules/buyer/validators/topUpWallet.validator');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/topUpWallet.validator');

describe('topUpWallet.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('topUpWallet', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';
    const mockTopUpData = {
      amount: 1000,
      description: 'Wallet top up',
      bypassPaystack: false,
      paymentReference: 'PAY-1234567890-ABC123'
    };
    const mockUser = { isAdmin: false };
    const mockNodeEnv = 'production';

    const mockBuyer = {
      _id: mockBuyerId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      wallet: {
        balance: 5000,
        transactions: []
      }
    };

    it('should successfully top up wallet with new transaction', async () => {
      // Arrange
      const expectedTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: 'PAY-1234567890-ABC123',
        description: 'Wallet top up',
        status: 'completed',
        createdAt: expect.any(Date)
      };

      const expectedResponse = {
        message: 'Wallet topped up successfully',
        transaction: expectedTransaction,
        newBalance: 6000
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(mockBuyer);
      buyerRepository.updateWalletWithTransaction.mockResolvedValue({
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          balance: 6000
        }
      });

      // Act
      const result = await topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(topUpWalletValidator.validateTopUpWalletData).toHaveBeenCalledWith(mockTopUpData, mockUser, mockNodeEnv);
      expect(buyerRepository.findByIdWithWallet).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateWalletWithTransaction).toHaveBeenCalledWith(
        mockBuyerId,
        expect.objectContaining({
          type: 'credit',
          amount: 1000,
          paymentReference: 'PAY-1234567890-ABC123',
          description: 'Wallet top up',
          status: 'completed'
        }),
        6000
      );
    });

    it('should handle existing completed transaction', async () => {
      // Arrange
      const existingTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: 'PAY-1234567890-ABC123',
        description: 'Wallet top up',
        status: 'completed',
        createdAt: new Date()
      };

      const buyerWithExistingTransaction = {
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          transactions: [existingTransaction]
        }
      };

      const expectedResponse = {
        message: 'Payment already processed',
        transaction: existingTransaction,
        newBalance: 5000
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(buyerWithExistingTransaction);

      // Act
      const result = await topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(buyerRepository.updateWalletWithTransaction).not.toHaveBeenCalled();
    });

    it('should handle existing pending transaction', async () => {
      // Arrange
      const existingTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: 'PAY-1234567890-ABC123',
        description: 'Wallet top up',
        status: 'pending',
        createdAt: new Date()
      };

      const buyerWithPendingTransaction = {
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          transactions: [existingTransaction]
        }
      };

      const updatedBuyer = {
        ...buyerWithPendingTransaction,
        wallet: {
          ...buyerWithPendingTransaction.wallet,
          balance: 6000
        }
      };

      const expectedResponse = {
        message: 'Wallet topped up successfully',
        transaction: {
          ...existingTransaction,
          status: 'completed'
        },
        newBalance: 6000
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(buyerWithPendingTransaction);
      buyerRepository.updateWalletTransactionStatus.mockResolvedValue(updatedBuyer);

      // Act
      const result = await topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(buyerRepository.updateWalletTransactionStatus).toHaveBeenCalledWith(
        mockBuyerId,
        'PAY-1234567890-ABC123',
        'completed',
        6000
      );
    });

    it('should generate payment reference when not provided', async () => {
      // Arrange
      const topUpDataWithoutReference = {
        amount: 1000,
        description: 'Wallet top up',
        bypassPaystack: false
      };

      const expectedTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: expect.stringMatching(/^PAY-\d+-[A-Z0-9]+$/),
        description: 'Wallet top up',
        status: 'completed',
        createdAt: expect.any(Date)
      };

      const expectedResponse = {
        message: 'Wallet topped up successfully',
        transaction: expectedTransaction,
        newBalance: 6000
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(mockBuyer);
      buyerRepository.updateWalletWithTransaction.mockResolvedValue({
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          balance: 6000
        }
      });

      // Act
      const result = await topUpWalletService.topUpWallet(mockBuyerId, topUpDataWithoutReference, mockUser, mockNodeEnv);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.transaction.paymentReference).toMatch(/^PAY-\d+-[A-Z0-9]+$/);
    });

    it('should add "(Direct)" suffix for bypass transactions', async () => {
      // Arrange
      const bypassTopUpData = {
        ...mockTopUpData,
        bypassPaystack: true
      };

      const expectedTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: 'PAY-1234567890-ABC123',
        description: 'Wallet top up (Direct)',
        status: 'completed',
        createdAt: expect.any(Date)
      };

      const expectedResponse = {
        message: 'Wallet topped up successfully',
        transaction: expectedTransaction,
        newBalance: 6000
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(mockBuyer);
      buyerRepository.updateWalletWithTransaction.mockResolvedValue({
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          balance: 6000
        }
      });

      // Act
      const result = await topUpWalletService.topUpWallet(mockBuyerId, bypassTopUpData, mockUser, mockNodeEnv);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should throw ValidationError when validation fails', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'amount', message: 'Invalid amount. Amount must be greater than 0.' }
      ]);

      topUpWalletValidator.validateTopUpWalletData.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(null);

      // Act & Assert
      await expect(
        topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when updateWalletWithTransaction fails', async () => {
      // Arrange
      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(mockBuyer);
      buyerRepository.updateWalletWithTransaction.mockResolvedValue(null);

      // Act & Assert
      await expect(
        topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv)
      ).rejects.toThrow('Failed to update wallet with new transaction');
    });

    it('should throw error when updateWalletTransactionStatus fails', async () => {
      // Arrange
      const existingTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: 'PAY-1234567890-ABC123',
        description: 'Wallet top up',
        status: 'pending',
        createdAt: new Date()
      };

      const buyerWithPendingTransaction = {
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          transactions: [existingTransaction]
        }
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(buyerWithPendingTransaction);
      buyerRepository.updateWalletTransactionStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(
        topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv)
      ).rejects.toThrow('Failed to update transaction status');
    });

    it('should throw error for invalid transaction status', async () => {
      // Arrange
      const existingTransaction = {
        type: 'credit',
        amount: 1000,
        paymentReference: 'PAY-1234567890-ABC123',
        description: 'Wallet top up',
        status: 'failed',
        createdAt: new Date()
      };

      const buyerWithFailedTransaction = {
        ...mockBuyer,
        wallet: {
          ...mockBuyer.wallet,
          transactions: [existingTransaction]
        }
      };

      topUpWalletValidator.validateTopUpWalletData.mockResolvedValue();
      buyerRepository.findByIdWithWallet.mockResolvedValue(buyerWithFailedTransaction);

      // Act & Assert
      await expect(
        topUpWalletService.topUpWallet(mockBuyerId, mockTopUpData, mockUser, mockNodeEnv)
      ).rejects.toThrow('Invalid transaction status');
    });
  });
});
