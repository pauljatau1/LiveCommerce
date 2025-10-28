/**
 * Test Default Active Address Functionality
 *
 * This test verifies that the system automatically sets the first address
 * as active when no addresses are currently active.
 *
 * Test Scenarios:
 * - User with no addresses (empty array)
 * - User with addresses but none active
 * - User with addresses and one already active
 * - User adding first address
 * - User adding additional address when one is already active
 *
 * @module defaultActiveAddressTest
 */

const getAddressesService = require('../../../../src/modules/buyer/services/getAddresses.service');
const addAddressService = require('../../../../src/modules/buyer/services/addAddress.service');
const buyerRepository = require('../../../../src/modules/buyer/repositories/buyer.repository');

// Mock dependencies
jest.mock('../../../../src/modules/buyer/repositories/buyer.repository');

describe('Default Active Address Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAddresses - Auto-set first address as active', () => {
    const buyerId = '507f1f77bcf86cd799439011';

    it('should set first address as active when no addresses are active', async () => {
      // Arrange
      const mockBuyer = {
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        shippingAddresses: [
          {
            _id: '507f1f77bcf86cd799439012',
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            zipCode: '100001',
            isActive: false
          },
          {
            _id: '507f1f77bcf86cd799439013',
            addressType: 'work',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '456 Work Street',
            zipCode: '100002',
            isActive: false
          }
        ]
      };

      const updatedBuyer = {
        ...mockBuyer,
        shippingAddresses: [
          {
            ...mockBuyer.shippingAddresses[0],
            isActive: true
          },
          {
            ...mockBuyer.shippingAddresses[1],
            isActive: false
          }
        ]
      };

      buyerRepository.findByIdWithShippingAddresses
        .mockResolvedValueOnce(mockBuyer) // First call
        .mockResolvedValueOnce(updatedBuyer); // Second call after update

      buyerRepository.setActiveShippingAddress.mockResolvedValue(updatedBuyer);

      // Act
      const result = await getAddressesService.getAddresses(buyerId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(false);

      expect(buyerRepository.setActiveShippingAddress).toHaveBeenCalledWith(
        buyerId,
        '507f1f77bcf86cd799439012'
      );
    });

    it('should not modify addresses when one is already active', async () => {
      // Arrange
      const mockBuyer = {
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        shippingAddresses: [
          {
            _id: '507f1f77bcf86cd799439012',
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            zipCode: '100001',
            isActive: false
          },
          {
            _id: '507f1f77bcf86cd799439013',
            addressType: 'work',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '456 Work Street',
            zipCode: '100002',
            isActive: true
          }
        ]
      };

      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(mockBuyer);

      // Act
      const result = await getAddressesService.getAddresses(buyerId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(false);
      expect(result[1].isActive).toBe(true);

      expect(buyerRepository.setActiveShippingAddress).not.toHaveBeenCalled();
    });

    it('should handle empty address list gracefully', async () => {
      // Arrange
      const mockBuyer = {
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        shippingAddresses: []
      };

      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(mockBuyer);

      // Act
      const result = await getAddressesService.getAddresses(buyerId);

      // Assert
      expect(result).toHaveLength(0);
      expect(buyerRepository.setActiveShippingAddress).not.toHaveBeenCalled();
    });
  });

  describe('addAddress - Auto-set new address as active', () => {
    const buyerId = '507f1f77bcf86cd799439011';
    const addressData = {
      addressType: 'home',
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Lagos',
      addressLine1: '789 New Street',
      zipCode: '100003'
    };

    it('should set new address as active when no addresses are active', async () => {
      // Arrange
      const mockBuyer = {
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        shippingAddresses: []
      };

      const buyerWithNewAddress = {
        ...mockBuyer,
        shippingAddresses: [
          {
            _id: '507f1f77bcf86cd799439014',
            ...addressData,
            isActive: false
          }
        ]
      };

      const finalBuyer = {
        ...buyerWithNewAddress,
        shippingAddresses: [
          {
            ...buyerWithNewAddress.shippingAddresses[0],
            isActive: true
          }
        ]
      };

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.addShippingAddress.mockResolvedValue(buyerWithNewAddress);
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(finalBuyer);
      buyerRepository.setActiveShippingAddress.mockResolvedValue(finalBuyer);

      // Mock validator
      const addAddressValidator = require('../../../../src/modules/buyer/validators/addAddress.validator');
      jest.spyOn(addAddressValidator, 'validateAddAddressData').mockResolvedValue();

      // Act
      const result = await addAddressService.addAddress(buyerId, addressData);

      // Assert
      expect(result.address.isActive).toBe(true);
      expect(buyerRepository.setActiveShippingAddress).toHaveBeenCalledWith(
        buyerId,
        '507f1f77bcf86cd799439014'
      );
    });

    it('should not set new address as active when another address is already active', async () => {
      // Arrange
      const mockBuyer = {
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        shippingAddresses: [
          {
            _id: '507f1f77bcf86cd799439012',
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            zipCode: '100001',
            isActive: true
          }
        ]
      };

      const buyerWithNewAddress = {
        ...mockBuyer,
        shippingAddresses: [
          ...mockBuyer.shippingAddresses,
          {
            _id: '507f1f77bcf86cd799439014',
            ...addressData,
            isActive: false
          }
        ]
      };

      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.addShippingAddress.mockResolvedValue(buyerWithNewAddress);

      // Mock validator
      const addAddressValidator = require('../../../../src/modules/buyer/validators/addAddress.validator');
      jest.spyOn(addAddressValidator, 'validateAddAddressData').mockResolvedValue();

      // Act
      const result = await addAddressService.addAddress(buyerId, addressData);

      // Assert
      expect(result.address.isActive).toBe(false);
      expect(buyerRepository.setActiveShippingAddress).not.toHaveBeenCalled();
    });
  });
});
