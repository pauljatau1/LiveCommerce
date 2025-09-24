const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const updateAddressService = require('@modules/buyer/services/updateAddress.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the validator
jest.mock('@modules/buyer/validators/updateAddress.validator', () => ({
  validateUpdateAddressData: jest.fn()
}));

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

const updateAddressValidator = require('@modules/buyer/validators/updateAddress.validator');

let mongoServer;

describe('Update Address Service', () => {
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

  describe('updateAddress', () => {
    let testBuyer;
    let testAddressId;
    const mockUpdateData = {
      addressType: 'work',
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Victoria Island',
      addressLine1: '456 Business Avenue',
      addressLine2: 'Suite 100',
      zipCode: '100002'
    };

    beforeEach(async () => {
      // Create a test buyer with an address
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
    });

    it('should update address successfully', async () => {
      // Arrange
      updateAddressValidator.validateUpdateAddressData.mockResolvedValue();
      
      const updatedBuyer = {
        _id: testBuyer._id,
        shippingAddresses: [{
          _id: testAddressId,
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          addressLine2: 'Suite 100',
          zipCode: '100002'
        }]
      };
      
      buyerRepository.updateShippingAddress.mockResolvedValue(updatedBuyer);

      // Act
      const result = await updateAddressService.updateAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        mockUpdateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address updated successfully');
      expect(result.address).toBeDefined();
      expect(result.address.addressType).toBe('work');
      expect(result.address.country).toBe('Nigeria');
      expect(result.address.state).toBe('Lagos');
      expect(result.address.city).toBe('Victoria Island');
      expect(result.address.addressLine1).toBe('456 Business Avenue');
      expect(result.address.addressLine2).toBe('Suite 100');
      expect(result.address.zipCode).toBe('100002');
      expect(updateAddressValidator.validateUpdateAddressData).toHaveBeenCalledWith(
        mockUpdateData, 
        testBuyer._id.toString(), 
        testAddressId
      );
      expect(buyerRepository.updateShippingAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockUpdateData
      );
    });

    it('should update address with partial data', async () => {
      // Arrange
      const partialUpdateData = {
        addressType: 'work',
        city: 'Victoria Island'
      };
      updateAddressValidator.validateUpdateAddressData.mockResolvedValue();
      
      const updatedBuyer = {
        _id: testBuyer._id,
        shippingAddresses: [{
          _id: testAddressId,
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }]
      };
      
      buyerRepository.updateShippingAddress.mockResolvedValue(updatedBuyer);

      // Act
      const result = await updateAddressService.updateAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        partialUpdateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address updated successfully');
      expect(result.address).toBeDefined();
      expect(result.address.addressType).toBe('work');
      expect(result.address.city).toBe('Victoria Island');
      // Other fields should remain unchanged
      expect(result.address.country).toBe('Nigeria');
      expect(result.address.state).toBe('Lagos');
      expect(result.address.addressLine1).toBe('123 Main Street');
      expect(result.address.addressLine2).toBe('Apt 4B');
      expect(result.address.zipCode).toBe('100001');
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();
      updateAddressValidator.validateUpdateAddressData.mockResolvedValue();

      // Mock repository to return null (buyer not found)
      jest.spyOn(buyerRepository, 'updateShippingAddress').mockResolvedValue(null);

      // Act & Assert
      await expect(updateAddressService.updateAddress(
        nonExistentBuyerId, 
        testAddressId, 
        mockUpdateData
      )).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when address not found', async () => {
      // Arrange
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();
      updateAddressValidator.validateUpdateAddressData.mockResolvedValue();

      // Mock repository to return buyer but without the specific address
      const buyerWithoutAddress = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123',
        shippingAddresses: []
      });
      jest.spyOn(buyerRepository, 'updateShippingAddress').mockResolvedValue(buyerWithoutAddress);

      // Act & Assert
      await expect(updateAddressService.updateAddress(
        testBuyer._id.toString(), 
        nonExistentAddressId, 
        mockUpdateData
      )).rejects.toThrow(NotFoundException);
    });

    it('should propagate ValidationError from validator', async () => {
      // Arrange
      const validationError = new ValidationError([{ field: 'city', message: 'City must be a valid string' }]);
      updateAddressValidator.validateUpdateAddressData.mockRejectedValue(validationError);

      // Act & Assert
      await expect(updateAddressService.updateAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        mockUpdateData
      )).rejects.toThrow(ValidationError);
    });

    it('should preserve existing address fields when updating only specific fields', async () => {
      // Arrange
      const partialUpdateData = {
        addressLine1: '789 New Street'
      };
      updateAddressValidator.validateUpdateAddressData.mockResolvedValue();

      // Mock repository to return updated buyer with the address
      const updatedBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          _id: testAddressId,
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '789 New Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }]
      });
      jest.spyOn(buyerRepository, 'updateShippingAddress').mockResolvedValue(updatedBuyer);

      // Act
      const result = await updateAddressService.updateAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        partialUpdateData
      );

      // Assert
      expect(result.address.addressLine1).toBe('789 New Street');
      // Other fields should remain unchanged
      expect(result.address.addressType).toBe('home');
      expect(result.address.country).toBe('Nigeria');
      expect(result.address.state).toBe('Lagos');
      expect(result.address.city).toBe('Lagos');
      expect(result.address.addressLine2).toBe('Apt 4B');
      expect(result.address.zipCode).toBe('100001');
    });

    it('should handle empty update data', async () => {
      // Arrange
      const emptyUpdateData = {};
      updateAddressValidator.validateUpdateAddressData.mockResolvedValue();

      // Mock repository to return updated buyer with the address
      const updatedBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          _id: testAddressId,
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }]
      });
      jest.spyOn(buyerRepository, 'updateShippingAddress').mockResolvedValue(updatedBuyer);

      // Act
      const result = await updateAddressService.updateAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        emptyUpdateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Address updated successfully');
      expect(result.address).toBeDefined();
      // Address should remain unchanged
      expect(result.address.addressType).toBe('home');
      expect(result.address.country).toBe('Nigeria');
      expect(result.address.state).toBe('Lagos');
      expect(result.address.city).toBe('Lagos');
      expect(result.address.addressLine1).toBe('123 Main Street');
      expect(result.address.addressLine2).toBe('Apt 4B');
      expect(result.address.zipCode).toBe('100001');
    });
  });
}); 