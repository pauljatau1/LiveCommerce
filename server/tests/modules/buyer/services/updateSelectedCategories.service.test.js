const updateSelectedCategoriesService = require('@modules/buyer/services/updateSelectedCategories.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the dependencies
jest.mock('@modules/buyer/repositories/buyer.repository', () => ({
  findById: jest.fn(),
  updateById: jest.fn()
}));

describe('updateSelectedCategoriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateSelectedCategories', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';
    const mockBuyer = {
      _id: mockBuyerId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      selectedCategories: []
    };

    const mockSelectedCategories = [
      {
        name: 'Electronics',
        subCategories: [
          { name: 'Smartphones' },
          { name: 'Laptops' }
        ]
      },
      {
        name: 'Fashion',
        subCategories: [
          { name: 'Men\'s Clothing' },
          { name: 'Women\'s Clothing' }
        ]
      }
    ];

    it('should update selected categories successfully with valid data', async () => {
      // Mock repository methods
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: mockSelectedCategories
      });

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: mockSelectedCategories
      });
      expect(result).toEqual({
        ...mockBuyer,
        selectedCategories: mockSelectedCategories
      });
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Mock repository to return null
      buyerRepository.findById.mockResolvedValue(null);

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow(NotFoundException);
      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow('Buyer not found');

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle empty categories array', async () => {
      // Mock repository methods
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: []
      });

      const emptyCategories = [];

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        emptyCategories
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: []
      });
      expect(result.selectedCategories).toEqual([]);
    });

    it('should handle categories with empty subcategories', async () => {
      // Mock repository methods
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: []
          }
        ]
      });

      const categoriesWithEmptySubs = [
        {
          name: 'Electronics',
          subCategories: []
        }
      ];

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        categoriesWithEmptySubs
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: categoriesWithEmptySubs
      });
      expect(result.selectedCategories).toEqual(categoriesWithEmptySubs);
    });

    it('should handle single category with single subcategory', async () => {
      // Mock repository methods
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' }
            ]
          }
        ]
      });

      const singleCategory = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ];

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        singleCategory
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: singleCategory
      });
      expect(result.selectedCategories).toEqual(singleCategory);
    });

    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      buyerRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow('Database connection failed');

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle update repository errors gracefully', async () => {
      // Mock repository methods
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockRejectedValue(new Error('Update failed'));

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow('Update failed');

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: mockSelectedCategories
      });
    });

    // Validation error tests
    it('should throw ValidationError when selectedCategories is null', async () => {
      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        null
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when selectedCategories is not an array', async () => {
      const invalidCategories = 'not-an-array';

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        invalidCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when too many categories are selected', async () => {
      const tooManyCategories = Array.from({ length: 51 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: []
      }));

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        tooManyCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when category name is missing', async () => {
      const invalidCategories = [
        {
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ];

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        invalidCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when category name is empty', async () => {
      const invalidCategories = [
        {
          name: '',
          subCategories: []
        }
      ];

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        invalidCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when category name is too long', async () => {
      const invalidCategories = [
        {
          name: 'A'.repeat(101),
          subCategories: []
        }
      ];

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        invalidCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when subcategory name is missing', async () => {
      const invalidCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { description: 'Smartphones' }
          ]
        }
      ];

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        invalidCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when too many subcategories per category', async () => {
      const invalidCategories = [
        {
          name: 'Electronics',
          subCategories: Array.from({ length: 21 }, (_, i) => ({
            name: `Subcategory ${i}`
          }))
        }
      ];

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        invalidCategories
      )).rejects.toThrow('Validation failed');
    });

    it('should handle null buyer ID', async () => {
      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        null, 
        mockSelectedCategories
      )).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle undefined buyer ID', async () => {
      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        undefined,
        mockSelectedCategories
      )).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle invalid buyer ID format', async () => {
      const invalidBuyerId = 'invalid-id-format';

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        invalidBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle null categories parameter', async () => {
      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        null
      )).rejects.toThrow('Validation failed');

      expect(buyerRepository.findById).not.toHaveBeenCalled();
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle undefined categories parameter', async () => {
      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        undefined
      )).rejects.toThrow('Validation failed');

      expect(buyerRepository.findById).not.toHaveBeenCalled();
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle categories with null subcategories', async () => {
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: []
          }
        ]
      });

      const categoriesWithNullSubs = [
        {
          name: 'Electronics',
          subCategories: null
        }
      ];

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        categoriesWithNullSubs
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: []
          }
        ]
      });
      expect(result.selectedCategories).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
    });

    it('should handle categories with undefined subcategories', async () => {
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: []
          }
        ]
      });

      const categoriesWithUndefinedSubs = [
        {
          name: 'Electronics',
          subCategories: undefined
        }
      ];

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        categoriesWithUndefinedSubs
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: []
          }
        ]
      });
      expect(result.selectedCategories).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
    });

    it('should handle categories with malformed subcategories', async () => {
      const categoriesWithMalformedSubs = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            'not-an-object',
            { name: 'Laptops' }
          ]
        }
      ];

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        categoriesWithMalformedSubs
      )).rejects.toThrow('Validation failed');

      expect(buyerRepository.findById).not.toHaveBeenCalled();
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle large category arrays', async () => {
      const largeCategories = Array.from({ length: 50 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: Array.from({ length: 10 }, (_, j) => ({
          name: `Subcategory ${i}-${j}`
        }))
      }));

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        selectedCategories: largeCategories
      });

      const result = await updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        largeCategories
      );

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: largeCategories
      });
      expect(result.selectedCategories).toEqual(largeCategories);
      expect(result.selectedCategories).toHaveLength(50);
      expect(result.selectedCategories[0].subCategories).toHaveLength(10);
    });

    it('should handle specific repository error types', async () => {
      const ValidationError = new Error('Validation failed');
      ValidationError.name = 'ValidationError';

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockRejectedValue(ValidationError);

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow('Validation failed');

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        selectedCategories: mockSelectedCategories
      });
    });

    it('should handle database connection timeout', async () => {
      const timeoutError = new Error('Database connection timeout');
      timeoutError.code = 'ETIMEDOUT';

      buyerRepository.findById.mockRejectedValue(timeoutError);

      await expect(updateSelectedCategoriesService.updateSelectedCategories(
        mockBuyerId, 
        mockSelectedCategories
      )).rejects.toThrow('Database connection timeout');

      expect(buyerRepository.findById).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('formatCategories', () => {
    it('should format categories correctly', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones', extraField: 'should-be-ignored' },
            { name: 'Laptops' }
          ]
        },
        {
          name: 'Fashion',
          subCategories: [
            { name: 'Men\'s Clothing' }
          ]
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        },
        {
          name: 'Fashion',
          subCategories: [
            { name: 'Men\'s Clothing' }
          ]
        }
      ]);
    });

    it('should handle empty categories array', () => {
      const result = updateSelectedCategoriesService.formatCategories([]);
      expect(result).toEqual([]);
    });

    it('should handle categories with empty subcategories', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: []
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
    });

    it('should handle single category with single subcategory', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ]);
    });

    it('should preserve only name field in subcategories', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { 
              name: 'Smartphones',
              id: 'should-be-ignored',
              description: 'should-be-ignored',
              count: 100
            }
          ]
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        }
      ]);
    });

    it('should handle null categories input', () => {
      const result = updateSelectedCategoriesService.formatCategories(null);
      expect(result).toEqual([]);
    });

    it('should handle undefined categories input', () => {
      const result = updateSelectedCategoriesService.formatCategories(undefined);
      expect(result).toEqual([]);
    });

    it('should handle categories with null subcategories', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: null
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
    });

    it('should handle categories with undefined subcategories', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: undefined
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: []
        }
      ]);
    });

    it('should handle malformed subcategory objects', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            'not-an-object',
            { name: 'Laptops' },
            null,
            undefined
          ]
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        }
      ]);
    });

    it('should handle subcategories without name field', () => {
      const inputCategories = [
        {
          name: 'Electronics',
          subCategories: [
            { description: 'Smartphones' },
            { name: 'Laptops' },
            { id: 123 }
          ]
        }
      ];

      const result = updateSelectedCategoriesService.formatCategories(inputCategories);

      expect(result).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Laptops' }
          ]
        }
      ]);
    });

    it('should handle large category arrays efficiently', () => {
      const largeCategories = Array.from({ length: 50 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: Array.from({ length: 20 }, (_, j) => ({
          name: `Subcategory ${i}-${j}`,
          extraField: 'should-be-ignored'
        }))
      }));

      const result = updateSelectedCategoriesService.formatCategories(largeCategories);

      expect(result).toHaveLength(50);
      expect(result[0].subCategories).toHaveLength(20);
      expect(result[0].subCategories[0]).toEqual({ name: 'Subcategory 0-0' });
      expect(result[49].subCategories[19]).toEqual({ name: 'Subcategory 49-19' });
    });
  });
}); 