/**
 * Add Business Details Validator Tests
 *
 * This test suite validates the addBusinessDetails validator functionality.
 * It ensures that the validator properly validates business details data,
 * handles various input scenarios, and provides appropriate error messages.
 *
 * Test Coverage:
 * - Valid business details data
 * - Missing required fields
 * - Invalid data types
 * - Empty string values
 * - Field length validation
 * - Multiple validation errors
 * - Edge cases and boundary conditions
 *
 * @module addBusinessDetailsValidatorTests
 */

const { validateAddBusinessDetailsData } = require('@modules/seller/validators/addBusinessDetails.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Add Business Details Validator', () => {
  let validBusinessDetails;

  beforeEach(() => {
    // Valid business details data
    validBusinessDetails = {
      businessName: 'Tech Solutions Ltd',
      businessType: 'LLC',
      taxInformation: 'Tax ID: 123456789'
    };
  });

  describe('validateAddBusinessDetailsData', () => {
    it('should validate valid business details data', () => {
      // Act & Assert: Should not throw any error for valid data
      expect(() => validateAddBusinessDetailsData(validBusinessDetails)).not.toThrow();
    });

    it('should throw ValidationError when data is null', () => {
      // Act & Assert: Should throw ValidationError for null data
      expect(() => validateAddBusinessDetailsData(null))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'data', message: 'Business details data is required' }
          ]
        }));
    });

    it('should throw ValidationError when data is undefined', () => {
      // Act & Assert: Should throw ValidationError for undefined data
      expect(() => validateAddBusinessDetailsData(undefined))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'data', message: 'Business details data is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessName is missing', () => {
      // Arrange: Remove businessName from valid data
      const invalidData = { ...validBusinessDetails };
      delete invalidData.businessName;

      // Act & Assert: Should throw ValidationError for missing businessName
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessName is null', () => {
      // Arrange: Set businessName to null
      const invalidData = { ...validBusinessDetails, businessName: null };

      // Act & Assert: Should throw ValidationError for null businessName
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessName is undefined', () => {
      // Arrange: Set businessName to undefined
      const invalidData = { ...validBusinessDetails, businessName: undefined };

      // Act & Assert: Should throw ValidationError for undefined businessName
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessName is not a string', () => {
      // Arrange: Set businessName to non-string value
      const invalidData = { ...validBusinessDetails, businessName: 123 };

      // Act & Assert: Should throw ValidationError for non-string businessName
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name must be a string' }
          ]
        }));
    });

    it('should throw ValidationError when businessName is empty string', () => {
      // Arrange: Set businessName to empty string
      const invalidData = { ...validBusinessDetails, businessName: '' };

      // Act & Assert: Should throw ValidationError for empty businessName
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when businessName is only whitespace', () => {
      // Arrange: Set businessName to whitespace only
      const invalidData = { ...validBusinessDetails, businessName: '   ' };

      // Act & Assert: Should throw ValidationError for whitespace-only businessName
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name cannot be empty' }
          ]
        }));
    });

    it('should throw ValidationError when businessName exceeds maximum length', () => {
      // Arrange: Set businessName to exceed 200 characters
      const invalidData = { ...validBusinessDetails, businessName: 'a'.repeat(201) };

      // Act & Assert: Should throw ValidationError for businessName exceeding max length
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name must not exceed 200 characters' }
          ]
        }));
    });

    it('should validate businessName at maximum length', () => {
      // Arrange: Set businessName to exactly 200 characters
      const validData = { ...validBusinessDetails, businessName: 'a'.repeat(200) };

      // Act & Assert: Should not throw error for businessName at max length
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should throw ValidationError when businessType is missing', () => {
      // Arrange: Remove businessType from valid data
      const invalidData = { ...validBusinessDetails };
      delete invalidData.businessType;

      // Act & Assert: Should throw ValidationError for missing businessType
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessType', message: 'Business type is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessType is null', () => {
      // Arrange: Set businessType to null
      const invalidData = { ...validBusinessDetails, businessType: null };

      // Act & Assert: Should throw ValidationError for null businessType
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessType', message: 'Business type is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessType is undefined', () => {
      // Arrange: Set businessType to undefined
      const invalidData = { ...validBusinessDetails, businessType: undefined };

      // Act & Assert: Should throw ValidationError for undefined businessType
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessType', message: 'Business type is required' }
          ]
        }));
    });

    it('should throw ValidationError when businessType is not a string', () => {
      // Arrange: Set businessType to non-string value
      const invalidData = { ...validBusinessDetails, businessType: 123 };

      // Act & Assert: Should throw ValidationError for non-string businessType
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessType', message: 'Business type must be a string' }
          ]
        }));
    });

    it('should throw ValidationError when businessType is empty string', () => {
      // Arrange: Set businessType to empty string
      const invalidData = { ...validBusinessDetails, businessType: '' };

      // Act & Assert: Should throw ValidationError for empty businessType
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when businessType is only whitespace', () => {
      // Arrange: Set businessType to whitespace only
      const invalidData = { ...validBusinessDetails, businessType: '   ' };

      // Act & Assert: Should throw ValidationError for whitespace-only businessType
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessType', message: 'Business type cannot be empty' }
          ]
        }));
    });

    it('should throw ValidationError when businessType exceeds maximum length', () => {
      // Arrange: Set businessType to exceed 100 characters
      const invalidData = { ...validBusinessDetails, businessType: 'a'.repeat(101) };

      // Act & Assert: Should throw ValidationError for businessType exceeding max length
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessType', message: 'Business type must not exceed 100 characters' }
          ]
        }));
    });

    it('should validate businessType at maximum length', () => {
      // Arrange: Set businessType to exactly 100 characters
      const validData = { ...validBusinessDetails, businessType: 'a'.repeat(100) };

      // Act & Assert: Should not throw error for businessType at max length
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should throw ValidationError when taxInformation is missing', () => {
      // Arrange: Remove taxInformation from valid data
      const invalidData = { ...validBusinessDetails };
      delete invalidData.taxInformation;

      // Act & Assert: Should throw ValidationError for missing taxInformation
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when taxInformation is null', () => {
      // Arrange: Set taxInformation to null
      const invalidData = { ...validBusinessDetails, taxInformation: null };

      // Act & Assert: Should throw ValidationError for null taxInformation
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when taxInformation is undefined', () => {
      // Arrange: Set taxInformation to undefined
      const invalidData = { ...validBusinessDetails, taxInformation: undefined };

      // Act & Assert: Should throw ValidationError for undefined taxInformation
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when taxInformation is not a string', () => {
      // Arrange: Set taxInformation to non-string value
      const invalidData = { ...validBusinessDetails, taxInformation: 123 };

      // Act & Assert: Should throw ValidationError for non-string taxInformation
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'taxInformation', message: 'Tax information must be a string' }
          ]
        }));
    });

    it('should throw ValidationError when taxInformation is empty string', () => {
      // Arrange: Set taxInformation to empty string
      const invalidData = { ...validBusinessDetails, taxInformation: '' };

      // Act & Assert: Should throw ValidationError for empty taxInformation
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when taxInformation is only whitespace', () => {
      // Arrange: Set taxInformation to whitespace only
      const invalidData = { ...validBusinessDetails, taxInformation: '   ' };

      // Act & Assert: Should throw ValidationError for whitespace-only taxInformation
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'taxInformation', message: 'Tax information cannot be empty' }
          ]
        }));
    });

    it('should throw ValidationError when taxInformation exceeds maximum length', () => {
      // Arrange: Set taxInformation to exceed 500 characters
      const invalidData = { ...validBusinessDetails, taxInformation: 'a'.repeat(501) };

      // Act & Assert: Should throw ValidationError for taxInformation exceeding max length
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'taxInformation', message: 'Tax information must not exceed 500 characters' }
          ]
        }));
    });

    it('should validate taxInformation at maximum length', () => {
      // Arrange: Set taxInformation to exactly 500 characters
      const validData = { ...validBusinessDetails, taxInformation: 'a'.repeat(500) };

      // Act & Assert: Should not throw error for taxInformation at max length
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should throw ValidationError with multiple errors when multiple fields are invalid', () => {
      // Arrange: Set multiple fields to invalid values
      const invalidData = {
        businessName: '',
        businessType: 123,
        taxInformation: null
      };

      // Act & Assert: Should throw ValidationError with multiple errors
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with all required field errors when all fields are missing', () => {
      // Arrange: Create empty data object
      const invalidData = {};

      // Act & Assert: Should throw ValidationError with all required field errors
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' },
            { field: 'businessType', message: 'Business type is required' },
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should validate business details with special characters', () => {
      // Arrange: Set business details with special characters
      const validData = {
        businessName: 'Tech Solutions & Co. Ltd.',
        businessType: 'LLC (Limited Liability Company)',
        taxInformation: 'Tax ID: 123-456-789, VAT: 987654321'
      };

      // Act & Assert: Should not throw error for valid data with special characters
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should validate business details with numbers in business name', () => {
      // Arrange: Set business name with numbers
      const validData = {
        businessName: 'Tech Solutions 2024 Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789'
      };

      // Act & Assert: Should not throw error for valid data with numbers
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should validate business details with unicode characters', () => {
      // Arrange: Set business details with unicode characters
      const validData = {
        businessName: 'Tëch Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789'
      };

      // Act & Assert: Should not throw error for valid data with unicode characters
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should validate business details with leading and trailing whitespace', () => {
      // Arrange: Set business details with leading and trailing whitespace
      const validData = {
        businessName: '  Tech Solutions Ltd  ',
        businessType: '  LLC  ',
        taxInformation: '  Tax ID: 123456789  '
      };

      // Act & Assert: Should not throw error for valid data with whitespace
      expect(() => validateAddBusinessDetailsData(validData)).not.toThrow();
    });

    it('should throw ValidationError when data is an empty object', () => {
      // Arrange: Create empty object
      const invalidData = {};

      // Act & Assert: Should throw ValidationError for empty object
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' },
            { field: 'businessType', message: 'Business type is required' },
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when data is an array', () => {
      // Arrange: Set data to array
      const invalidData = [];

      // Act & Assert: Should throw ValidationError for array data
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' },
            { field: 'businessType', message: 'Business type is required' },
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when data is a string', () => {
      // Arrange: Set data to string
      const invalidData = 'invalid data';

      // Act & Assert: Should throw ValidationError for string data
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' },
            { field: 'businessType', message: 'Business type is required' },
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when data is a number', () => {
      // Arrange: Set data to number
      const invalidData = 123;

      // Act & Assert: Should throw ValidationError for number data
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' },
            { field: 'businessType', message: 'Business type is required' },
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });

    it('should throw ValidationError when data is a boolean', () => {
      // Arrange: Set data to boolean
      const invalidData = true;

      // Act & Assert: Should throw ValidationError for boolean data
      expect(() => validateAddBusinessDetailsData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessName', message: 'Business name is required' },
            { field: 'businessType', message: 'Business type is required' },
            { field: 'taxInformation', message: 'Tax information is required' }
          ]
        }));
    });
  });
});
