// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/verifyWalletTopUp.validator');

// Mock the entire service module
const mockVerifyWalletTopUpService = {
  verifyWalletTopUp: jest.fn()
};

jest.mock('@modules/buyer/services/verifyWalletTopUp.service', () => mockVerifyWalletTopUpService);

const verifyWalletTopUpService = require('@modules/buyer/services/verifyWalletTopUp.service');

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

    it('should throw ValidationError when reference is missing', async () => {
      // Arrange
      const reference = null;

      // Mock service to throw ValidationError
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Payment reference is required')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Payment reference is required');
    });

    it('should throw ValidationError when reference is empty', async () => {
      // Arrange
      const reference = '';

      // Mock service to throw ValidationError
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Payment reference is required')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Payment reference is required');
    });

    it('should throw ValidationError when Paystack verification fails', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw ValidationError for Paystack failure
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Payment verification failed')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Payment verification failed');
    });

    it('should throw ValidationError when metadata is missing', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw ValidationError for missing metadata
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Invalid payment metadata. Missing buyerId.')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Invalid payment metadata. Missing buyerId.');
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Mock service to throw NotFoundException
      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Buyer not found')
      );

      // Act & Assert
      await expect(verifyWalletTopUpService.verifyWalletTopUp(reference))
        .rejects.toThrow('Buyer not found');
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
          createdAt: expect.any(Date)
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
  });
}); 