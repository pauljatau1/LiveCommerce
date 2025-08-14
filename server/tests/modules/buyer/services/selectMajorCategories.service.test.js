const selectMajorCategoriesService = require('@modules/buyer/services/selectMajorCategories.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');
const { ObjectId } = require('mongodb');

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('selectMajorCategories.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectMajorCategories', () => {
    const buyerId = new ObjectId().toString();
    const majorCategoryIds = [new ObjectId().toString(), new ObjectId().toString()];

    it('should successfully select major categories and return updated data', async () => {
      // Mock repository response
      const mockResult = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          },
          {
            name: 'Clothing',
            subCategories: [{ name: 'T-Shirts' }]
          }
        ],
        addedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      buyerRepository.selectMajorCategories.mockResolvedValue(mockResult);

      // Call the service
      const result = await selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds);

      // Verify repository was called with correct parameters
      expect(buyerRepository.selectMajorCategories).toHaveBeenCalledWith(buyerId, majorCategoryIds);

      // Verify the result
      expect(result).toEqual({
        selectedCategories: mockResult.selectedCategories,
        addedCategories: mockResult.addedCategories
      });
    });

    it('should throw ValidationError for null majorCategoryIds', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, null)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined majorCategoryIds', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, undefined)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-array majorCategoryIds', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, 'not an array')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty majorCategoryIds array', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, [])
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid ObjectIds in majorCategoryIds', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, ['invalid-id'])
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null buyerId', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(null, majorCategoryIds)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      buyerRepository.selectMajorCategories.mockResolvedValue(null);

      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no active major categories found', async () => {
      buyerRepository.selectMajorCategories.mockResolvedValue({
        error: 'No active major categories found with the provided IDs'
      });

      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle mixed valid and invalid ObjectIds', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, [new ObjectId().toString(), 'invalid-id'])
      ).rejects.toThrow(ValidationError);
    });

    it('should handle array with non-string values', async () => {
      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, [123, new ObjectId().toString()])
      ).rejects.toThrow(ValidationError);
    });
  });
});
