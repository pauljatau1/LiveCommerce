const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const updateMajorCategoriesSelectionService = require('@modules/buyer/services/updateMajorCategoriesSelection.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

let mongoServer;

describe('updateMajorCategoriesSelection.service', () => {
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

  describe('updateMajorCategoriesSelection', () => {
    const buyerId = new mongoose.Types.ObjectId().toString();
    const majorCategoryIds = [
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString()
    ];

    const mockBuyer = {
      _id: buyerId,
      selectedCategories: [
        {
          name: 'Custom Category',
          subCategories: [
            { name: 'Custom Subcategory' }
          ]
        }
      ]
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
          name: 'Custom Category',
          subCategories: [
            { name: 'Custom Subcategory' }
          ]
        },
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ]
    };

    it('should successfully update major categories selection', async () => {
      // Mock repository responses
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findActiveMajorCategories.mockResolvedValue(mockMajorCategories);
      buyerRepository.findCategoriesByIds.mockResolvedValue(mockCategories);
      buyerRepository.updateBuyerSelectedCategories.mockResolvedValue(mockUpdatedBuyer);

      // Call the service
      const result = await updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds);

      // Verify repository functions were called with correct parameters
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findActiveMajorCategories).toHaveBeenCalledWith(majorCategoryIds);
      expect(buyerRepository.findCategoriesByIds).toHaveBeenCalled();
      expect(buyerRepository.updateBuyerSelectedCategories).toHaveBeenCalledWith(buyerId, expect.any(Array));

      // Verify the result
      expect(result).toEqual({
        selectedCategories: mockUpdatedBuyer.selectedCategories,
        majorCategorySelections: expect.any(Array),
        manualSelections: expect.any(Array)
      });
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      // Mock repository to return null (buyer not found)
      buyerRepository.findById.mockResolvedValue(null);

      // Call the service and expect NotFoundException
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);

      // Verify repository was called
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
    });

    it('should throw NotFoundException when no active major categories found', async () => {
      // Mock repository to return empty array for major categories
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findActiveMajorCategories.mockResolvedValue([]);

      // Call the service and expect NotFoundException
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);

      // Verify repository was called
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findActiveMajorCategories).toHaveBeenCalledWith(majorCategoryIds);
    });

    it('should throw ValidationError when buyerId is invalid', async () => {
      const invalidBuyerId = 'invalid-id';

      // Call the service and expect ValidationError
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(invalidBuyerId, majorCategoryIds)
      ).rejects.toThrow(ValidationError);

      // Verify repository was not called due to validation error
      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when majorCategoryIds is invalid', async () => {
      const invalidMajorCategoryIds = ['invalid-id'];

      // Call the service and expect ValidationError
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, invalidMajorCategoryIds)
      ).rejects.toThrow(ValidationError);

      // Verify repository was not called due to validation error
      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when majorCategoryIds array is empty', async () => {
      const emptyMajorCategoryIds = [];

      // Call the service and expect ValidationError
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, emptyMajorCategoryIds)
      ).rejects.toThrow(ValidationError);

      // Verify repository was not called due to validation error
      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when majorCategoryIds contains invalid ObjectIds', async () => {
      const invalidMajorCategoryIds = ['invalid-id', new mongoose.Types.ObjectId().toString()];

      // Call the service and expect ValidationError
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, invalidMajorCategoryIds)
      ).rejects.toThrow(ValidationError);

      // Verify repository was not called due to validation error
      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when majorCategoryIds contains non-string values', async () => {
      const invalidMajorCategoryIds = [123, new mongoose.Types.ObjectId().toString()];

      // Call the service and expect ValidationError
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, invalidMajorCategoryIds)
      ).rejects.toThrow(ValidationError);

      // Verify repository was not called due to validation error
      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw an error
      buyerRepository.findById.mockRejectedValue(new Error('Database error'));

      // Call the service and expect the error to be propagated
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds)
      ).rejects.toThrow('Database error');

      // Verify repository was called
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
    });

    it('should handle case with only major category selections and no manual selections', async () => {
      // Mock repository response with only major category selections
      const buyerWithNoManualSelections = {
        _id: buyerId,
        selectedCategories: []
      };

      buyerRepository.findById.mockResolvedValue(buyerWithNoManualSelections);
      buyerRepository.findActiveMajorCategories.mockResolvedValue(mockMajorCategories);
      buyerRepository.findCategoriesByIds.mockResolvedValue(mockCategories);
      buyerRepository.updateBuyerSelectedCategories.mockResolvedValue({
        ...buyerWithNoManualSelections,
        selectedCategories: mockCategories.map(cat => ({
          name: cat.name,
          subCategories: cat.subCategories.map(sub => ({ name: sub.name }))
        }))
      });

      // Call the service
      const result = await updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds);

      // Verify the result
      expect(result.manualSelections).toEqual([]);
      expect(result.majorCategorySelections).toHaveLength(1);
    });

    it('should handle case with only manual selections and no major category selections', async () => {
      // Mock repository response with only manual selections
      const buyerWithOnlyManualSelections = {
        _id: buyerId,
        selectedCategories: [
          {
            name: 'Custom Category',
            subCategories: [
              { name: 'Custom Subcategory' }
            ]
          }
        ]
      };

      buyerRepository.findById.mockResolvedValue(buyerWithOnlyManualSelections);
      buyerRepository.findActiveMajorCategories.mockResolvedValue([]);

      // Call the service and expect NotFoundException
      await expect(
        updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle case with empty selected categories', async () => {
      // Mock repository response with empty categories
      const buyerWithEmptyCategories = {
        _id: buyerId,
        selectedCategories: []
      };

      buyerRepository.findById.mockResolvedValue(buyerWithEmptyCategories);
      buyerRepository.findActiveMajorCategories.mockResolvedValue(mockMajorCategories);
      buyerRepository.findCategoriesByIds.mockResolvedValue(mockCategories);
      buyerRepository.updateBuyerSelectedCategories.mockResolvedValue({
        ...buyerWithEmptyCategories,
        selectedCategories: mockCategories.map(cat => ({
          name: cat.name,
          subCategories: cat.subCategories.map(sub => ({ name: sub.name }))
        }))
      });

      // Call the service
      const result = await updateMajorCategoriesSelectionService.updateMajorCategoriesSelection(buyerId, majorCategoryIds);

      // Verify the result
      expect(result.manualSelections).toEqual([]);
      expect(result.majorCategorySelections).toHaveLength(1);
    });
  });
});
