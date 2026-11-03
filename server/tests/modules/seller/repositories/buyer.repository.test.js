/**
 * Buyer Repository Tests
 *
 * This test suite covers all functionality of the buyer repository
 * for seller-specific operations.
 *
 * @module buyerRepositoryTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const buyerRepository = require('@modules/seller/repositories/buyer.repository');
const Buyer = require('@models/Buyer');

let mongoServer;

describe('Buyer Repository', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Buyer.deleteMany({});
  });

  const mockBuyerData = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@example.com',
    password: 'hashedPassword123',
    phoneNumber: '+2348012345679',
    followers: [
      {
        sellerId: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        followDate: new Date()
      }
    ]
  };

  describe('countBuyersFollowingSeller', () => {
    it('should return correct count of buyers following a seller', async () => {
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      const result = await buyerRepository.countBuyersFollowingSeller('507f1f77bcf86cd799439011');
      expect(result).toBe(1);
    });

    it('should return 0 when no buyers are following seller', async () => {
      const sellerWithNoFollowers = '507f1f77bcf86cd799439012';
      const result = await buyerRepository.countBuyersFollowingSeller(sellerWithNoFollowers);
      expect(result).toBe(0);
    });

    it('should count multiple buyers following the same seller', async () => {
      const buyer1 = new Buyer(mockBuyerData);
      const buyer2 = new Buyer({
        ...mockBuyerData,
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bob_johnson',
        email: 'bob.johnson@example.com',
        phoneNumber: '+2348012345680',
        followers: [
          {
            sellerId: '507f1f77bcf86cd799439011',
            firstName: 'John',
            lastName: 'Doe',
            followDate: new Date()
          }
        ]
      });
      
      await buyer1.save();
      await buyer2.save();

      const result = await buyerRepository.countBuyersFollowingSeller('507f1f77bcf86cd799439011');
      expect(result).toBe(2);
    });

    it('should not count buyers following other sellers', async () => {
      const buyer1 = new Buyer(mockBuyerData);
      const buyerFollowingOtherSeller = new Buyer({
        ...mockBuyerData,
        firstName: 'Charlie',
        lastName: 'Brown',
        username: 'charlie_brown',
        email: 'charlie.brown@example.com',
        phoneNumber: '+2348012345681',
        followers: [
          {
            sellerId: '507f1f77bcf86cd799439013',
            firstName: 'Jane',
            lastName: 'Wilson',
            followDate: new Date()
          }
        ]
      });
      
      await buyer1.save();
      await buyerFollowingOtherSeller.save();

      const result = await buyerRepository.countBuyersFollowingSeller('507f1f77bcf86cd799439011');
      expect(result).toBe(1); // Should still be 1 for the original seller
    });

    it('should handle buyers with multiple followers', async () => {
      const buyer1 = new Buyer(mockBuyerData);
      const buyerWithMultipleFollowers = new Buyer({
        ...mockBuyerData,
        firstName: 'David',
        lastName: 'Miller',
        username: 'david_miller',
        email: 'david.miller@example.com',
        phoneNumber: '+2348012345682',
        followers: [
          {
            sellerId: '507f1f77bcf86cd799439011',
            firstName: 'John',
            lastName: 'Doe',
            followDate: new Date()
          },
          {
            sellerId: '507f1f77bcf86cd799439014',
            firstName: 'Jane',
            lastName: 'Wilson',
            followDate: new Date()
          }
        ]
      });
      
      await buyer1.save();
      await buyerWithMultipleFollowers.save();

      const result = await buyerRepository.countBuyersFollowingSeller('507f1f77bcf86cd799439011');
      expect(result).toBe(2); // Should count both buyers following the seller
    });

    it('should handle buyers with empty followers array', async () => {
      const buyer1 = new Buyer(mockBuyerData);
      const buyerWithNoFollowers = new Buyer({
        ...mockBuyerData,
        firstName: 'Eve',
        lastName: 'Davis',
        username: 'eve_davis',
        email: 'eve.davis@example.com',
        phoneNumber: '+2348012345683',
        followers: []
      });
      
      await buyer1.save();
      await buyerWithNoFollowers.save();

      const result = await buyerRepository.countBuyersFollowingSeller('507f1f77bcf86cd799439011');
      expect(result).toBe(1); // Should still be 1 for the original buyer
    });

    it('should handle buyers with undefined followers', async () => {
      const buyer1 = new Buyer(mockBuyerData);
      const { followers, ...buyerDataWithoutFollowers } = mockBuyerData;
      const buyerWithUndefinedFollowers = new Buyer({
        ...buyerDataWithoutFollowers,
        firstName: 'Frank',
        lastName: 'Garcia',
        username: 'frank_garcia',
        email: 'frank.garcia@example.com',
        phoneNumber: '+2348012345684'
        // followers field intentionally omitted
      });
      
      await buyer1.save();
      await buyerWithUndefinedFollowers.save();

      const result = await buyerRepository.countBuyersFollowingSeller('507f1f77bcf86cd799439011');
      expect(result).toBe(1); // Should still be 1 for the original buyer
    });

    it('should handle case sensitivity in seller ID matching', async () => {
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      const stringSellerId = '507f1f77bcf86cd799439011';
      const upperCaseSellerId = stringSellerId.toUpperCase();

      const resultWithString = await buyerRepository.countBuyersFollowingSeller(stringSellerId);
      const resultWithUpperCase = await buyerRepository.countBuyersFollowingSeller(upperCaseSellerId);
      
      expect(resultWithString).toBe(1);
      expect(resultWithUpperCase).toBe(1); // MongoDB ObjectId comparison should work regardless of case
    });
  });
});
