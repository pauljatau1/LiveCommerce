const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const selectMajorCategoriesService = require('@modules/buyer/services/selectMajorCategories.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const majorCategoryRepository = require('@modules/buyer/repositories/majorCategory.repository');
const categoryRepository = require('@modules/buyer/repositories/category.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the repositories
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/repositories/majorCategory.repository');
jest.mock('@modules/buyer/repositories/category.repository');

let mongoServer;

describe('selectMajorCategories.service', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectMajorCategories', () => {
    const buyerId = new mongoose.Types.ObjectId().toString();
    const majorCategoryIds = [
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString()
    ];

    const mockBuyer = {
      _id: buyerId,
      selectedCategories: []
    };

    const mockMajorCategories = [
      {
        _id: majorCategoryIds[0],
        categories: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          }
        ]
      }
    ];

    const mockCategories = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Electronics',
        subCategories: [
          { name: 'Smartphones' },
          { name: 'Laptops' }
        ]
      }
    ];

    const mockUpdatedBuyer = {
      _id: buyerId,
      selectedCategories: [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ]
    };

    it('should successfully select major categories and return updated data', async () => {
      // Mock repository responses
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      majorCategoryRepository.findActiveMajorCategories.mockResolvedValue(mockMajorCategories);
      categoryRepository.findCategoriesByIds.mockResolvedValue(mockCategories);
      buyerRepository.updateBuyerSelectedCategories.mockResolvedValue(mockUpdatedBuyer);

      // Call the service
      const result = await selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds);

      // Verify repository functions were called with correct parameters
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(majorCategoryRepository.findActiveMajorCategories).toHaveBeenCalledWith(majorCategoryIds);
      expect(categoryRepository.findCategoriesByIds).toHaveBeenCalled();
      expect(buyerRepository.updateBuyerSelectedCategories).toHaveBeenCalledWith(buyerId, expect.any(Array));

      // Verify the result
      expect(result).toEqual({
        selectedCategories: mockUpdatedBuyer.selectedCategories,
        addedCategories: expect.any(Array)
      });
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      buyerRepository.findById.mockResolvedValue(null);

      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);

      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
    });

    it('should throw NotFoundException when no active major categories found', async () => {
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      majorCategoryRepository.findActiveMajorCategories.mockResolvedValue([]);

      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);

      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(majorCategoryRepository.findActiveMajorCategories).toHaveBeenCalledWith(majorCategoryIds);
    });

    it('should handle validation errors', async () => {
      const invalidBuyerId = 'invalid-id';

      await expect(
        selectMajorCategoriesService.selectMajorCategories(invalidBuyerId, majorCategoryIds)
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      buyerRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(
        selectMajorCategoriesService.selectMajorCategories(buyerId, majorCategoryIds)
      ).rejects.toThrow('Database error');

      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
    });
  });
});
