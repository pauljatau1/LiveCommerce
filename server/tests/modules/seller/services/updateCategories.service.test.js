/**
 * Update Categories Service Tests
 *
 * This test suite provides comprehensive testing for the updateCategories service.
 * It ensures all business logic scenarios are properly handled and database
 * operations are correctly performed.
 *
 * Test Coverage:
 * - Valid category update operations
 * - Seller not found scenarios
 * - Invalid category validation
 * - Database error handling
 * - Response formatting
 * - Error handling
 */

const updateCategoriesService = require('@modules/seller/services/updateCategories.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const Category = require('@models/Category');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@models/Category');

describe('Update Categories Service', () => {
  // Mock data
  const mockSeller = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    storeName: 'John\'s Store',
    categories: [],
    save: jest.fn()
  };

  const mockCategories = [
    {
      _id: '507f1f77bcf86cd799439011',
      name: 'Electronics'
    },
    {
      _id: '507f1f77bcf86cd799439012',
      name: 'Clothing'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCategories', () => {
    it('should update categories successfully', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        },
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Clothing',
          subCategories: [{ name: 'Men\'s Clothing' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue(mockCategories);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await updateCategoriesService.updateCategories(sellerId, categories);

      // Assert
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(Category.find).toHaveBeenCalledWith({ _id: { $in: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] } });
      expect(sellerRepository.saveSeller).toHaveBeenCalledWith(mockSeller);
      expect(result).toEqual({
        message: 'Categories updated successfully',
        seller: mockSeller
      });
    });

    it('should throw NotFoundException when seller not found', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(updateCategoriesService.updateCategories(sellerId, categories)).rejects.toThrow(NotFoundException);
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
    });

    it('should throw ValidationError for invalid category IDs', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        },
        {
          id: '507f1f77bcf86cd799439999', // Valid ObjectId but doesn't exist in database
          name: 'Invalid Category',
          subCategories: [{ name: 'Invalid SubCategory' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]); // Only one valid category

      // Act & Assert
      await expect(updateCategoriesService.updateCategories(sellerId, categories)).rejects.toThrow(ValidationError);
      
      try {
        await updateCategoriesService.updateCategories(sellerId, categories);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories',
              message: 'Invalid category IDs provided'
            })
          ])
        );
      }
    });

    it('should handle database error during seller lookup', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(updateCategoriesService.updateCategories(sellerId, categories)).rejects.toThrow('Database connection failed');
    });

    it('should handle database error during category validation', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockRejectedValue(new Error('Category database error'));

      // Act & Assert
      await expect(updateCategoriesService.updateCategories(sellerId, categories)).rejects.toThrow('Category database error');
    });

    it('should handle database error during seller save', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]); // Return only the first category
      sellerRepository.saveSeller = jest.fn().mockRejectedValue(new Error('Save operation failed'));

      // Act & Assert
      await expect(updateCategoriesService.updateCategories(sellerId, categories)).rejects.toThrow('Save operation failed');
    });

    it('should transform categories correctly for storage', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ];

      const expectedTransformedCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]); // Return only the first category
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      await updateCategoriesService.updateCategories(sellerId, categories);

      // Assert
      expect(mockSeller.categories).toEqual(expectedTransformedCategories);
    });

    it('should handle empty subCategories array', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: []
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]); // Return only the first category
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await updateCategoriesService.updateCategories(sellerId, categories);

      // Assert
      expect(result).toEqual({
        message: 'Categories updated successfully',
        seller: mockSeller
      });
      expect(mockSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
    });

    it('should handle single category update', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await updateCategoriesService.updateCategories(sellerId, categories);

      // Assert
      expect(result).toEqual({
        message: 'Categories updated successfully',
        seller: mockSeller
      });
      expect(Category.find).toHaveBeenCalledWith({ _id: { $in: ['507f1f77bcf86cd799439011'] } });
    });

    it('should handle multiple categories with multiple subCategories', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439011';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' },
            { name: 'Tablets' }
          ]
        },
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Clothing',
          subCategories: [
            { name: 'Men\'s Clothing' },
            { name: 'Women\'s Clothing' }
          ]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue(mockCategories);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await updateCategoriesService.updateCategories(sellerId, categories);

      // Assert
      expect(result).toEqual({
        message: 'Categories updated successfully',
        seller: mockSeller
      });
      expect(mockSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' },
            { name: 'Tablets' }
          ]
        },
        {
          name: 'Clothing',
          subCategories: [
            { name: 'Men\'s Clothing' },
            { name: 'Women\'s Clothing' }
          ]
        }
      ]);
    });
  });
});
