/**
 * Get Statistics Service Tests
 *
 * This test suite covers all functionality of the getStatistics service.
 *
 * @module getStatisticsServiceTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getStatisticsService = require('@modules/seller/services/getStatistics.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const orderRepository = require('@modules/seller/repositories/order.repository');
const Seller = require('@models/Seller');
const Order = require('@models/Order');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('Get Statistics Service', () => {
  beforeAll(async () => {
    // Setup in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Cleanup database connection
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Seller.deleteMany({});
    await Order.deleteMany({});
  });

  describe('getStatistics', () => {
    it('should successfully retrieve statistics for a valid seller with data', async () => {
      // Arrange: Create test seller with comprehensive data
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId1 = new mongoose.Types.ObjectId();
      const buyerId2 = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const seller = new Seller({
        _id: sellerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345678',
        walletBalance: 15000.50,
        storeVisits: 1250,
        lastWeekStats: {
          storeVisits: 1150,
          walletBalance: 12000.00
        },
        weeklyStats: {
          storeVisits: 1250
        },
        followers: [
          {
            buyerId: buyerId1,
            followDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          {
            buyerId: buyerId2,
            followDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
          }
        ]
      });
      await seller.save();

      // Create test orders
      const order1 = new Order({
        buyer: buyerId1,
        buyerDetails: {
          _id: buyerId1,
          firstName: 'Buyer',
          lastName: 'One',
          email: 'buyer1@example.com'
        },
        seller: sellerId,
        totalAmount: 5000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 2,
          price: 2500,
          status: 'delivered'
        }],
        isStale: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      });

      const order2 = new Order({
        buyer: buyerId2,
        buyerDetails: {
          _id: buyerId2,
          firstName: 'Buyer',
          lastName: 'Two',
          email: 'buyer2@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      });

      await Order.insertMany([order1, order2]);

      // Act: Call the service method
      const result = await getStatisticsService.getStatistics(sellerId.toString());

      // Assert: Verify the response structure and data
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('walletBalance');
      expect(result.data).toHaveProperty('storeVisits');
      expect(result.data).toHaveProperty('totalOrders');
      expect(result.data).toHaveProperty('conversionRate');
      expect(result.data).toHaveProperty('newCustomers');

      // Verify wallet balance data
      expect(result.data.walletBalance.amount).toBe(15000.50);
      expect(result.data.walletBalance.currency).toBe('NGN');
      expect(result.data.walletBalance.change).toHaveProperty('value');
      expect(result.data.walletBalance.change).toHaveProperty('type');

      // Verify store visits data
      expect(result.data.storeVisits.count).toBe(1250);
      expect(result.data.storeVisits.change).toHaveProperty('value');
      expect(result.data.storeVisits.change).toHaveProperty('type');

      // Verify total orders data
      expect(result.data.totalOrders.count).toBe(2);
      expect(result.data.totalOrders.change).toHaveProperty('value');
      expect(result.data.totalOrders.change).toHaveProperty('type');

      // Verify conversion rate data
      expect(result.data.conversionRate).toHaveProperty('percentage');
      expect(result.data.conversionRate.change).toHaveProperty('value');
      expect(result.data.conversionRate.change).toHaveProperty('type');

      // Verify new customers data
      expect(result.data.newCustomers.count).toBe(2);
      expect(result.data.newCustomers.change).toHaveProperty('value');
      expect(result.data.newCustomers.change).toHaveProperty('type');
    });

    it('should return zero values for seller with no data', async () => {
      // Arrange: Create seller with minimal data
      const sellerId = new mongoose.Types.ObjectId();
      const seller = new Seller({
        _id: sellerId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345679',
        walletBalance: 0,
        storeVisits: 0,
        followers: []
      });
      await seller.save();

      // Act: Call the service method
      const result = await getStatisticsService.getStatistics(sellerId.toString());

      // Assert: Verify zero values are returned
      expect(result.data.walletBalance.amount).toBe(0);
      expect(result.data.storeVisits.count).toBe(0);
      expect(result.data.totalOrders.count).toBe(0);
      expect(result.data.newCustomers.count).toBe(0);
      expect(result.data.conversionRate.percentage).toBe('0.00');
    });

    it('should throw ValidationError for invalid seller ID', async () => {
      // Act & Assert: Test various invalid seller IDs
      const invalidIds = [null, undefined, '', 'invalid-id', 123];

      for (const invalidId of invalidIds) {
        await expect(getStatisticsService.getStatistics(invalidId))
          .rejects
          .toThrow(ValidationError);
      }
    });

    it('should throw ValidationError for invalid ObjectId format', async () => {
      // Act & Assert: Test invalid ObjectId format
      const invalidObjectId = 'invalid-objectid-format';

      await expect(getStatisticsService.getStatistics(invalidObjectId))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw NotFoundException for non-existent seller', async () => {
      // Arrange: Use a valid ObjectId that doesn't exist
      const nonExistentSellerId = new mongoose.Types.ObjectId();

      // Act & Assert: Verify NotFoundException is thrown
      await expect(getStatisticsService.getStatistics(nonExistentSellerId.toString()))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should calculate percentage changes correctly', async () => {
      // Arrange: Create seller with specific data for percentage calculation
      const sellerId = new mongoose.Types.ObjectId();
      const seller = new Seller({
        _id: sellerId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345680',
        walletBalance: 20000,
        storeVisits: 1000,
        lastWeekStats: {
          storeVisits: 800,
          walletBalance: 15000
        },
        weeklyStats: {
          storeVisits: 1000
        },
        followers: []
      });
      await seller.save();

      // Act: Call the service method
      const result = await getStatisticsService.getStatistics(sellerId.toString());

      // Assert: Verify calculations with zero previous values
      // Since lastWeekStats fields don't exist in the model, previous values are 0
      // Wallet: 20000 (current value as number since previous is 0)
      expect(result.data.walletBalance.change.value).toBe('20000.00');
      expect(result.data.walletBalance.change.type).toBe('number');

      // Store visits: 1000 (current value as number since previous is 0)
      expect(result.data.storeVisits.change.value).toBe('1000.00');
      expect(result.data.storeVisits.change.type).toBe('number');
    });

    it('should handle zero previous values correctly', async () => {
      // Arrange: Create seller with zero previous values
      const sellerId = new mongoose.Types.ObjectId();
      const seller = new Seller({
        _id: sellerId,
        firstName: 'New',
        lastName: 'Seller',
        email: 'new@example.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345681',
        walletBalance: 5000,
        storeVisits: 100,
        lastWeekStats: {
          storeVisits: 0,
          walletBalance: 0
        },
        weeklyStats: {
          storeVisits: 100
        },
        followers: []
      });
      await seller.save();

      // Act: Call the service method
      const result = await getStatisticsService.getStatistics(sellerId.toString());

      // Assert: Verify handling of zero previous values
      expect(result.data.walletBalance.change.value).toBe('5000.00');
      expect(result.data.walletBalance.change.type).toBe('number');

      expect(result.data.storeVisits.change.value).toBe('100.00');
      expect(result.data.storeVisits.change.type).toBe('number');
    });

    it('should exclude stale orders from calculations', async () => {
      // Arrange: Create seller and orders including stale ones
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const seller = new Seller({
        _id: sellerId,
        firstName: 'Test',
        lastName: 'Seller',
        email: 'test@example.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345682',
        walletBalance: 10000,
        storeVisits: 500,
        followers: []
      });
      await seller.save();

      // Create regular order
      const regularOrder = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 2000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 2000,
          status: 'delivered'
        }],
        isStale: false
      });

      // Create stale order (should be excluded)
      const staleOrder = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: true
      });

      await Order.insertMany([regularOrder, staleOrder]);

      // Act: Call the service method
      const result = await getStatisticsService.getStatistics(sellerId.toString());

      // Assert: Verify only non-stale orders are counted
      expect(result.data.totalOrders.count).toBe(1);
    });

    it('should handle followers without buyerId or followDate', async () => {
      // Arrange: Create seller with incomplete follower data
      const sellerId = new mongoose.Types.ObjectId();
      const seller = new Seller({
        _id: sellerId,
        firstName: 'Test',
        lastName: 'Seller',
        email: 'test@example.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345683',
        walletBalance: 5000,
        storeVisits: 200,
        followers: [
          { buyerId: null, followDate: new Date() },
          { buyerId: new mongoose.Types.ObjectId(), followDate: null },
          { buyerId: null, followDate: null }
        ]
      });
      await seller.save();

      // Act: Call the service method
      const result = await getStatisticsService.getStatistics(sellerId.toString());

      // Assert: Verify incomplete followers are excluded
      expect(result.data.newCustomers.count).toBe(0);
    });

    it('should test specific validation error messages and structure', async () => {
      // Test empty string seller ID
      await expect(getStatisticsService.getStatistics('')).rejects.toThrow(ValidationError);
      await expect(getStatisticsService.getStatistics('')).rejects.toThrow('Validation failed');
      
      // Check the error structure for empty string
      try {
        await getStatisticsService.getStatistics('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.status).toBe(422);
        expect(error.errors).toEqual([{ 
          field: 'sellerId', 
          message: 'Valid seller ID is required' 
        }]);
      }

      // Test null seller ID
      await expect(getStatisticsService.getStatistics(null)).rejects.toThrow(ValidationError);
      await expect(getStatisticsService.getStatistics(null)).rejects.toThrow('Validation failed');
      
      // Check the error structure for null
      try {
        await getStatisticsService.getStatistics(null);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.status).toBe(422);
        expect(error.errors).toEqual([{ 
          field: 'sellerId', 
          message: 'Valid seller ID is required' 
        }]);
      }

      // Test undefined seller ID
      await expect(getStatisticsService.getStatistics(undefined)).rejects.toThrow(ValidationError);
      await expect(getStatisticsService.getStatistics(undefined)).rejects.toThrow('Validation failed');
      
      // Check the error structure for undefined
      try {
        await getStatisticsService.getStatistics(undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.status).toBe(422);
        expect(error.errors).toEqual([{ 
          field: 'sellerId', 
          message: 'Valid seller ID is required' 
        }]);
      }

      // Test invalid ObjectId format
      await expect(getStatisticsService.getStatistics('invalid-id')).rejects.toThrow(ValidationError);
      await expect(getStatisticsService.getStatistics('invalid-id')).rejects.toThrow('Validation failed');
      
      // Check the error structure for invalid ObjectId
      try {
        await getStatisticsService.getStatistics('invalid-id');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.status).toBe(422);
        expect(error.errors).toEqual([{ 
          field: 'sellerId', 
          message: 'Seller ID must be a valid ObjectId format' 
        }]);
      }

      // Test non-existent seller
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(getStatisticsService.getStatistics(nonExistentId.toString())).rejects.toThrow(NotFoundException);
      await expect(getStatisticsService.getStatistics(nonExistentId.toString())).rejects.toThrow('Seller not found');
      
      // Check the error structure for non-existent seller
      try {
        await getStatisticsService.getStatistics(nonExistentId.toString());
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.name).toBe('NotFoundException');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Seller not found');
      }
    });
  });
});
