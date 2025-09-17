/**
 * Update Categories Validator Tests
 *
 * This test suite provides comprehensive testing for the updateCategories validator.
 * It ensures all validation scenarios are properly handled and error messages
 * are correctly formatted.
 *
 * Test Coverage:
 * - Valid data validation
 * - Invalid data structure validation
 * - Category validation
 * - SubCategory validation
 * - ObjectId validation
 * - Error message validation
 */

const { validateUpdateCategoriesData } = require('@modules/seller/validators/updateCategories.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Update Categories Validator', () => {
  describe('validateUpdateCategoriesData', () => {
    it('should validate valid category update data', async () => {
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
      await expect(validateUpdateCategoriesData(validData)).resolves.not.toThrow();
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
      await expect(validateUpdateCategoriesData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing data', async () => {
      // Act & Assert
      await expect(validateUpdateCategoriesData(null)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined data', async () => {
      // Act & Assert
      await expect(validateUpdateCategoriesData(undefined)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing categories', async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for null categories', async () => {
      // Arrange
      const invalidData = { categories: null };

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-array categories', async () => {
      // Arrange
      const invalidData = { categories: 'not-an-array' };

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty categories array', async () => {
      // Arrange
      const invalidData = { categories: [] };

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid category structure', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            // Missing required fields
            name: 'Electronics'
          }
        ]
      };

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-object category', async () => {
      // Arrange
      const invalidData = {
        categories: ['not-an-object']
      };

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should validate specific error messages for missing categories', async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
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

    it('should validate multiple validation errors at once', async () => {
      // Arrange
      const invalidData = {
        categories: [
          {
            // Missing id and name
            subCategories: [{ name: 'Smartphones' }]
          },
          {
            id: 'invalid-id',
            name: 'Clothing',
            subCategories: [{}] // Missing subCategory name
          }
        ]
      };

      // Act & Assert
      await expect(validateUpdateCategoriesData(invalidData)).rejects.toThrow(ValidationError);
      
      try {
        await validateUpdateCategoriesData(invalidData);
      } catch (error) {
        expect(error.errors).toHaveLength(4);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'categories[0].id',
              message: 'Category ID is required'
            }),
            expect.objectContaining({
              field: 'categories[0].name',
              message: 'Category name is required'
            }),
            expect.objectContaining({
              field: 'categories[1].id',
              message: 'Category ID must be a valid MongoDB ObjectId'
            }),
            expect.objectContaining({
              field: 'categories[1].subCategories[0].name',
              message: 'SubCategory name is required'
            })
          ])
        );
      }
    });
  });
});
