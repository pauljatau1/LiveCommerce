/**
 * Select Categories Validator Tests
 *
 * This test suite validates the selectCategories validator functionality.
 * It ensures comprehensive validation of category selection input data.
 *
 * Test Coverage:
 * - Valid category selection data
 * - Missing categories validation
 * - Invalid categories format validation
 * - Individual category structure validation
 * - Sub-categories validation
 * - Error message validation
 * - Edge cases and boundary conditions
 *
 * Security Testing:
 * - Input sanitization validation
 * - Structure validation to prevent injection
 * - Error message consistency
 * - Validation error collection
 *
 * @module selectCategoriesValidatorTests
 */

const { validateSelectCategoriesData } = require('@modules/seller/validators/selectCategories.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Select Categories Validator', () => {
  describe('validateSelectCategoriesData', () => {
    it('should validate valid category selection data', async () => {
      // Arrange
      const validData = {
        categories: [
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
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should validate valid ObjectId format successfully', async () => {
      // Arrange
      const validData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011', // Valid 24-character hex string
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing data', async () => {
      // Act & Assert
      await expect(validateSelectCategoriesData(null)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined data', async () => {
      // Act & Assert
      await expect(validateSelectCategoriesData(undefined)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing categories', async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null categories', async () => {
      // Arrange
      const invalidData = { categories: null };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-array categories', async () => {
      // Arrange
      const invalidData = { categories: 'not-an-array' };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty categories array', async () => {
      // Arrange
      const invalidData = { categories: [] };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for category without id', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for category with non-string id', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: 123,
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for category without name', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for category with non-string name', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 123,
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for category without subCategories', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics'
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for category with non-array subCategories', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            subCategories: 'not-an-array'
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for subCategory without name', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            subCategories: [{}]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for subCategory with non-string name', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            subCategories: [{ name: 123 }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-object category', async () => {
      // Arrange
      const invalidData = {
        categories: ['not-an-object']
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-object subCategory', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            subCategories: ['not-an-object']
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should collect multiple validation errors', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            // Missing id
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              {} // Missing name
            ]
          },
          'not-an-object'
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should validate specific error messages for missing categories', async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories',
              message: 'Categories are required'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for non-array categories', async () => {
      // Arrange
      const invalidData = { categories: 'not-an-array' };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories',
              message: 'Categories must be an array'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for empty categories array', async () => {
      // Arrange
      const invalidData = { categories: [] };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories',
              message: 'Categories array cannot be empty'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for missing category id', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].id',
              message: 'Category ID is required'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for invalid ObjectId format', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: 'invalid-object-id',
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].id',
              message: 'Category ID must be a valid MongoDB ObjectId'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for non-string category id', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: 123,
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].id',
              message: 'Category ID must be a string'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for missing category name', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            subCategories: [{ name: 'Smartphones' }]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].name',
              message: 'Category name is required'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for missing subCategories', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics'
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].subCategories',
              message: 'SubCategories are required'
            })
          ])
        );
      }
    });

    it('should validate specific error messages for missing subCategory name', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            subCategories: [{}]
          }
        ]
      };

      // Act & Assert
      await expect(validateSelectCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateSelectCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].subCategories[0].name',
              message: 'SubCategory name is required'
            })
          ])
        );
      }
    });
  });
});
