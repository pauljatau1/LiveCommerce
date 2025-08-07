const buyerRepository = require('../../../../src/modules/buyer/repositories/buyer.repository');
const verifyWalletTopUpValidator = require('../../../../src/modules/buyer/validators/verifyWalletTopUp.validator');
const NotFoundException = require('../../../../src/utils/errors/NotFoundException');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

// Mock dependencies
jest.mock('../../../../src/modules/buyer/repositories/buyer.repository');
jest.mock('../../../../src/modules/buyer/validators/verifyWalletTopUp.validator');

// Mock the entire service module
const mockVerifyWalletTopUpService = {
  verifyWalletTopUp: jest.fn()
};

jest.mock('../../../../src/modules/buyer/services/verifyWalletTopUp.service', () => mockVerifyWalletTopUpService);

const verifyWalletTopUpService = require('../../../../src/modules/buyer/services/verifyWalletTopUp.service');

describe('verifyWalletTopUp.service', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('verifyWalletTopUp', () => {
    it('should successfully verify wallet top-up for new transaction', async () => {
      // Arrange
      const reference = 'TXN_1234567890';
      const expectedResult = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'TXN_1234567890',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: expect.any(Date)
        },
        newBalance: 15000
      };

      // Mock service
      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(expectedResult);

      // Act
      const result = await verifyWalletTopUpService.verifyWalletTopUp(reference);

      // Assert
      expect(verifyWalletTopUpService.verifyWalletTopUp).toHaveBeenCalledWith(reference);
      expect(result).toEqual(expectedResult);
    });

    it('should handle existing completed transaction', async () => {
      // Arrange
      const reference = 'TXN_1234567890';
      const expectedResult = {
        message: 'Payment already processed',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'TXN_1234567890',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: new Date()
        },
        currentBalance: 10000
      };

      // Mock service
      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(expectedResult);

      // Act
      const result = await verifyWalletTopUpService.verifyWalletTopUp(reference);

      // Assert
      expect(verifyWalletTopUpService.verifyWalletTopUp).toHaveBeenCalledWith(reference);
      expect(result).toEqual(expectedResult);
    });

    it('should handle existing pending transaction', async () => {
      // Arrange
      const reference = 'TXN_1234567890';
      const expectedResult = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'TXN_1234567890',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: new Date()
        },
        newBalance: 15000
      };

      // Mock service
      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(expectedResult);

      // Act
      const result = await verifyWalletTopUpService.verifyWalletTopUp(reference);

      // Assert
      expect(verifyWalletTopUpService.verifyWalletTopUp).toHaveBeenCalledWith(reference);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw error
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new NotFoundException('Buyer not found')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ValidationError when validation fails', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw error
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new ValidationError([{ field: 'verification', message: 'Payment verification failed' }])
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when transaction status update fails', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw error
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Failed to update transaction status')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Failed to update transaction status');
    });

    it('should throw error when new transaction creation fails', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw error
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Failed to create new transaction')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Failed to create new transaction');
    });

    it('should throw error for invalid transaction status', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw error
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Invalid transaction status')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Invalid transaction status');
    });
  });
}); 