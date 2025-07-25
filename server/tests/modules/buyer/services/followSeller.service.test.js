const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const followSellerService = require('@modules/buyer/services/followSeller.service');

// Import the Buyer and Seller models
const Buyer = require('@modules/buyer/models/buyer.model');
const Seller = require('@models/Seller');

// Mock the validator
jest.mock('@modules/buyer/validators/followSeller.validator', () => ({
  validateFollowSellerData: jest.fn()
}));

// Mock the notification controller
jest.mock('@controllers/notificationController', () => ({
  createNotification: jest.fn(),
  sendNewFollowerEmail: jest.fn()
}));

// Import the mocked modules
const followSellerValidator = require('@modules/buyer/validators/followSeller.validator');
const notificationController = require('@controllers/notificationController');

let mongoServer;

describe('Follow Seller Service', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
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
    await Seller.deleteMany({});
  });

  describe('followSeller', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockSellerId = new mongoose.Types.ObjectId();

    it('should successfully follow a seller', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          zipCode: '100001'
        }],
        activityFeed: []
      });

      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        businessName: 'Jane Smith Business',
        followers: []
      });

      await buyer.save();
      await seller.save();

      followSellerValidator.validateFollowSellerData.mockResolvedValue();
      notificationController.createNotification.mockResolvedValue();
      notificationController.sendNewFollowerEmail.mockResolvedValue();

      // Act
      const result = await followSellerService.followSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(followSellerValidator.validateFollowSellerData).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockSellerId.toString()
      );

      expect(result).toHaveProperty('followData');
      expect(result).toHaveProperty('sellerFollowCount');
      expect(result).toHaveProperty('buyerFollowingCount');

      expect(result.sellerFollowCount).toBe(1);
      expect(result.buyerFollowingCount).toBe(1);

      expect(result.followData).toHaveProperty('buyerId');
      expect(result.followData).toHaveProperty('firstName');
      expect(result.followData).toHaveProperty('lastName');
      expect(result.followData).toHaveProperty('email');
      expect(result.followData).toHaveProperty('followDate');
      expect(result.followData).toHaveProperty('totalOrders');
      expect(result.followData).toHaveProperty('mainAddress');

      // Verify notification was created
      expect(notificationController.createNotification).toHaveBeenCalledWith(
        mockSellerId.toString(),
        'new_follower',
        expect.objectContaining({
          buyerId: mockBuyerId.toString(),
          buyerName: 'John Doe',
          followDate: expect.any(Date)
        })
      );

      // Verify email was sent
      expect(notificationController.sendNewFollowerEmail).toHaveBeenCalledWith(
        expect.objectContaining({ _id: mockSellerId }),
        'John Doe'
      );
    });

    it('should throw error if already following the seller', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        activityFeed: []
      });

      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        followers: [{
          buyerId: mockBuyerId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          followDate: new Date(),
          totalOrders: 0
        }]
      });

      await buyer.save();
      await seller.save();

      followSellerValidator.validateFollowSellerData.mockResolvedValue();

      // Act & Assert
      await expect(
        followSellerService.followSeller(mockBuyerId.toString(), mockSellerId.toString())
      ).rejects.toThrow('Already following this seller');
    });

    it('should remove duplicate follow activity from buyer activity feed', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        activityFeed: [{
          type: 'follow',
          content: 'Started following Jane\'s Store',
          reference: mockSellerId,
          referenceModel: 'Seller',
          createdAt: new Date()
        }]
      });

      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        followers: []
      });

      await buyer.save();
      await seller.save();

      followSellerValidator.validateFollowSellerData.mockResolvedValue();
      notificationController.createNotification.mockResolvedValue();
      notificationController.sendNewFollowerEmail.mockResolvedValue();

      // Act
      const result = await followSellerService.followSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(result.buyerFollowingCount).toBe(1);

      // Verify that the old activity was removed and new one was added
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      const followActivities = updatedBuyer.activityFeed.filter(activity => 
        activity.type === 'follow' && 
        activity.referenceModel === 'Seller' &&
        activity.reference.toString() === mockSellerId.toString()
      );

      expect(followActivities).toHaveLength(1);
    });

    it('should handle email notification failure gracefully', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        activityFeed: []
      });

      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        followers: []
      });

      await buyer.save();
      await seller.save();

      followSellerValidator.validateFollowSellerData.mockResolvedValue();
      notificationController.createNotification.mockResolvedValue();
      notificationController.sendNewFollowerEmail.mockRejectedValue(new Error('Email failed'));

      // Act
      const result = await followSellerService.followSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(result).toBeDefined();
      expect(result.sellerFollowCount).toBe(1);
      expect(result.buyerFollowingCount).toBe(1);

      // Verify that the follow operation still succeeded despite email failure
      const updatedSeller = await Seller.findById(mockSellerId);
      expect(updatedSeller.followers).toHaveLength(1);
    });

    it('should include buyer address in follow data when available', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }],
        activityFeed: []
      });

      const seller = new Seller({
        _id: mockSellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        phoneNumber: '+2348012345679',
        storeName: 'Jane\'s Store',
        followers: []
      });

      await buyer.save();
      await seller.save();

      followSellerValidator.validateFollowSellerData.mockResolvedValue();
      notificationController.createNotification.mockResolvedValue();
      notificationController.sendNewFollowerEmail.mockResolvedValue();

      // Act
      const result = await followSellerService.followSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(result.followData.mainAddress).toBeDefined();
      expect(result.followData.mainAddress.country).toBe('Nigeria');
      expect(result.followData.mainAddress.city).toBe('Lagos');
      expect(result.followData.mainAddress.address1).toBe('123 Main Street');
      expect(result.followData.mainAddress.address2).toBe('Apt 4B');
      expect(result.followData.mainAddress.zipCode).toBe('100001');
    });
  });
}); 