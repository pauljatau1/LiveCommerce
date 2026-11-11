const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const addAddressService = require('@modules/buyer/services/addAddress.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the validator
jest.mock('@modules/buyer/validators/addAddress.validator', () => ({
  validateAddAddressData: jest.fn()
}));

const addAddressValidator = require('@modules/buyer/validators/addAddress.validator');

let mongoServer;

describe('Add Address Service', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('addAddress', () => {
    let testBuyer;
    const mockAddressData = {
      addressType: 'home',
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Lagos',
      addressLine1: '123 Main Street',
      addressLine2: 'Apt 4B',
      zipCode: '100001'
    };

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123',
        shippingAddresses: []
      });
      await testBuyer.save();
    });

    it('should add address successfully', async () => {
      // Arrange
      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Act
      const result = await addAddressService.addAddress(testBuyer._id.toString(), mockAddressData);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address added successfully');
      expect(result.address).toBeDefined();
      expect(result.address.addressType).toBe('home');
      expect(result.address.country).toBe('Nigeria');
      expect(result.address.state).toBe('Lagos');
      expect(result.address.city).toBe('Lagos');
      expect(result.address.addressLine1).toBe('123 Main Street');
      expect(result.address.addressLine2).toBe('Apt 4B');
      expect(result.address.zipCode).toBe('100001');
      expect(addAddressValidator.validateAddAddressData).toHaveBeenCalledWith(mockAddressData, testBuyer._id.toString());
    });

    it('should add address to buyer with existing addresses', async () => {
      // Arrange
      const existingAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      testBuyer.shippingAddresses = [existingAddress];
      await testBuyer.save();

      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Act
      const result = await addAddressService.addAddress(testBuyer._id.toString(), mockAddressData);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address added successfully');
      expect(result.address).toBeDefined();
      expect(result.address.addressType).toBe('home');
      expect(result.address.addressLine1).toBe('123 Main Street');
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Act & Assert
      await expect(
        addAddressService.addAddress(nonExistentId, mockAddressData)
      ).rejects.toThrow(NotFoundException);
      await expect(
        addAddressService.addAddress(nonExistentId, mockAddressData)
      ).rejects.toThrow('Buyer not found');
    });

    it('should propagate ValidationError when validator fails', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'country', message: 'Country is required' }
      ]);
      addAddressValidator.validateAddAddressData.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        addAddressService.addAddress(testBuyer._id.toString(), mockAddressData)
      ).rejects.toThrow(ValidationError);
    });

    it('should handle address without optional fields', async () => {
      // Arrange
      const addressWithoutOptional = {
        addressType: 'other',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Ikeja',
        addressLine1: '789 Other Street',
        zipCode: '100003'
      };

      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Act
      const result = await addAddressService.addAddress(testBuyer._id.toString(), addressWithoutOptional);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address added successfully');
      expect(result.address).toBeDefined();
      expect(result.address.addressType).toBe('other');
      expect(result.address.addressLine2).toBeUndefined();
    });

    it('should handle complex address data', async () => {
      // Arrange
      const complexAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        addressLine2: 'Suite 10, Floor 5, Building A',
        zipCode: '100002'
      };

      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Act
      const result = await addAddressService.addAddress(testBuyer._id.toString(), complexAddress);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address added successfully');
      expect(result.address).toBeDefined();
      expect(result.address.addressType).toBe('work');
      expect(result.address.addressLine2).toBe('Suite 10, Floor 5, Building A');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Mock repository to throw an error
      const mockSpy = jest.spyOn(buyerRepository, 'addShippingAddress').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        addAddressService.addAddress(testBuyer._id.toString(), mockAddressData)
      ).rejects.toThrow('Database error');

      // Restore the mock
      mockSpy.mockRestore();
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      addAddressValidator.validateAddAddressData.mockResolvedValue();

      // Act & Assert
      await expect(
        addAddressService.addAddress('invalid-id', mockAddressData)
      ).rejects.toThrow('Cast to ObjectId failed for value "invalid-id"');
    });
  });
}); 