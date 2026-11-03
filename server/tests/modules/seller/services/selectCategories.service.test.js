/**
 * Select Categories Service Tests
 *
 * This test suite validates the selectCategories service functionality.
 * It ensures comprehensive testing of category selection business logic.
 *
 * Test Coverage:
 * - Successful category selection
 * - Input validation error handling
 * - Seller not found error handling
 * - Invalid category validation
 * - Database operation error handling
 * - Response formatting validation
 * - Edge cases and boundary conditions
 *
 * Security Testing:
 * - Input validation before processing
 * - Database integrity checks
 * - Error handling without information leakage
 * - Response structure validation
 *
 * @module selectCategoriesServiceTests
 */

const selectCategoriesService = require('@modules/seller/services/selectCategories.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const Category = require('@models/Category');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the seller repository
jest.mock('@modules/seller/repositories/seller.repository');

// Mock the Category model
jest.mock('@models/Category');

describe('Select Categories Service', () => {
  let mockSeller;
  let mockCategories;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSeller = {
      _id: 'seller123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'seller@example.com',
      storeName: 'John\'s Store',
      categories: [],
      save: jest.fn().mockResolvedValue(true)
    };

    mockCategories = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Electronics',
        subCategories: [
          { name: 'Smartphones' },
          { name: 'Laptops' }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Clothing',
        subCategories: [
          { name: 'Men\'s Clothing' },
          { name: 'Women\'s Clothing' }
        ]
      }
    ];
  });

  describe('selectCategories', () => {
    it('should successfully select categories for seller', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
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
      const result = await selectCategoriesService.selectCategories(sellerId, categories);

      // Assert
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(Category.find).toHaveBeenCalledWith({ _id: { $in: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] } });
      expect(mockSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
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
      expect(sellerRepository.saveSeller).toHaveBeenCalledWith(mockSeller);
      expect(result).toEqual({
        message: 'Categories selected successfully',
        seller: mockSeller
      });
    });

    it('should throw ValidationError for missing categories', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = null;

      // Act & Assert
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty categories array', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = [];

      // Act & Assert
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid category structure', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = [
        {
          // Missing id
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      // Act & Assert
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundException when seller is not found', async () => {
      // Arrange
      const sellerId = 'nonexistent';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow(NotFoundException);
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
    });

    it('should throw ValidationError for invalid category IDs', async () => {
      // Arrange
      const sellerId = 'seller123';
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
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow(ValidationError);
      
      try {
        await selectCategoriesService.selectCategories(sellerId, categories);
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
      const sellerId = 'seller123';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow('Database connection failed');
    });

    it('should handle database error during category validation', async () => {
      // Arrange
      const sellerId = 'seller123';
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
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow('Category database error');
    });

    it('should handle database error during seller save', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]);
      sellerRepository.saveSeller = jest.fn().mockRejectedValue(new Error('Save operation failed'));

      // Act & Assert
      await expect(selectCategoriesService.selectCategories(sellerId, categories)).rejects.toThrow('Save operation failed');
    });

    it('should handle single category selection', async () => {
      // Arrange
      const sellerId = 'seller123';
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

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await selectCategoriesService.selectCategories(sellerId, categories);

      // Assert
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(Category.find).toHaveBeenCalledWith({ _id: { $in: ['507f1f77bcf86cd799439011'] } });
      expect(mockSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ]);
      expect(sellerRepository.saveSeller).toHaveBeenCalledWith(mockSeller);
      expect(result).toEqual({
        message: 'Categories selected successfully',
        seller: mockSeller
      });
    });

    it('should handle category with empty subCategories', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: []
        }
      ];

      const mockCategoryWithEmptySubs = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Electronics',
        subCategories: []
      };

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategoryWithEmptySubs]);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await selectCategoriesService.selectCategories(sellerId, categories);

      // Assert
      expect(mockSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
      expect(result).toEqual({
        message: 'Categories selected successfully',
        seller: mockSeller
      });
    });

    it('should handle category with single subCategory', async () => {
      // Arrange
      const sellerId = 'seller123';
      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ];

      const mockCategoryWithSingleSub = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Electronics',
        subCategories: [
          { name: 'Smartphones' }
        ]
      };

      sellerRepository.findById = jest.fn().mockResolvedValue(mockSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategoryWithSingleSub]);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(mockSeller);

      // Act
      const result = await selectCategoriesService.selectCategories(sellerId, categories);

      // Assert
      expect(mockSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ]);
      expect(result).toEqual({
        message: 'Categories selected successfully',
        seller: mockSeller
      });
    });

    it('should preserve existing seller data when updating categories', async () => {
      // Arrange
      const sellerId = 'seller123';
      const existingSeller = {
        _id: 'seller123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@example.com',
        storeName: 'John\'s Store',
        phoneNumber: '+1234567890',
        categories: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const categories = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ];

      sellerRepository.findById = jest.fn().mockResolvedValue(existingSeller);
      Category.find = jest.fn().mockResolvedValue([mockCategories[0]]);
      sellerRepository.saveSeller = jest.fn().mockResolvedValue(existingSeller);

      // Act
      const result = await selectCategoriesService.selectCategories(sellerId, categories);

      // Assert
      expect(existingSeller.firstName).toBe('John');
      expect(existingSeller.lastName).toBe('Doe');
      expect(existingSeller.email).toBe('seller@example.com');
      expect(existingSeller.storeName).toBe('John\'s Store');
      expect(existingSeller.phoneNumber).toBe('+1234567890');
      expect(existingSeller.categories).toEqual([
        {
          name: 'Electronics',
          subCategories: [{ name: 'Smartphones' }]
        }
      ]);
      expect(result.seller).toBe(existingSeller);
    });
  });
});
