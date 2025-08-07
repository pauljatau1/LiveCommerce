const { 
  validateUpdateSelectedCategoriesData,
  validateSelectedCategories,
  validateSelectedCategoriesStructure,
  validateCategory,
  validateSubCategory,
  validateCategoryName,
  validateSubCategoriesArray,
  validateSubCategoryName
} = require('@modules/buyer/validators/updateSelectedCategories.validator');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the validateXSS function
jest.mock('@utils/validator', () => ({
  validateXSS: jest.fn()
}));

// Import the mocked function
const { validateXSS } = require('@utils/validator');

describe('updateSelectedCategories.validator', () => {
  beforeEach(() => {
    validateXSS.mockReturnValue(null);
  });

  describe('validateUpdateSelectedCategoriesData', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
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
      await expect(validateUpdateSelectedCategoriesData('not-an-object')).rejects.toMatchObject({
        errors: [
          {
            field: 'data',
            message: 'Request data is required'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid data structure', async () => {
      const invalidData = {
        selectedCategories: 'not-an-array'
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
  });

  describe('validateSelectedCategoriesStructure', () => {
    it('should pass validation with valid categories array', () => {
      const validCategories = [
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
      ];

      const errors = validateSelectedCategoriesStructure(validCategories);
      expect(errors).toEqual([]);
    });

    it('should return error when selectedCategories is null', () => {
      const errors = validateSelectedCategoriesStructure(null);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'selectedCategories is required'
      });
    });

    it('should return error when selectedCategories is undefined', () => {
      const errors = validateSelectedCategoriesStructure(undefined);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'selectedCategories is required'
      });
    });

    it('should return error when selectedCategories is not an array', () => {
      const errors = validateSelectedCategoriesStructure('not-an-array');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'selectedCategories must be an array'
      });
    });

    it('should return error when too many categories are selected', () => {
      const tooManyCategories = Array.from({ length: 51 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: []
      }));

      const errors = validateSelectedCategoriesStructure(tooManyCategories);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'Cannot select more than 50 categories'
      });
    });

    it('should handle empty categories array', () => {
      const errors = validateSelectedCategoriesStructure([]);
      expect(errors).toEqual([]);
    });

    it('should handle maximum allowed categories', () => {
      const maxCategories = Array.from({ length: 50 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: []
      }));

      const errors = validateSelectedCategoriesStructure(maxCategories);
      expect(errors).toEqual([]);
    });
  });

  describe('validateSelectedCategories', () => {
    it('should pass validation with valid categories array', () => {
      const validCategories = [
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
      ];

      const errors = validateSelectedCategories(validCategories);
      expect(errors).toEqual([]);
    });

    it('should return structure errors when selectedCategories is null', () => {
      const errors = validateSelectedCategories(null);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'selectedCategories is required'
      });
    });

    it('should return structure errors when selectedCategories is not an array', () => {
      const errors = validateSelectedCategories('not-an-array');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'selectedCategories must be an array'
      });
    });

    it('should return structure errors when too many categories are selected', () => {
      const tooManyCategories = Array.from({ length: 51 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: []
      }));

      const errors = validateSelectedCategories(tooManyCategories);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories',
        message: 'Cannot select more than 50 categories'
      });
    });

    it('should validate each category in the array when structure is valid', () => {
      const categoriesWithInvalidCategory = [
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' }
          ]
        },
        'not-a-category-object' // Invalid category
      ];

      const errors = validateSelectedCategories(categoriesWithInvalidCategory);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[1]',
        message: 'Category must be an object'
      });
    });

    it('should handle empty categories array', () => {
      const errors = validateSelectedCategories([]);
      expect(errors).toEqual([]);
    });

    it('should handle maximum allowed categories', () => {
      const maxCategories = Array.from({ length: 50 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: []
      }));

      const errors = validateSelectedCategories(maxCategories);
      expect(errors).toEqual([]);
    });
  });

  describe('validateCategoryName', () => {
    it('should pass validation with valid category name', () => {
      const errors = validateCategoryName('Electronics', 'selectedCategories[0].name');
      expect(errors).toEqual([]);
    });

    it('should return error when category name is empty', () => {
      const errors = validateCategoryName('', 'selectedCategories[0].name');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].name',
        message: 'Category name cannot be empty'
      });
    });

    it('should return error when category name is too long', () => {
      const errors = validateCategoryName('A'.repeat(101), 'selectedCategories[0].name');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].name',
        message: 'Category name must not exceed 100 characters'
      });
    });

    it('should detect XSS patterns in category names', () => {
      validateXSS.mockReturnValue({
        field: 'selectedCategories[0].name',
        message: 'Invalid characters detected in selectedCategories[0].name'
      });
      
      const errors = validateCategoryName('<script>alert("xss")</script>', 'selectedCategories[0].name');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('selectedCategories[0].name');
      expect(errors[0].message).toBe('Invalid characters detected in selectedCategories[0].name');
    });
  });

  describe('validateSubCategoriesArray', () => {
    it('should pass validation with valid subcategories array', () => {
      const validSubCategories = [
        { name: 'Smartphones' },
        { name: 'Laptops' }
      ];

      const errors = validateSubCategoriesArray(validSubCategories, 0);
      expect(errors).toEqual([]);
    });

    it('should allow null subCategories', () => {
      const errors = validateSubCategoriesArray(null, 0);
      expect(errors).toEqual([]);
    });

    it('should allow undefined subCategories', () => {
      const errors = validateSubCategoriesArray(undefined, 0);
      expect(errors).toEqual([]);
    });

    it('should return error when subCategories is not an array', () => {
      const errors = validateSubCategoriesArray('not-an-array', 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories',
        message: 'Subcategories must be an array'
      });
    });

    it('should return error when too many subcategories', () => {
      const tooManySubCategories = Array.from({ length: 21 }, (_, i) => ({
        name: `Subcategory ${i}`
      }));

      const errors = validateSubCategoriesArray(tooManySubCategories, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories',
        message: 'Cannot have more than 20 subcategories per category'
      });
    });

    it('should validate each subcategory in the array', () => {
      const subCategoriesWithInvalidItem = [
        { name: 'Smartphones' },
        'not-a-subcategory-object' // Invalid subcategory
      ];

      const errors = validateSubCategoriesArray(subCategoriesWithInvalidItem, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[1]',
        message: 'Subcategory must be an object'
      });
    });

    it('should handle empty subcategories array', () => {
      const errors = validateSubCategoriesArray([], 0);
      expect(errors).toEqual([]);
    });

    it('should handle maximum allowed subcategories', () => {
      const maxSubCategories = Array.from({ length: 20 }, (_, i) => ({
        name: `Subcategory ${i}`
      }));

      const errors = validateSubCategoriesArray(maxSubCategories, 0);
      expect(errors).toEqual([]);
    });
  });

  describe('validateSubCategoryName', () => {
    it('should pass validation with valid subcategory name', () => {
      const errors = validateSubCategoryName('Smartphones', 'selectedCategories[0].subCategories[0].name');
      expect(errors).toEqual([]);
    });

    it('should return error when subcategory name is empty', () => {
      const errors = validateSubCategoryName('', 'selectedCategories[0].subCategories[0].name');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Subcategory name cannot be empty'
      });
    });

    it('should return error when subcategory name is too long', () => {
      const errors = validateSubCategoryName('A'.repeat(101), 'selectedCategories[0].subCategories[0].name');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Subcategory name must not exceed 100 characters'
      });
    });

    it('should detect XSS patterns in subcategory names', () => {
      validateXSS.mockReturnValue({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Invalid characters detected in selectedCategories[0].subCategories[0].name'
      });
      
      const errors = validateSubCategoryName('javascript:alert("xss")', 'selectedCategories[0].subCategories[0].name');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('selectedCategories[0].subCategories[0].name');
      expect(errors[0].message).toBe('Invalid characters detected in selectedCategories[0].subCategories[0].name');
    });
  });

  describe('validateCategory', () => {
    it('should pass validation with valid category', () => {
      const validCategory = {
        name: 'Electronics',
        subCategories: [
          { name: 'Smartphones' },
          { name: 'Laptops' }
        ]
      };

      const errors = validateCategory(validCategory, 0);
      expect(errors).toEqual([]);
    });

    it('should return error when category is not an object', () => {
      const errors = validateCategory('not-an-object', 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0]',
        message: 'Category must be an object'
      });
    });

    it('should return error when category is null', () => {
      const errors = validateCategory(null, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0]',
        message: 'Category must be an object'
      });
    });

    it('should return error when category name is missing', () => {
      const categoryWithoutName = {
        subCategories: [
          { name: 'Smartphones' }
        ]
      };

      const errors = validateCategory(categoryWithoutName, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].name',
        message: 'Category name is required and must be a string'
      });
    });

    it('should return error when category name is not a string', () => {
      const categoryWithInvalidName = {
        name: 123,
        subCategories: []
      };

      const errors = validateCategory(categoryWithInvalidName, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].name',
        message: 'Category name is required and must be a string'
      });
    });

    it('should return error when category name is empty', () => {
      const categoryWithEmptyName = {
        name: '',
        subCategories: []
      };

      const errors = validateCategory(categoryWithEmptyName, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].name',
        message: 'Category name cannot be empty'
      });
    });

    it('should return error when category name is too long', () => {
      const categoryWithLongName = {
        name: 'A'.repeat(101),
        subCategories: []
      };

      const errors = validateCategory(categoryWithLongName, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].name',
        message: 'Category name must not exceed 100 characters'
      });
    });

    it('should return error when subCategories is not an array', () => {
      const categoryWithInvalidSubCategories = {
        name: 'Electronics',
        subCategories: 'not-an-array'
      };

      const errors = validateCategory(categoryWithInvalidSubCategories, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories',
        message: 'Subcategories must be an array'
      });
    });

    it('should return error when too many subcategories', () => {
      const categoryWithTooManySubCategories = {
        name: 'Electronics',
        subCategories: Array.from({ length: 21 }, (_, i) => ({
          name: `Subcategory ${i}`
        }))
      };

      const errors = validateCategory(categoryWithTooManySubCategories, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories',
        message: 'Cannot have more than 20 subcategories per category'
      });
    });

    it('should allow null subCategories', () => {
      const categoryWithNullSubCategories = {
        name: 'Electronics',
        subCategories: null
      };

      const errors = validateCategory(categoryWithNullSubCategories, 0);
      expect(errors).toEqual([]);
    });

    it('should allow undefined subCategories', () => {
      const categoryWithUndefinedSubCategories = {
        name: 'Electronics',
        subCategories: undefined
      };

      const errors = validateCategory(categoryWithUndefinedSubCategories, 0);
      expect(errors).toEqual([]);
    });
  });

  describe('validateSubCategory', () => {
    it('should pass validation with valid subcategory', () => {
      const validSubCategory = {
        name: 'Smartphones'
      };

      const errors = validateSubCategory(validSubCategory, 0, 0);
      expect(errors).toEqual([]);
    });

    it('should return error when subcategory is not an object', () => {
      const errors = validateSubCategory('not-an-object', 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0]',
        message: 'Subcategory must be an object'
      });
    });

    it('should return error when subcategory is null', () => {
      const errors = validateSubCategory(null, 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0]',
        message: 'Subcategory must be an object'
      });
    });

    it('should return error when subcategory name is missing', () => {
      const subCategoryWithoutName = {
        description: 'Smartphones'
      };

      const errors = validateSubCategory(subCategoryWithoutName, 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Subcategory name is required and must be a string'
      });
    });

    it('should return error when subcategory name is not a string', () => {
      const subCategoryWithInvalidName = {
        name: 123
      };

      const errors = validateSubCategory(subCategoryWithInvalidName, 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Subcategory name is required and must be a string'
      });
    });

    it('should return error when subcategory name is empty', () => {
      const subCategoryWithEmptyName = {
        name: ''
      };

      const errors = validateSubCategory(subCategoryWithEmptyName, 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Subcategory name cannot be empty'
      });
    });

    it('should return error when subcategory name is too long', () => {
      const subCategoryWithLongName = {
        name: 'A'.repeat(101)
      };

      const errors = validateSubCategory(subCategoryWithLongName, 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Subcategory name must not exceed 100 characters'
      });
    });
  });

  describe('XSS Validation', () => {
    it('should detect XSS patterns in category names through validateCategory', () => {
      validateXSS.mockReturnValue({
        field: 'selectedCategories[0].name',
        message: 'Invalid characters detected in selectedCategories[0].name'
      });
      
      const categoryWithXSS = {
        name: '<script>alert("xss")</script>',
        subCategories: []
      };

      const errors = validateCategory(categoryWithXSS, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('selectedCategories[0].name');
      expect(errors[0].message).toBe('Invalid characters detected in selectedCategories[0].name');
    });

    it('should detect XSS patterns in subcategory names through validateSubCategory', () => {
      validateXSS.mockReturnValue({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Invalid characters detected in selectedCategories[0].subCategories[0].name'
      });
      
      const subCategoryWithXSS = {
        name: 'javascript:alert("xss")'
      };

      const errors = validateSubCategory(subCategoryWithXSS, 0, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('selectedCategories[0].subCategories[0].name');
      expect(errors[0].message).toBe('Invalid characters detected in selectedCategories[0].subCategories[0].name');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty categories array', () => {
      const errors = validateSelectedCategories([]);
      expect(errors).toEqual([]);
    });

    it('should handle category with empty subcategories array', () => {
      const categoryWithEmptySubCategories = {
        name: 'Electronics',
        subCategories: []
      };

      const errors = validateCategory(categoryWithEmptySubCategories, 0);
      expect(errors).toEqual([]);
    });

    it('should handle maximum allowed categories', () => {
      const maxCategories = Array.from({ length: 50 }, (_, i) => ({
        name: `Category ${i}`,
        subCategories: []
      }));

      const errors = validateSelectedCategories(maxCategories);
      expect(errors).toEqual([]);
    });

    it('should handle maximum allowed subcategories', () => {
      const categoryWithMaxSubCategories = {
        name: 'Electronics',
        subCategories: Array.from({ length: 20 }, (_, i) => ({
          name: `Subcategory ${i}`
        }))
      };

      const errors = validateCategory(categoryWithMaxSubCategories, 0);
      expect(errors).toEqual([]);
    });
  });

  describe('Specific Error Messages', () => {

    it('should include specific error message for missing selectedCategories', async () => {
      const invalidData = {
        // selectedCategories is missing
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'selectedCategories',
              message: 'selectedCategories is required'
            }
          ]
        });
    });

    it('should include specific error message for null selectedCategories', async () => {
      const invalidData = {
        selectedCategories: null
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'selectedCategories',
              message: 'selectedCategories is required'
            }
          ]
        });
    });

    it('should include specific error message for undefined selectedCategories', async () => {
      const invalidData = {
        selectedCategories: undefined
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'selectedCategories',
              message: 'selectedCategories is required'
            }
          ]
        });
    });

    it('should include specific error message for non-array selectedCategories', async () => {
      const invalidData = {
        selectedCategories: 'not-an-array'
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'selectedCategories',
              message: 'selectedCategories must be an array'
            }
          ]
        });
    });

    it('should include specific error message for too many categories', async () => {
      const invalidData = {
        selectedCategories: Array.from({ length: 51 }, (_, i) => ({
          name: `Category ${i}`,
          subCategories: []
        }))
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories',
              message: 'Cannot select more than 50 categories'
            }
          ])
        });
    });

    it('should include specific error message for category with XSS', async () => {
      validateXSS.mockReturnValue({
        field: 'selectedCategories[0].name',
        message: 'Invalid characters detected in selectedCategories[0].name'
      });

      const invalidData = {
        selectedCategories: [
          {
            name: '<script>alert("xss")</script>',
            subCategories: []
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].name',
              message: 'Invalid characters detected in selectedCategories[0].name'
            }
          ])
        });
    });

    it('should include specific error message for empty category name', async () => {
      const invalidData = {
        selectedCategories: [
          {
            name: '',
            subCategories: []
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].name',
              message: 'Category name cannot be empty'
            }
          ])
        });
    });

    it('should include specific error message for category name too long', async () => {
      const invalidData = {
        selectedCategories: [
          {
            name: 'A'.repeat(101),
            subCategories: []
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].name',
              message: 'Category name must not exceed 100 characters'
            }
          ])
        });
    });

    it('should include specific error message for subcategory with XSS', async () => {
      validateXSS.mockReturnValue({
        field: 'selectedCategories[0].subCategories[0].name',
        message: 'Invalid characters detected in selectedCategories[0].subCategories[0].name'
      });

      const invalidData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              {
                name: 'javascript:alert("xss")'
              }
            ]
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].subCategories[0].name',
              message: 'Invalid characters detected in selectedCategories[0].subCategories[0].name'
            }
          ])
        });
    });

    it('should include specific error message for empty subcategory name', async () => {
      const invalidData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              {
                name: ''
              }
            ]
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].subCategories[0].name',
              message: 'Subcategory name cannot be empty'
            }
          ])
        });
    });

    it('should include specific error message for subcategory name too long', async () => {
      const invalidData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              {
                name: 'A'.repeat(101)
              }
            ]
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].subCategories[0].name',
              message: 'Subcategory name must not exceed 100 characters'
            }
          ])
        });
    });

    it('should include multiple error messages for multiple validation failures', async () => {
      const invalidData = {
        selectedCategories: [
          {
            name: '',
            subCategories: [
              {
                name: 'A'.repeat(101)
              }
            ]
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(invalidData))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'selectedCategories[0].name',
              message: 'Category name cannot be empty'
            },
            {
              field: 'selectedCategories[0].subCategories[0].name',
              message: 'Subcategory name must not exceed 100 characters'
            }
          ])
        });
    });

    it('should not throw error for valid data', async () => {
      const validData = {
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              {
                name: 'Smartphones'
              }
            ]
          }
        ]
      };

      await expect(validateUpdateSelectedCategoriesData(validData))
        .resolves.not.toThrow();
    });

    it('should not throw error for empty categories array', async () => {
      const validData = {
        selectedCategories: []
      };

      await expect(validateUpdateSelectedCategoriesData(validData))
        .resolves.not.toThrow();
    });
  });
}); 