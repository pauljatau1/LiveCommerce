const { toggleActivityStatus } = require('@modules/buyer/services/toggleActivityStatus.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('toggleActivityStatus.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleActivityStatus', () => {
    it('should toggle activity status from true to false', async () => {
      // Mock data
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const currentBuyer = { isActive: true };
      const updatedBuyer = { isActive: false };

      // Mock repository methods
      buyerRepository.getActivityStatus.mockResolvedValue(currentBuyer);
      buyerRepository.toggleActivityStatus.mockResolvedValue(updatedBuyer);

      // Execute service
      const result = await toggleActivityStatus(mockBuyerId);

      // Verify repository was called with correct parameters
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.toggleActivityStatus).toHaveBeenCalledWith(mockBuyerId, false);

      // Verify response structure
      expect(result).toEqual({
        isActive: false,
        message: 'Account successfully deactivated'
      });
    });

    it('should toggle activity status from false to true', async () => {
      // Mock data
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const currentBuyer = { isActive: false };
      const updatedBuyer = { isActive: true };

      // Mock repository methods
      buyerRepository.getActivityStatus.mockResolvedValue(currentBuyer);
      buyerRepository.toggleActivityStatus.mockResolvedValue(updatedBuyer);

      // Execute service
      const result = await toggleActivityStatus(mockBuyerId);

      // Verify repository was called with correct parameters
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.toggleActivityStatus).toHaveBeenCalledWith(mockBuyerId, true);

      // Verify response structure
      expect(result).toEqual({
        isActive: true,
        message: 'Account successfully activated'
      });
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';

      buyerRepository.getActivityStatus.mockResolvedValue(null);

      await expect(toggleActivityStatus(mockBuyerId)).rejects.toThrow(NotFoundException);
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.toggleActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid buyer ID', async () => {
      const invalidBuyerId = 'invalid-id';

      await expect(toggleActivityStatus(invalidBuyerId)).rejects.toThrow(ValidationError);
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
      expect(buyerRepository.toggleActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      await expect(toggleActivityStatus(null)).rejects.toThrow(ValidationError);
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
      expect(buyerRepository.toggleActivityStatus).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      await expect(toggleActivityStatus('')).rejects.toThrow(ValidationError);
      expect(buyerRepository.getActivityStatus).not.toHaveBeenCalled();
      expect(buyerRepository.toggleActivityStatus).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';
      
      buyerRepository.getActivityStatus.mockRejectedValue(new Error('Database error'));

      await expect(toggleActivityStatus(mockBuyerId)).rejects.toThrow('Database error');
      expect(buyerRepository.getActivityStatus).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.toggleActivityStatus).not.toHaveBeenCalled();
    });
  });
});
