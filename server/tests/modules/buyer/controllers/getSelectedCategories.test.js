const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - getSelectedCategories', () => {
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
  });

  describe('getSelectedCategories', () => {
    let testBuyer;
    let authToken;

    beforeEach(async () => {
      // Create a test buyer with selected categories
      testBuyer = new Buyer({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          },
          {
            name: 'Fashion',
            subCategories: [
              { name: 'Men\'s Clothing' },
              { name: 'Women\'s Clothing' }
            ]
          }
        ]
      });

      await testBuyer.save();

      // Generate JWT token for authentication
      authToken = jwt.sign(
        { id: testBuyer._id, role: 'Buyer' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should retrieve selected categories successfully', async () => {
      const req = {
        user: { id: testBuyer._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getSelectedCategories(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        {
          categories: [
            {
              name: 'Electronics',
              subCategories: [
                { name: 'Smartphones' },
                { name: 'Laptops' }
              ]
            },
            {
              name: 'Fashion',
              subCategories: [
                { name: 'Men\'s Clothing' },
                { name: 'Women\'s Clothing' }
              ]
            }
          ]
        },
        'Selected categories retrieved successfully'
      );
    });

    it('should handle buyer not found', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getSelectedCategories(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Buyer not found'
        })
      );
    });

    it('should handle empty selected categories', async () => {
      // Create buyer without selected categories
      const emptyBuyer = new Buyer({
        firstName: 'Empty',
        lastName: 'User',
        email: 'empty@example.com',
        username: 'emptyuser',
        password: 'password123',
        selectedCategories: []
      });

      await emptyBuyer.save();

      const req = {
        user: { id: emptyBuyer._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getSelectedCategories(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        {
          categories: []
        },
        'Selected categories retrieved successfully'
      );
    });

    it('should handle service errors', async () => {
      // Mock the service to throw an error
      const originalService = require('@modules/buyer/services/getSelectedCategories.service');
      jest.spyOn(originalService, 'getSelectedCategories').mockRejectedValue(
        new Error('Database connection error')
      );

      const req = {
        user: { id: testBuyer._id.toString() }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getSelectedCategories(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database connection error'
        })
      );

      // Restore the original service
      originalService.getSelectedCategories.mockRestore();
    });
  });
}); 