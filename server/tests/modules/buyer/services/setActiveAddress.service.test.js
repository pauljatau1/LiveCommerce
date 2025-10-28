/**
 * Set Active Address Service Tests
 *
 * This test suite validates the setActiveAddress service functionality.
 * It tests the business logic, validation, and error handling for
 * setting a shipping address as active for checkout purposes.
 *
 * Test Coverage:
 * - Successful address activation
 * - Input validation
 * - Buyer existence validation
 * - Address ownership verification
 * - Database operations
 * - Error handling
 *
 * @module setActiveAddressServiceTests
 */

const setActiveAddressService = require('../../../../src/modules/buyer/services/setActiveAddress.service');
const buyerRepository = require('../../../../src/modules/buyer/repositories/buyer.repository');
const setActiveAddressValidator = require('../../../../src/modules/buyer/validators/setActiveAddress.validator');
const NotFoundException = require('../../../../src/utils/errors/NotFoundException');

// Mock dependencies
jest.mock('../../../../src/modules/buyer/repositories/buyer.repository');
jest.mock('../../../../src/modules/buyer/validators/setActiveAddress.validator');

describe('Set Active Address Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setActiveAddress', () => {
    const buyerId = '507f1f77bcf86cd799439011';
    const addressId = '507f1f77bcf86cd799439012';

    it('should successfully set an address as active', async () => {
      // Arrange
      const mockBuyer = {
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890'
      };

      const mockAddresses = [
        {
          _id: '507f1f77bcf86cd799439012',
          addressType: 'home',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001',
          isActive: false
        },
        {
          _id: '507f1f77bcf86cd799439013',
          addressType: 'work',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '456 Work Street',
          zipCode: '100002',
          isActive: true
        }
      ];

      const mockUpdatedBuyer = {
        _id: buyerId,
        shippingAddresses: [
          {
            _id: '507f1f77bcf86cd799439012',
            addressType: 'home',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            zipCode: '100001',
            isActive: true
          },
          {
            _id: '507f1f77bcf86cd799439013',
            addressType: 'work',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '456 Work Street',
            zipCode: '100002',
            isActive: false
          }
        ]
      };

      setActiveAddressValidator.validateSetActiveAddressData.mockResolvedValue();
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue({
        ...mockBuyer,
        shippingAddresses: mockAddresses
      });
      buyerRepository.setActiveShippingAddress.mockResolvedValue(mockUpdatedBuyer);

      // Act
      const result = await setActiveAddressService.setActiveAddress(buyerId, addressId);

      // Assert
      expect(result).toEqual({
        message: 'Address set as active successfully',
        address: {
          _id: '507f1f77bcf86cd799439012',
          addressType: 'home',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001',
          isActive: true
        }
      });

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId,
        buyerId
      });
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findByIdWithShippingAddresses).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.setActiveShippingAddress).toHaveBeenCalledWith(buyerId, addressId);
    });

    it('should throw ValidationError for invalid input data', async () => {
      // Arrange
      const invalidData = { addressId: 'invalid', buyerId: 'invalid' };
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        {
          field: 'addressId',
          message: 'Address ID must be a valid MongoDB ObjectId',
          value: 'invalid'
        }
      ];

      setActiveAddressValidator.validateSetActiveAddressData.mockRejectedValue(validationError);

      // Act & Assert
      await expect(setActiveAddressService.setActiveAddress('invalid', 'invalid'))
        .rejects.toThrow('Validation failed');

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId: 'invalid',
        buyerId: 'invalid'
      });
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      // Arrange
      setActiveAddressValidator.validateSetActiveAddressData.mockResolvedValue();
      buyerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(setActiveAddressService.setActiveAddress(buyerId, addressId))
        .rejects.toThrow(NotFoundException);

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId,
        buyerId
      });
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
    });

    it('should throw NotFoundException when buyer with addresses is not found', async () => {
      // Arrange
      const mockBuyer = { _id: buyerId };
      
      setActiveAddressValidator.validateSetActiveAddressData.mockResolvedValue();
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(null);

      // Act & Assert
      await expect(setActiveAddressService.setActiveAddress(buyerId, addressId))
        .rejects.toThrow(NotFoundException);

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId,
        buyerId
      });
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findByIdWithShippingAddresses).toHaveBeenCalledWith(buyerId);
    });

    it('should throw NotFoundException when address does not exist for buyer', async () => {
      // Arrange
      const mockBuyer = { _id: buyerId };
      const mockAddresses = [
        {
          _id: '507f1f77bcf86cd799439013',
          addressType: 'work',
          isActive: false
        }
      ];

      setActiveAddressValidator.validateSetActiveAddressData.mockResolvedValue();
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue({
        ...mockBuyer,
        shippingAddresses: mockAddresses
      });

      // Act & Assert
      await expect(setActiveAddressService.setActiveAddress(buyerId, addressId))
        .rejects.toThrow(NotFoundException);

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId,
        buyerId
      });
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findByIdWithShippingAddresses).toHaveBeenCalledWith(buyerId);
    });

    it('should throw error when address activation fails', async () => {
      // Arrange
      const mockBuyer = { _id: buyerId };
      const mockAddresses = [
        {
          _id: addressId,
          addressType: 'home',
          isActive: false
        }
      ];

      setActiveAddressValidator.validateSetActiveAddressData.mockResolvedValue();
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue({
        ...mockBuyer,
        shippingAddresses: mockAddresses
      });
      buyerRepository.setActiveShippingAddress.mockResolvedValue(null);

      // Act & Assert
      await expect(setActiveAddressService.setActiveAddress(buyerId, addressId))
        .rejects.toThrow('Failed to set address as active');

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId,
        buyerId
      });
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findByIdWithShippingAddresses).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.setActiveShippingAddress).toHaveBeenCalledWith(buyerId, addressId);
    });

    it('should throw error when updated address cannot be retrieved', async () => {
      // Arrange
      const mockBuyer = { _id: buyerId };
      const mockAddresses = [
        {
          _id: addressId,
          addressType: 'home',
          isActive: false
        }
      ];

      const mockUpdatedBuyer = {
        _id: buyerId,
        shippingAddresses: [] // Empty addresses array
      };

      setActiveAddressValidator.validateSetActiveAddressData.mockResolvedValue();
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue({
        ...mockBuyer,
        shippingAddresses: mockAddresses
      });
      buyerRepository.setActiveShippingAddress.mockResolvedValue(mockUpdatedBuyer);

      // Act & Assert
      await expect(setActiveAddressService.setActiveAddress(buyerId, addressId))
        .rejects.toThrow('Failed to retrieve updated address');

      expect(setActiveAddressValidator.validateSetActiveAddressData).toHaveBeenCalledWith({
        addressId,
        buyerId
      });
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findByIdWithShippingAddresses).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.setActiveShippingAddress).toHaveBeenCalledWith(buyerId, addressId);
    });
  });
});
