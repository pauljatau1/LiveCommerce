/**
 * Add Shipping Warehouse Service Tests
 *
 * This test suite validates the addShippingWarehouse service functionality.
 * It ensures that the service properly handles business logic, data validation,
 * and database operations for adding shipping and warehouse information to seller profiles.
 *
 * Test Coverage:
 * - Successful shipping and warehouse information addition
 * - Validation error handling
 * - Seller not found scenarios
 * - Database operation failures
 * - Business logic validation
 * - Data integrity checks
 * - Completion flag updates
 * - Partial data updates
 *
 * @module addShippingWarehouseServiceTests
 */

const { addShippingWarehouse } = require('@modules/seller/services/addShippingWarehouse.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const addShippingWarehouseValidator = require('@modules/seller/validators/addShippingWarehouse.validator');

// Mock dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/addShippingWarehouse.validator');

describe('Add Shipping Warehouse Service', () => {
  let validShippingWarehouseData;
  let mockSeller;

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

    // Mock seller object
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      shippingOptions: undefined,
      warehouseDetails: undefined,
      hasFilledWarehouseAddress: false,
      save: jest.fn()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('addShippingWarehouse', () => {
    it('should successfully add shipping and warehouse information', async () => {
      // Arrange: Setup mocks
      const sellerId = '507f1f77bcf86cd799439011';
      const updatedSeller = {
        ...mockSeller,
        shippingOptions: validShippingWarehouseData.shippingOptions,
        warehouseDetails: validShippingWarehouseData.warehouseDetails,
        hasFilledWarehouseAddress: true
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, validShippingWarehouseData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: validShippingWarehouseData.shippingOptions,
          warehouseDetails: validShippingWarehouseData.warehouseDetails
        }
      });

      // Verify validator was called
      expect(addShippingWarehouseValidator.validateAddShippingWarehouseData).toHaveBeenCalledWith(validShippingWarehouseData);

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);

      // Verify seller object was updated
      expect(mockSeller.shippingOptions).toEqual(validShippingWarehouseData.shippingOptions);
      expect(mockSeller.warehouseDetails).toEqual(validShippingWarehouseData.warehouseDetails);
      expect(mockSeller.hasFilledWarehouseAddress).toBe(true);
    });

    it('should successfully add only shipping options', async () => {
      // Arrange: Setup mocks for shipping options only
      const sellerId = '507f1f77bcf86cd799439011';
      const shippingOptionsData = {
        shippingOptions: {
          shippingMethod: 'Express Shipping',
          returnsAndExchangePolicy: '14-day return policy'
        }
      };

      const updatedSeller = {
        ...mockSeller,
        shippingOptions: shippingOptionsData.shippingOptions,
        hasFilledWarehouseAddress: false
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, shippingOptionsData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: shippingOptionsData.shippingOptions,
          warehouseDetails: undefined
        }
      });

      // Verify seller object was updated
      expect(mockSeller.shippingOptions).toEqual(shippingOptionsData.shippingOptions);
      expect(mockSeller.warehouseDetails).toBeUndefined();
      expect(mockSeller.hasFilledWarehouseAddress).toBe(false);
    });

    it('should successfully add only warehouse details', async () => {
      // Arrange: Setup mocks for warehouse details only
      const sellerId = '507f1f77bcf86cd799439011';
      const warehouseData = {
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

      const updatedSeller = {
        ...mockSeller,
        warehouseDetails: warehouseData.warehouseDetails,
        hasFilledWarehouseAddress: true
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, warehouseData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: undefined,
          warehouseDetails: warehouseData.warehouseDetails
        }
      });

      // Verify seller object was updated
      expect(mockSeller.shippingOptions).toBeUndefined();
      expect(mockSeller.warehouseDetails).toEqual(warehouseData.warehouseDetails);
      expect(mockSeller.hasFilledWarehouseAddress).toBe(true);
    });

    it('should handle warehouse details without address', async () => {
      // Arrange: Setup mocks for warehouse details without address
      const sellerId = '507f1f77bcf86cd799439011';
      const warehouseDataWithoutAddress = {
        warehouseDetails: {
          name: 'Warehouse Without Address',
          contactNumber: '+2348012345678'
        }
      };

      const updatedSeller = {
        ...mockSeller,
        warehouseDetails: warehouseDataWithoutAddress.warehouseDetails,
        hasFilledWarehouseAddress: false
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, warehouseDataWithoutAddress);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: undefined,
          warehouseDetails: warehouseDataWithoutAddress.warehouseDetails
        }
      });

      // Verify hasFilledWarehouseAddress is false when no address
      expect(mockSeller.hasFilledWarehouseAddress).toBe(false);
    });

    it('should handle warehouse details with empty address line 1', async () => {
      // Arrange: Setup mocks for warehouse details with empty address line 1
      const sellerId = '507f1f77bcf86cd799439011';
      const warehouseDataWithEmptyAddress = {
        warehouseDetails: {
          name: 'Warehouse With Empty Address',
          contactNumber: '+2348012345678',
          address: {
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '',
            zipCode: '100001'
          }
        }
      };

      const updatedSeller = {
        ...mockSeller,
        warehouseDetails: warehouseDataWithEmptyAddress.warehouseDetails,
        hasFilledWarehouseAddress: false
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, warehouseDataWithEmptyAddress);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: undefined,
          warehouseDetails: warehouseDataWithEmptyAddress.warehouseDetails
        }
      });

      // Verify hasFilledWarehouseAddress is false when address line 1 is empty
      expect(mockSeller.hasFilledWarehouseAddress).toBe(false);
    });

    it('should handle warehouse details with whitespace-only address line 1', async () => {
      // Arrange: Setup mocks for warehouse details with whitespace-only address line 1
      const sellerId = '507f1f77bcf86cd799439011';
      const warehouseDataWithWhitespaceAddress = {
        warehouseDetails: {
          name: 'Warehouse With Whitespace Address',
          contactNumber: '+2348012345678',
          address: {
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '   ',
            zipCode: '100001'
          }
        }
      };

      const updatedSeller = {
        ...mockSeller,
        warehouseDetails: warehouseDataWithWhitespaceAddress.warehouseDetails,
        hasFilledWarehouseAddress: false
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, warehouseDataWithWhitespaceAddress);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: undefined,
          warehouseDetails: warehouseDataWithWhitespaceAddress.warehouseDetails
        }
      });

      // Verify hasFilledWarehouseAddress is false when address line 1 is whitespace-only
      expect(mockSeller.hasFilledWarehouseAddress).toBe(false);
    });

    it('should handle empty data object', async () => {
      // Arrange: Setup mocks for empty data
      const sellerId = '507f1f77bcf86cd799439011';
      const emptyData = {};

      const updatedSeller = {
        ...mockSeller,
        hasFilledWarehouseAddress: false
      };

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, emptyData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: undefined,
          warehouseDetails: undefined
        }
      });

      // Verify no fields were updated
      expect(mockSeller.shippingOptions).toBeUndefined();
      expect(mockSeller.warehouseDetails).toBeUndefined();
      expect(mockSeller.hasFilledWarehouseAddress).toBe(false);
    });

    it('should throw error when validation fails', async () => {
      // Arrange: Setup mocks for validation failure
      const sellerId = '507f1f77bcf86cd799439011';
      const invalidData = {
        shippingOptions: 'invalid'
      };

      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'shippingOptions', message: 'Shipping options must be an object' }
      ];

      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert: Should throw validation error
      await expect(addShippingWarehouse(sellerId, invalidData)).rejects.toThrow('Validation failed');

      // Verify validator was called
      expect(addShippingWarehouseValidator.validateAddShippingWarehouseData).toHaveBeenCalledWith(invalidData);

      // Verify repository methods were not called
      expect(sellerRepository.findById).not.toHaveBeenCalled();
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when seller is not found', async () => {
      // Arrange: Setup mocks for seller not found
      const sellerId = '507f1f77bcf86cd799439011';

      sellerRepository.findById.mockResolvedValue(null);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act & Assert: Should throw error when seller not found
      await expect(addShippingWarehouse(sellerId, validShippingWarehouseData)).rejects.toThrow('Seller not found');

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when database save fails', async () => {
      // Arrange: Setup mocks for database save failure
      const sellerId = '507f1f77bcf86cd799439011';
      const databaseError = new Error('Database connection failed');

      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockRejectedValue(databaseError);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act & Assert: Should throw database error
      await expect(addShippingWarehouse(sellerId, validShippingWarehouseData)).rejects.toThrow('Database connection failed');

      // Verify repository methods were called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
    });

    it('should preserve existing seller data when updating specific fields', async () => {
      // Arrange: Setup mocks with existing seller data
      const sellerId = '507f1f77bcf86cd799439011';
      const existingSeller = {
        ...mockSeller,
        businessEmail: 'existing@example.com',
        businessNumber: '+2348012345678',
        shippingOptions: { shippingMethod: 'Old Method' },
        warehouseDetails: { name: 'Old Warehouse' }
      };

      const updatedSeller = {
        ...existingSeller,
        shippingOptions: validShippingWarehouseData.shippingOptions,
        warehouseDetails: validShippingWarehouseData.warehouseDetails,
        hasFilledWarehouseAddress: true
      };

      sellerRepository.findById.mockResolvedValue(existingSeller);
      sellerRepository.save.mockResolvedValue(updatedSeller);
      addShippingWarehouseValidator.validateAddShippingWarehouseData.mockImplementation(() => {});

      // Act: Call the service
      const result = await addShippingWarehouse(sellerId, validShippingWarehouseData);

      // Assert: Verify the result
      expect(result).toEqual({
        message: 'Shipping and warehouse information added successfully',
        seller: {
          shippingOptions: validShippingWarehouseData.shippingOptions,
          warehouseDetails: validShippingWarehouseData.warehouseDetails
        }
      });

      // Verify existing data is preserved
      expect(existingSeller.businessEmail).toBe('existing@example.com');
      expect(existingSeller.businessNumber).toBe('+2348012345678');

      // Verify new data is updated
      expect(existingSeller.shippingOptions).toEqual(validShippingWarehouseData.shippingOptions);
      expect(existingSeller.warehouseDetails).toEqual(validShippingWarehouseData.warehouseDetails);
      expect(existingSeller.hasFilledWarehouseAddress).toBe(true);
    });
  });
});
