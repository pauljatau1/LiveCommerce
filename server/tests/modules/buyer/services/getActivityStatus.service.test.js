const getActivityStatusService = require('@modules/buyer/services/getActivityStatus.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('getActivityStatus.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActivityStatus', () => {
    it('should return activity status when buyer exists', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = { isActive: true };
      buyerRepository.getActivityStatus.mockResolvedValue(mockBuyer);

      // Act
      const result = await getActivityStatusService.getActivityStatus(buyerId);

      // Assert
      expect(result).toEqual({ isActive: true });
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(buyerId);
    });

    it('should return false when buyer is inactive', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = { isActive: false };
      buyerRepository.getActivityStatus.mockResolvedValue(mockBuyer);

      // Act
      const result = await getActivityStatusService.getActivityStatus(buyerId);

      // Assert
      expect(result).toEqual({ isActive: false });
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(buyerId);
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      buyerRepository.getActivityStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(buyerId))
        .rejects
        .toThrow(NotFoundException);
      
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(buyerId);
    });

    it('should throw ValidationError for invalid buyer ID', async () => {
      // Arrange
      const invalidBuyerId = 'invalid-id';

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(invalidBuyerId))
        .rejects
        .toThrow(ValidationError);
      
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for empty buyer ID', async () => {
      // Arrange
      const emptyBuyerId = '';

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(emptyBuyerId))
        .rejects
        .toThrow(ValidationError);
      
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for null buyer ID', async () => {
      // Arrange
      const nullBuyerId = null;

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(nullBuyerId))
        .rejects
        .toThrow(ValidationError);
      
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for undefined buyer ID', async () => {
      // Arrange
      const undefinedBuyerId = undefined;

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(undefinedBuyerId))
        .rejects
        .toThrow(ValidationError);
      
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for non-string buyer ID', async () => {
      // Arrange
      const nonStringBuyerId = 123;

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(nonStringBuyerId))
        .rejects
        .toThrow(ValidationError);
      
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const buyerId = '507f1f77bcf86cd799439011';
      buyerRepository.getActivityStatus.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(getActivityStatusService.getActivityStatus(buyerId))
        .rejects
        .toThrow('Database error');
      
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(buyerId);
    });
  });
});
