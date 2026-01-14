/**
 * Add Business Information Validator Tests
 *
 * This test suite validates the addBusinessInformation validator functionality.
 * It ensures that the validator properly validates business information data,
 * handles various input scenarios, and provides appropriate error messages.
 *
 * Test Coverage:
 * - Valid business information data
 * - Missing required fields
 * - Invalid data types
 * - Empty string values
 * - Field length validation
 * - Multiple validation errors
 * - Edge cases and boundary conditions
 * - Email format validation
 * - Phone number format validation
 * - Business address validation
 *
 * @module addBusinessInformationValidatorTests
 */

const { validateAddBusinessInformationData } = require('@modules/seller/validators/addBusinessInformation.validator');

describe('Add Business Information Validator', () => {
  let validBusinessInformation;

  beforeEach(() => {
    // Valid business information data
    validBusinessInformation = {
      businessEmail: 'business@techsolutions.com',
      businessNumber: '+2348012345678',
      businessAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '123 Business Street',
        addressLine2: 'Suite 100',
        zipCode: '100001'
      }
    };
  });

  describe('validateAddBusinessInformationData', () => {
    it('should validate valid business information data', () => {
      // Act & Assert: Should not throw any error for valid data
      expect(() => validateAddBusinessInformationData(validBusinessInformation)).not.toThrow();
    });

    it('should validate valid business information data without optional addressLine2', () => {
      // Arrange: Remove optional addressLine2
      const dataWithoutOptional = { ...validBusinessInformation };
      delete dataWithoutOptional.businessAddress.addressLine2;

      // Act & Assert: Should not throw any error for valid data without optional field
      expect(() => validateAddBusinessInformationData(dataWithoutOptional)).not.toThrow();
    });

    it('should throw error when businessEmail is missing', () => {
      // Arrange: Remove businessEmail
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessEmail;

      // Act & Assert: Should throw error for missing businessEmail
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessEmail', message: 'Business email is required' }
          ]
        }));
    });

    it('should throw error when businessEmail is empty string', () => {
      // Arrange: Set businessEmail to empty string
      const invalidData = { ...validBusinessInformation, businessEmail: '' };

      // Act & Assert: Should throw error for empty businessEmail
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessEmail', message: 'Business email is required' }
          ]
        }));
    });

    it('should throw error when businessEmail is invalid format', () => {
      // Arrange: Set businessEmail to invalid format
      const invalidData = { ...validBusinessInformation, businessEmail: 'invalid-email' };

      // Act & Assert: Should throw error for invalid businessEmail format
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessEmail', message: 'Business email must be a valid email format' }
          ]
        }));
    });

    it('should throw error when businessNumber is missing', () => {
      // Arrange: Remove businessNumber
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessNumber;

      // Act & Assert: Should throw error for missing businessNumber
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessNumber', message: 'Business number is required' }
          ]
        }));
    });

    it('should throw error when businessNumber is empty string', () => {
      // Arrange: Set businessNumber to empty string
      const invalidData = { ...validBusinessInformation, businessNumber: '' };

      // Act & Assert: Should throw error for empty businessNumber
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessNumber', message: 'Business number is required' }
          ]
        }));
    });

    it('should throw error when businessNumber is invalid format', () => {
      // Arrange: Set businessNumber to invalid format
      const invalidData = { ...validBusinessInformation, businessNumber: 'invalid-phone' };

      // Act & Assert: Should throw error for invalid businessNumber format
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessNumber', message: 'Business number must be a valid phone number format' }
          ]
        }));
    });

    it('should throw error when businessAddress is missing', () => {
      // Arrange: Remove businessAddress
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessAddress;

      // Act & Assert: Should throw error for missing businessAddress
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress', message: 'Business address is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.country is missing', () => {
      // Arrange: Remove country from businessAddress
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessAddress.country;

      // Act & Assert: Should throw error for missing country
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.country', message: 'Country is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.country is empty string', () => {
      // Arrange: Set country to empty string
      const invalidData = { ...validBusinessInformation };
      invalidData.businessAddress.country = '';

      // Act & Assert: Should throw error for empty country
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.country', message: 'Country is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.state is missing', () => {
      // Arrange: Remove state from businessAddress
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessAddress.state;

      // Act & Assert: Should throw error for missing state
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.state', message: 'State is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.state is empty string', () => {
      // Arrange: Set state to empty string
      const invalidData = { ...validBusinessInformation };
      invalidData.businessAddress.state = '';

      // Act & Assert: Should throw error for empty state
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.state', message: 'State is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.city is missing', () => {
      // Arrange: Remove city from businessAddress
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessAddress.city;

      // Act & Assert: Should throw error for missing city
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.city', message: 'City is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.city is empty string', () => {
      // Arrange: Set city to empty string
      const invalidData = { ...validBusinessInformation };
      invalidData.businessAddress.city = '';

      // Act & Assert: Should throw error for empty city
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.city', message: 'City is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.addressLine1 is missing', () => {
      // Arrange: Remove addressLine1 from businessAddress
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessAddress.addressLine1;

      // Act & Assert: Should throw error for missing addressLine1
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.addressLine1', message: 'Address line 1 is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.addressLine1 is empty string', () => {
      // Arrange: Set addressLine1 to empty string
      const invalidData = { ...validBusinessInformation };
      invalidData.businessAddress.addressLine1 = '';

      // Act & Assert: Should throw error for empty addressLine1
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.addressLine1', message: 'Address line 1 is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.addressLine2 is not a string', () => {
      // Arrange: Set addressLine2 to non-string value
      const invalidData = { ...validBusinessInformation };
      invalidData.businessAddress.addressLine2 = 123;

      // Act & Assert: Should throw error for non-string addressLine2
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.addressLine2', message: 'Address line 2 must be a string' }
          ]
        }));
    });

    it('should throw error when businessAddress.zipCode is missing', () => {
      // Arrange: Remove zipCode from businessAddress
      const invalidData = { ...validBusinessInformation };
      delete invalidData.businessAddress.zipCode;

      // Act & Assert: Should throw error for missing zipCode
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.zipCode', message: 'Zip code is required' }
          ]
        }));
    });

    it('should throw error when businessAddress.zipCode is empty string', () => {
      // Arrange: Set zipCode to empty string
      const invalidData = { ...validBusinessInformation };
      invalidData.businessAddress.zipCode = '';

      // Act & Assert: Should throw error for empty zipCode
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.zipCode', message: 'Zip code is required' }
          ]
        }));
    });

    it('should throw multiple errors when multiple fields are missing', () => {
      // Arrange: Remove multiple required fields
      const invalidData = {
        businessAddress: {
          city: 'Lagos'
        }
      };

      // Act & Assert: Should throw error with multiple validation errors
      expect(() => validateAddBusinessInformationData(invalidData))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            { field: 'businessEmail', message: 'Business email is required' },
            { field: 'businessNumber', message: 'Business number is required' },
            { field: 'businessAddress.country', message: 'Country is required' },
            { field: 'businessAddress.state', message: 'State is required' },
            { field: 'businessAddress.addressLine1', message: 'Address line 1 is required' },
            { field: 'businessAddress.zipCode', message: 'Zip code is required' }
          ])
        }));
    });

    it('should validate various valid email formats', () => {
      // Arrange: Test different valid email formats
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const testData = { ...validBusinessInformation, businessEmail: email };

        // Act & Assert: Should not throw error for valid email formats
        expect(() => validateAddBusinessInformationData(testData)).not.toThrow();
      });
    });

    it('should validate various valid phone number formats', () => {
      // Arrange: Test different valid phone number formats
      // These will be normalized before validation
      const validPhones = [
        '+2348012345678',      // International with +
        '2348012345678',       // International without +
        '08012345678',         // Local with leading 0
        '8012345678',          // Local without leading 0
        '+234 801 234 5678',   // International with spaces
        '0801-234-5678',       // Local with dashes
        '+234(801)2345678'     // International with parentheses
      ];

      validPhones.forEach(phone => {
        const testData = { ...validBusinessInformation, businessNumber: phone };

        // Act & Assert: Should not throw error for valid phone number formats
        expect(() => validateAddBusinessInformationData(testData)).not.toThrow();
      });
    });

    it('should throw error for invalid email formats', () => {
      // Arrange: Test different invalid email formats
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        'user@example.',
        'user name@example.com'
      ];

      invalidEmails.forEach(email => {
        const testData = { ...validBusinessInformation, businessEmail: email };

        // Act & Assert: Should throw error for invalid email formats
        expect(() => validateAddBusinessInformationData(testData))
          .toThrow(expect.objectContaining({
            errors: [
              { field: 'businessEmail', message: 'Business email must be a valid email format' }
            ]
          }));
      });
    });

    it('should throw error for invalid phone number formats', () => {
      // Arrange: Test different invalid phone number formats
      const invalidPhones = [
        'invalid-phone',       // Non-numeric
        'abc123',              // Mixed letters and numbers
        '+',                   // Just plus sign
        '123',                 // Too short (after normalization)
        '081',                 // Too short for Nigerian number
        '12345',               // Too short
        '00000000000',         // Invalid leading zeros
        '1234567',             // Less than 10 digits
        '12345678901234567'    // Too long
      ];

      invalidPhones.forEach(phone => {
        const testData = { ...validBusinessInformation, businessNumber: phone };

        // Act & Assert: Should throw error for invalid phone number formats
        expect(() => validateAddBusinessInformationData(testData))
          .toThrow(expect.objectContaining({
            errors: [
              { field: 'businessNumber', message: 'Business number must be a valid phone number format' }
            ]
          }));
      });
    });

    it('should handle null data gracefully', () => {
      // Act & Assert: Should throw error for null data
      expect(() => validateAddBusinessInformationData(null))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessEmail', message: 'Business email is required' },
            { field: 'businessNumber', message: 'Business number is required' },
            { field: 'businessAddress', message: 'Business address is required' }
          ]
        }));
    });

    it('should handle undefined data gracefully', () => {
      // Act & Assert: Should throw error for undefined data
      expect(() => validateAddBusinessInformationData(undefined))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessEmail', message: 'Business email is required' },
            { field: 'businessNumber', message: 'Business number is required' },
            { field: 'businessAddress', message: 'Business address is required' }
          ]
        }));
    });

    it('should handle empty object data gracefully', () => {
      // Act & Assert: Should throw error for empty object
      expect(() => validateAddBusinessInformationData({}))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessEmail', message: 'Business email is required' },
            { field: 'businessNumber', message: 'Business number is required' },
            { field: 'businessAddress', message: 'Business address is required' }
          ]
        }));
    });

    it('should handle businessAddress.addressLine2 as non-string', () => {
      const testData = {
        ...validBusinessInformation,
        businessAddress: {
          ...validBusinessInformation.businessAddress,
          addressLine2: 123 // Non-string value
        }
      };

      // Act & Assert: Should throw error for non-string addressLine2
      expect(() => validateAddBusinessInformationData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'businessAddress.addressLine2', message: 'Address line 2 must be a string' }
          ]
        }));
    });

    it('should handle businessAddress.addressLine2 as null', () => {
      const testData = {
        ...validBusinessInformation,
        businessAddress: {
          ...validBusinessInformation.businessAddress,
          addressLine2: null
        }
      };

      // Act & Assert: Should not throw error for null addressLine2 (optional field)
      expect(() => validateAddBusinessInformationData(testData)).not.toThrow();
    });

    it('should handle businessAddress.addressLine2 as undefined', () => {
      const testData = {
        ...validBusinessInformation,
        businessAddress: {
          ...validBusinessInformation.businessAddress,
          addressLine2: undefined
        }
      };

      // Act & Assert: Should not throw error for undefined addressLine2 (optional field)
      expect(() => validateAddBusinessInformationData(testData)).not.toThrow();
    });

    it('should handle businessAddress.addressLine2 as empty string', () => {
      const testData = {
        ...validBusinessInformation,
        businessAddress: {
          ...validBusinessInformation.businessAddress,
          addressLine2: ''
        }
      };

      // Act & Assert: Should not throw error for empty string addressLine2 (optional field)
      expect(() => validateAddBusinessInformationData(testData)).not.toThrow();
    });

    it('should handle businessAddress with all fields as empty strings', () => {
      const testData = {
        ...validBusinessInformation,
        businessAddress: {
          country: '',
          state: '',
          city: '',
          addressLine1: '',
          addressLine2: '',
          zipCode: ''
        }
      };

      // Act & Assert: Should throw error for all empty address fields
      expect(() => validateAddBusinessInformationData(testData))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            { field: 'businessAddress.country', message: 'Country is required' },
            { field: 'businessAddress.state', message: 'State is required' },
            { field: 'businessAddress.city', message: 'City is required' },
            { field: 'businessAddress.addressLine1', message: 'Address line 1 is required' },
            { field: 'businessAddress.zipCode', message: 'Zip code is required' }
          ])
        }));
    });

    it('should handle businessAddress with all fields as whitespace-only strings', () => {
      const testData = {
        ...validBusinessInformation,
        businessAddress: {
          country: '   ',
          state: '   ',
          city: '   ',
          addressLine1: '   ',
          addressLine2: '   ',
          zipCode: '   '
        }
      };

      // Act & Assert: Should throw error for all whitespace-only address fields
      expect(() => validateAddBusinessInformationData(testData))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            { field: 'businessAddress.country', message: 'Country is required' },
            { field: 'businessAddress.state', message: 'State is required' },
            { field: 'businessAddress.city', message: 'City is required' },
            { field: 'businessAddress.addressLine1', message: 'Address line 1 is required' },
            { field: 'businessAddress.zipCode', message: 'Zip code is required' }
          ])
        }));
    });
  });
});
