/**
 * Add Shipping Warehouse Validator Tests
 *
 * This test suite validates the addShippingWarehouse validator functionality.
 * It ensures that the validator properly validates shipping and warehouse information data,
 * handles various input scenarios, and provides appropriate error messages.
 *
 * Test Coverage:
 * - Valid shipping and warehouse information data
 * - Invalid data types
 * - Empty object values
 * - Field type validation
 * - Multiple validation errors
 * - Edge cases and boundary conditions
 * - Optional field validation
 * - Nested object validation
 *
 * @module addShippingWarehouseValidatorTests
 */

const { validateAddShippingWarehouseData } = require('@modules/seller/validators/addShippingWarehouse.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Add Shipping Warehouse Validator', () => {
  let validShippingWarehouseData;

  beforeEach(() => {
    // Valid shipping and warehouse information data
    validShippingWarehouseData = {
      shippingOptions: {
        shippingMethod: 'Standard Shipping',
        returnsAndExchangePolicy: '30-day return policy'
      },
      warehouseDetails: {
        name: 'Main Warehouse',
        contactNumber: '+2348012345678',
        address: {
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Warehouse Street',
          addressLine2: 'Building A',
          zipCode: '100001'
        }
      }
    };
  });

  describe('validateAddShippingWarehouseData', () => {
    it('should validate valid shipping and warehouse information data', () => {
      // Act & Assert: Should not throw any error for valid data
      expect(() => validateAddShippingWarehouseData(validShippingWarehouseData)).not.toThrow();
    });

    it('should validate valid data with only shipping options', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: 'Express Shipping',
          returnsAndExchangePolicy: '14-day return policy'
        }
      };

      // Act & Assert: Should not throw any error for valid shipping options only
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with only warehouse details', () => {
      const testData = {
        warehouseDetails: {
          name: 'Secondary Warehouse',
          contactNumber: '+2348098765432',
          address: {
            country: 'Nigeria',
            state: 'Abuja',
            city: 'Abuja',
            addressLine1: '456 Storage Avenue',
            zipCode: '900001'
          }
        }
      };

      // Act & Assert: Should not throw any error for valid warehouse details only
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate empty object data', () => {
      // Act & Assert: Should not throw any error for empty object (all fields optional)
      expect(() => validateAddShippingWarehouseData({})).not.toThrow();
    });

    it('should validate null data', () => {
      // Act & Assert: Should not throw any error for null data (all fields optional)
      expect(() => validateAddShippingWarehouseData(null)).not.toThrow();
    });

    it('should validate undefined data', () => {
      // Act & Assert: Should not throw any error for undefined data (all fields optional)
      expect(() => validateAddShippingWarehouseData(undefined)).not.toThrow();
    });

    it('should throw error when shippingOptions is not an object', () => {
      const testData = {
        shippingOptions: 'invalid'
      };

      // Act & Assert: Should throw error for non-object shippingOptions
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'shippingOptions', message: 'Shipping options must be an object' }
          ]
        }));
    });

    it('should allow null shippingOptions', () => {
      const testData = {
        shippingOptions: null
      };

      // Act & Assert: Should not throw error for null shippingOptions (optional field)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should throw error when shippingMethod is not a string', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: 123
        }
      };

      // Act & Assert: Should throw error for non-string shippingMethod
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'shippingOptions.shippingMethod', message: 'Shipping method must be a string' }
          ]
        }));
    });

    it('should throw error when returnsAndExchangePolicy is not a string', () => {
      const testData = {
        shippingOptions: {
          returnsAndExchangePolicy: 456
        }
      };

      // Act & Assert: Should throw error for non-string returnsAndExchangePolicy
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'shippingOptions.returnsAndExchangePolicy', message: 'Returns and exchange policy must be a string' }
          ]
        }));
    });

    it('should throw error when warehouseDetails is not an object', () => {
      const testData = {
        warehouseDetails: 'invalid'
      };

      // Act & Assert: Should throw error for non-object warehouseDetails
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails', message: 'Warehouse details must be an object' }
          ]
        }));
    });

    it('should allow null warehouseDetails', () => {
      const testData = {
        warehouseDetails: null
      };

      // Act & Assert: Should not throw error for null warehouseDetails (optional field)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should throw error when warehouse name is not a string', () => {
      const testData = {
        warehouseDetails: {
          name: 789
        }
      };

      // Act & Assert: Should throw error for non-string warehouse name
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.name', message: 'Warehouse name must be a string' }
          ]
        }));
    });

    it('should throw error when contact number is not a string', () => {
      const testData = {
        warehouseDetails: {
          contactNumber: 101112
        }
      };

      // Act & Assert: Should throw error for non-string contact number
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.contactNumber', message: 'Contact number must be a string' }
          ]
        }));
    });

    it('should throw error when warehouse address is not an object', () => {
      const testData = {
        warehouseDetails: {
          address: 'invalid'
        }
      };

      // Act & Assert: Should throw error for non-object warehouse address
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address', message: 'Warehouse address must be an object' }
          ]
        }));
    });

    it('should allow null warehouse address', () => {
      const testData = {
        warehouseDetails: {
          address: null
        }
      };

      // Act & Assert: Should not throw error for null warehouse address (optional field)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should throw error when country is not a string', () => {
      const testData = {
        warehouseDetails: {
          address: {
            country: 131415
          }
        }
      };

      // Act & Assert: Should throw error for non-string country
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address.country', message: 'Country must be a string' }
          ]
        }));
    });

    it('should throw error when state is not a string', () => {
      const testData = {
        warehouseDetails: {
          address: {
            state: 161718
          }
        }
      };

      // Act & Assert: Should throw error for non-string state
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address.state', message: 'State must be a string' }
          ]
        }));
    });

    it('should throw error when city is not a string', () => {
      const testData = {
        warehouseDetails: {
          address: {
            city: 192021
          }
        }
      };

      // Act & Assert: Should throw error for non-string city
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address.city', message: 'City must be a string' }
          ]
        }));
    });

    it('should throw error when addressLine1 is not a string', () => {
      const testData = {
        warehouseDetails: {
          address: {
            addressLine1: 222324
          }
        }
      };

      // Act & Assert: Should throw error for non-string addressLine1
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address.addressLine1', message: 'Address line 1 must be a string' }
          ]
        }));
    });

    it('should throw error when addressLine2 is not a string', () => {
      const testData = {
        warehouseDetails: {
          address: {
            addressLine2: 252627
          }
        }
      };

      // Act & Assert: Should throw error for non-string addressLine2
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address.addressLine2', message: 'Address line 2 must be a string' }
          ]
        }));
    });

    it('should throw error when zipCode is not a string', () => {
      const testData = {
        warehouseDetails: {
          address: {
            zipCode: 282930
          }
        }
      };

      // Act & Assert: Should throw error for non-string zipCode
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'warehouseDetails.address.zipCode', message: 'Zip code must be a string' }
          ]
        }));
    });

    it('should throw multiple errors when multiple fields are invalid', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: 123,
          returnsAndExchangePolicy: 456
        },
        warehouseDetails: {
          name: 789,
          contactNumber: 101112,
          address: {
            country: 131415,
            state: 161718
          }
        }
      };

      // Act & Assert: Should throw error with multiple validation errors
      expect(() => validateAddShippingWarehouseData(testData))
        .toThrow(expect.objectContaining({
          errors: expect.arrayContaining([
            { field: 'shippingOptions.shippingMethod', message: 'Shipping method must be a string' },
            { field: 'shippingOptions.returnsAndExchangePolicy', message: 'Returns and exchange policy must be a string' },
            { field: 'warehouseDetails.name', message: 'Warehouse name must be a string' },
            { field: 'warehouseDetails.contactNumber', message: 'Contact number must be a string' },
            { field: 'warehouseDetails.address.country', message: 'Country must be a string' },
            { field: 'warehouseDetails.address.state', message: 'State must be a string' }
          ])
        }));
    });

    it('should validate valid data with empty strings for optional fields', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: '',
          returnsAndExchangePolicy: ''
        },
        warehouseDetails: {
          name: '',
          contactNumber: '',
          address: {
            country: '',
            state: '',
            city: '',
            addressLine1: '',
            addressLine2: '',
            zipCode: ''
          }
        }
      };

      // Act & Assert: Should not throw error for empty strings (optional fields)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with undefined values for optional fields', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: undefined,
          returnsAndExchangePolicy: undefined
        },
        warehouseDetails: {
          name: undefined,
          contactNumber: undefined,
          address: {
            country: undefined,
            state: undefined,
            city: undefined,
            addressLine1: undefined,
            addressLine2: undefined,
            zipCode: undefined
          }
        }
      };

      // Act & Assert: Should not throw error for undefined values (optional fields)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with null values for optional fields', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: null,
          returnsAndExchangePolicy: null
        },
        warehouseDetails: {
          name: null,
          contactNumber: null,
          address: {
            country: null,
            state: null,
            city: null,
            addressLine1: null,
            addressLine2: null,
            zipCode: null
          }
        }
      };

      // Act & Assert: Should not throw error for null values (optional fields)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with partial warehouse address', () => {
      const testData = {
        warehouseDetails: {
          address: {
            country: 'Nigeria',
            state: 'Lagos'
            // Other address fields are optional
          }
        }
      };

      // Act & Assert: Should not throw error for partial address (all fields optional)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with only shipping method', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: 'Express Shipping'
          // returnsAndExchangePolicy is optional
        }
      };

      // Act & Assert: Should not throw error for partial shipping options (all fields optional)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with only warehouse name', () => {
      const testData = {
        warehouseDetails: {
          name: 'Main Warehouse'
          // Other warehouse fields are optional
        }
      };

      // Act & Assert: Should not throw error for partial warehouse details (all fields optional)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with mixed valid and null values', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: 'Express Shipping',
          returnsAndExchangePolicy: null
        },
        warehouseDetails: {
          name: 'Main Warehouse',
          contactNumber: null,
          address: {
            country: 'Nigeria',
            state: null,
            city: 'Lagos',
            addressLine1: '123 Street',
            addressLine2: null,
            zipCode: '100001'
          }
        }
      };

      // Act & Assert: Should not throw error for mixed valid and null values
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with very long string values', () => {
      const longString = 'A'.repeat(1000);
      const testData = {
        shippingOptions: {
          shippingMethod: longString,
          returnsAndExchangePolicy: longString
        },
        warehouseDetails: {
          name: longString,
          contactNumber: longString,
          address: {
            country: longString,
            state: longString,
            city: longString,
            addressLine1: longString,
            addressLine2: longString,
            zipCode: longString
          }
        }
      };

      // Act & Assert: Should not throw error for long string values (no length validation)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with special characters in strings', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: 'Standard Shipping & Express',
          returnsAndExchangePolicy: '30-day return policy (no exceptions)'
        },
        warehouseDetails: {
          name: 'Main Warehouse - Building A',
          contactNumber: '+234-801-234-5678',
          address: {
            country: 'Nigeria',
            state: 'Lagos State',
            city: 'Lagos',
            addressLine1: '123 Main Street, Building A',
            addressLine2: 'Suite 100',
            zipCode: '100001'
          }
        }
      };

      // Act & Assert: Should not throw error for special characters in strings
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });

    it('should validate valid data with numeric strings', () => {
      const testData = {
        shippingOptions: {
          shippingMethod: '123',
          returnsAndExchangePolicy: '456'
        },
        warehouseDetails: {
          name: '789',
          contactNumber: '101112',
          address: {
            country: '131415',
            state: '161718',
            city: '192021',
            addressLine1: '222324',
            addressLine2: '252627',
            zipCode: '282930'
          }
        }
      };

      // Act & Assert: Should not throw error for numeric strings (strings are valid)
      expect(() => validateAddShippingWarehouseData(testData)).not.toThrow();
    });
  });
});
