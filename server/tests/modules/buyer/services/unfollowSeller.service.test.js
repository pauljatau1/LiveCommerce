const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const unfollowSellerService = require('@modules/buyer/services/unfollowSeller.service');

// Import the Buyer and Seller models
const Buyer = require('@modules/buyer/models/buyer.model');
const Seller = require('@models/Seller');

// Mock the validator
jest.mock('@modules/buyer/validators/unfollowSeller.validator', () => ({
  validateUnfollowSellerData: jest.fn()
}));

// Import the mocked modules
const unfollowSellerValidator = require('@modules/buyer/validators/unfollowSeller.validator');

let mongoServer;

describe('Unfollow Seller Service', () => {
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

  describe('unfollowSeller', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();
    const mockSellerId = new mongoose.Types.ObjectId();

    it('should successfully unfollow a seller', async () => {
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

      unfollowSellerValidator.validateUnfollowSellerData.mockResolvedValue();

      // Act
      const result = await unfollowSellerService.unfollowSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(unfollowSellerValidator.validateUnfollowSellerData).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockSellerId.toString()
      );

      expect(result).toHaveProperty('sellerFollowCount');
      expect(result).toHaveProperty('buyerFollowingCount');

      expect(result.sellerFollowCount).toBe(0);
      expect(result.buyerFollowingCount).toBe(0);

      // Verify buyer was removed from seller's followers
      const updatedSeller = await Seller.findById(mockSellerId);
      expect(updatedSeller.followers).toHaveLength(0);

      // Verify follow activity was removed from buyer's activity feed
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      const followActivities = updatedBuyer.activityFeed.filter(activity => 
        activity.type === 'follow' && 
        activity.referenceModel === 'Seller' &&
        activity.reference.toString() === mockSellerId.toString()
      );
      expect(followActivities).toHaveLength(0);
    });

    it('should throw error if not following the seller', async () => {
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

      unfollowSellerValidator.validateUnfollowSellerData.mockResolvedValue();

      // Act & Assert
      await expect(
        unfollowSellerService.unfollowSeller(mockBuyerId.toString(), mockSellerId.toString())
      ).rejects.toThrow('Not following this seller');
    });

    it('should handle buyer without activity feed', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        activityFeed: null
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

      unfollowSellerValidator.validateUnfollowSellerData.mockResolvedValue();

      // Act
      const result = await unfollowSellerService.unfollowSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(result.sellerFollowCount).toBe(0);
      expect(result.buyerFollowingCount).toBe(0);

      // Verify buyer was removed from seller's followers
      const updatedSeller = await Seller.findById(mockSellerId);
      expect(updatedSeller.followers).toHaveLength(0);
    });

    it('should handle seller with malformed verificationDocuments', async () => {
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
        followers: [{
          buyerId: mockBuyerId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          followDate: new Date(),
          totalOrders: 0
        }],
        verificationDocuments: [] // Malformed data
      });

      await buyer.save();
      await seller.save();

      unfollowSellerValidator.validateUnfollowSellerData.mockResolvedValue();

      // Act
      const result = await unfollowSellerService.unfollowSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(result.sellerFollowCount).toBe(0);
      expect(result.buyerFollowingCount).toBe(0);

      // Verify verificationDocuments was fixed
      const updatedSeller = await Seller.findById(mockSellerId);
      expect(updatedSeller.verificationDocuments.type).toBeFalsy();
      expect(updatedSeller.verificationDocuments.documents).toEqual([]);
    });

    it('should handle multiple follow activities and remove only the specific one', async () => {
      // Arrange
      const otherSellerId = new mongoose.Types.ObjectId();
      
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        activityFeed: [
          {
            type: 'follow',
            content: 'Started following Jane\'s Store',
            reference: mockSellerId,
            referenceModel: 'Seller',
            createdAt: new Date()
          },
          {
            type: 'follow',
            content: 'Started following Other Store',
            reference: otherSellerId,
            referenceModel: 'Seller',
            createdAt: new Date()
          }
        ]
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

      unfollowSellerValidator.validateUnfollowSellerData.mockResolvedValue();

      // Act
      const result = await unfollowSellerService.unfollowSeller(mockBuyerId.toString(), mockSellerId.toString());

      // Assert
      expect(result.sellerFollowCount).toBe(0);
      expect(result.buyerFollowingCount).toBe(1); // Should still have 1 follow activity

      // Verify only the specific follow activity was removed
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      const followActivities = updatedBuyer.activityFeed.filter(activity => 
        activity.type === 'follow' && 
        activity.referenceModel === 'Seller'
      );
      expect(followActivities).toHaveLength(1);
      expect(followActivities[0].reference.toString()).toBe(otherSellerId.toString());
    });
  });
}); 