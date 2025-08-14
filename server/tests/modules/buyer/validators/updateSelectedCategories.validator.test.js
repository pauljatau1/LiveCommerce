const { validateUpdateSelectedCategoriesData } = require('@modules/buyer/validators/updateSelectedCategories.validator');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the validateXSS function
jest.mock('@utils/validator', () => ({
  validateXSS: jest.fn()
}));

// Import the mocked function
const { validateXSS } = require('@utils/validator');

describe('Update Selected Categories Validator', () => {
  beforeEach(() => {
    validateXSS.mockReturnValue(null);
  });

  describe('validateUpdateSelectedCategoriesData', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
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

      await expect(validateUpdateSelectedCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should pass validation with valid data without subCategories', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics'
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should pass validation with valid data with null subCategories', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: null
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should pass validation with valid data with undefined subCategories', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: undefined
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when buyerId is missing', async () => {
      const invalidData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError when buyerId is null', async () => {
      const invalidData = {
        buyerId: null,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
      });
    });

    it('should throw ValidationError when buyerId is not a string', async () => {
      const invalidData = {
        buyerId: 123,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
      });
    });

    it('should throw ValidationError when buyerId has invalid format', async () => {
      const invalidData = {
        buyerId: 'invalid-id',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
      });
    });

    it('should throw ValidationError for null data', async () => {
      await expect(validateUpdateSelectedCategoriesData(null)).rejects.toMatchObject({
        errors: [
          {
            field: 'data',
            message: 'Request data is required'
          }
        ]
      });
    });

    it('should throw ValidationError for undefined data', async () => {
      await expect(validateUpdateSelectedCategoriesData(undefined)).rejects.toMatchObject({
        errors: [
          {
            field: 'data',
            message: 'Request data is required'
          }
        ]
      });
    });

    it('should throw ValidationError for non-object data', async () => {
      await expect(validateUpdateSelectedCategoriesData('not an object')).rejects.toMatchObject({
        errors: [
          {
            field: 'data',
            message: 'Request data is required'
          }
        ]
      });
    });

    it('should throw ValidationError when selectedCategories is missing', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011'
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories',
            message: 'selectedCategories is required'
          }
        ]
      });
    });

    it('should throw ValidationError when selectedCategories is null', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: null
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories',
            message: 'selectedCategories is required'
          }
        ]
      });
    });

    it('should throw ValidationError when selectedCategories is not an array', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: 'not an array'
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories',
            message: 'selectedCategories must be an array'
          }
        ]
      });
    });

    it('should pass validation when selectedCategories is empty array', async () => {
      const validData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: []
      };
      await expect(validateUpdateSelectedCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError when too many categories', async () => {
      const tooManyCategories = Array.from({ length: 51 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: [{ name: 'Subcategory' }]
      }));

      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: tooManyCategories
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories',
            message: 'Cannot select more than 50 categories'
          }
        ]
      });
    });

    it('should throw ValidationError when category is not an object', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: ['not an object']
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0]',
            message: 'Category must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError when category name is missing', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].name',
            message: 'Category name is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when category name is not a string', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 123,
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].name',
            message: 'Category name is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when category name is empty', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: '',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].name',
            message: 'Category name cannot be empty'
          }
        ]
      });
    });

    it('should throw ValidationError when category name is too long', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'a'.repeat(101),
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].name',
            message: 'Category name must not exceed 100 characters'
          }
        ]
      });
    });

    it('should throw ValidationError when subCategories is not an array', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: 'not an array'
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories',
            message: 'Subcategories must be an array'
          }
        ]
      });
    });

    it('should throw ValidationError when too many subcategories', async () => {
      const tooManySubCategories = Array.from({ length: 21 }, (_, i) => ({
        name: `Subcategory ${i}`
      }));

      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: tooManySubCategories
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories',
            message: 'Cannot have more than 20 subcategories per category'
          }
        ]
      });
    });

    it('should throw ValidationError when subcategory is not an object', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: ['not an object']
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories[0]',
            message: 'Subcategory must be an object'
          }
        ]
      });
    });

    it('should throw ValidationError when subcategory name is missing', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{}]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories[0].name',
            message: 'Subcategory name is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when subcategory name is not a string', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 123 }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories[0].name',
            message: 'Subcategory name is required and must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when subcategory name is empty', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: '' }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories[0].name',
            message: 'Subcategory name cannot be empty'
          }
        ]
      });
    });

    it('should throw ValidationError when subcategory name is too long', async () => {
      const invalidData = {
        buyerId: '507f1f77bcf86cd799439011',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'a'.repeat(101) }]
          }
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'selectedCategories[0].subCategories[0].name',
            message: 'Subcategory name must not exceed 100 characters'
          }
        ]
      });
    });

    it('should accumulate multiple validation errors', async () => {
      const invalidData = {
        buyerId: 'invalid-id',
        selectedCategories: [
          {
            name: '',
            subCategories: [
              { name: '' },
              'not an object'
            ]
          },
          'not an object'
        ]
      };
      await expect(validateUpdateSelectedCategoriesData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing data', async () => {
        await expect(validateUpdateSelectedCategoriesData(null)).rejects.toMatchObject({
          errors: [{ field: 'data', message: 'Request data is required' }]
        });
      });

      it('should include specific error message for missing buyerId', async () => {
        await expect(validateUpdateSelectedCategoriesData({ selectedCategories: [] })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for invalid buyerId format', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: 'invalid-id', 
          selectedCategories: [{ name: 'Test' }] 
        })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });

      it('should include specific error message for missing selectedCategories', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: '507f1f77bcf86cd799439011' 
        })).rejects.toMatchObject({
          errors: [{ field: 'selectedCategories', message: 'selectedCategories is required' }]
        });
      });

      it('should include specific error message for empty selectedCategories', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: '507f1f77bcf86cd799439011',
          selectedCategories: []
        })).resolves.not.toThrow();
      });

      it('should include specific error message for missing category name', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: '507f1f77bcf86cd799439011',
          selectedCategories: [{ subCategories: [] }]
        })).rejects.toMatchObject({
          errors: [{ field: 'selectedCategories[0].name', message: 'Category name is required and must be a string' }]
        });
      });

      it('should include specific error message for empty category name', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: '507f1f77bcf86cd799439011',
          selectedCategories: [{ name: '', subCategories: [] }]
        })).rejects.toMatchObject({
          errors: [{ field: 'selectedCategories[0].name', message: 'Category name cannot be empty' }]
        });
      });

      it('should include specific error message for missing subcategory name', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: '507f1f77bcf86cd799439011',
          selectedCategories: [{ name: 'Test', subCategories: [{}] }]
        })).rejects.toMatchObject({
          errors: [{ field: 'selectedCategories[0].subCategories[0].name', message: 'Subcategory name is required and must be a string' }]
        });
      });

      it('should include specific error message for empty subcategory name', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: '507f1f77bcf86cd799439011',
          selectedCategories: [{ name: 'Test', subCategories: [{ name: '' }] }]
        })).rejects.toMatchObject({
          errors: [{ field: 'selectedCategories[0].subCategories[0].name', message: 'Subcategory name cannot be empty' }]
        });
      });

      it('should include multiple error messages for multiple validation failures', async () => {
        await expect(validateUpdateSelectedCategoriesData({ 
          buyerId: 'invalid-id',
          selectedCategories: [
            { name: '', subCategories: [{ name: '' }] }
          ]
        })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });
    });
  });
}); 