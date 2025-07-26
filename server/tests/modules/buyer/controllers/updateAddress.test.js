const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const buyerController = require('@modules/buyer/controllers/buyer.controller');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the service
jest.mock('@modules/buyer/services/updateAddress.service', () => ({
  updateAddress: jest.fn()
}));

const updateAddressService = require('@modules/buyer/services/updateAddress.service');

let mongoServer;

describe('Update Address Controller', () => {
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
    let mockReq;
    let mockRes;
    let mockNext;
    let testBuyer;
    let testAddressId;

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

      // Mock request object
      mockReq = {
        user: { id: testBuyer._id.toString() },
        params: { addressId: testAddressId },
        body: {
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          addressLine2: 'Suite 100',
          zipCode: '100002'
        }
      };

      // Mock response object
      mockRes = {
        success: jest.fn()
      };

      // Mock next function
      mockNext = jest.fn();
    });

    it('should update address successfully', async () => {
      // Arrange
      const mockResponse = {
        message: 'Address updated successfully',
        address: {
          _id: testAddressId,
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          addressLine2: 'Suite 100',
          zipCode: '100002'
        }
      };

      updateAddressService.updateAddress.mockResolvedValue(mockResponse);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Address updated successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle ValidationError', async () => {
      // Arrange
      const validationError = new ValidationError([{ field: 'addressType', message: 'Invalid address type' }]);
      updateAddressService.updateAddress.mockRejectedValue(validationError);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle NotFoundException', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Address not found');
      updateAddressService.updateAddress.mockRejectedValue(notFoundError);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    it('should handle partial update data', async () => {
      // Arrange
      mockReq.body = {
        addressType: 'work',
        city: 'Victoria Island'
      };

      const mockResponse = {
        message: 'Address updated successfully',
        address: {
          _id: testAddressId,
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }
      };

      updateAddressService.updateAddress.mockResolvedValue(mockResponse);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Address updated successfully');
    });

    it('should handle empty update data', async () => {
      // Arrange
      mockReq.body = {};

      const mockResponse = {
        message: 'Address updated successfully',
        address: {
          _id: testAddressId,
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }
      };

      updateAddressService.updateAddress.mockResolvedValue(mockResponse);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Address updated successfully');
    });

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Service error');
      updateAddressService.updateAddress.mockRejectedValue(serviceError);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it('should handle different address types', async () => {
      // Arrange
      mockReq.body = {
        addressType: 'other',
        addressLine1: '789 Other Street'
      };

      const mockResponse = {
        message: 'Address updated successfully',
        address: {
          _id: testAddressId,
          addressType: 'other',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '789 Other Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }
      };

      updateAddressService.updateAddress.mockResolvedValue(mockResponse);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Address updated successfully');
    });

    it('should handle different user IDs', async () => {
      // Arrange
      const differentUserId = new mongoose.Types.ObjectId().toString();
      mockReq.user.id = differentUserId;

      const mockResponse = {
        message: 'Address updated successfully',
        address: {
          _id: testAddressId,
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          addressLine2: 'Suite 100',
          zipCode: '100002'
        }
      };

      updateAddressService.updateAddress.mockResolvedValue(mockResponse);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        differentUserId,
        testAddressId,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Address updated successfully');
    });

    it('should handle different address IDs', async () => {
      // Arrange
      const differentAddressId = new mongoose.Types.ObjectId().toString();
      mockReq.params.addressId = differentAddressId;

      const mockResponse = {
        message: 'Address updated successfully',
        address: {
          _id: differentAddressId,
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          addressLine2: 'Suite 100',
          zipCode: '100002'
        }
      };

      updateAddressService.updateAddress.mockResolvedValue(mockResponse);

      // Act
      await buyerController.updateAddress(mockReq, mockRes, mockNext);

      // Assert
      expect(updateAddressService.updateAddress).toHaveBeenCalledWith(
        testBuyer._id.toString(),
        differentAddressId,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockResponse, 'Address updated successfully');
    });
  });
}); 