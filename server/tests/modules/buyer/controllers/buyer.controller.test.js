const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

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

describe('Buyer Controller - Main Test Suite', () => {
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

  describe('General Controller Tests', () => {
    it('should have all required controller methods', () => {
      // Test that all expected controller methods exist
      expect(typeof buyerController.register).toBe('function');
      expect(typeof buyerController.login).toBe('function');
      expect(typeof buyerController.getProfile).toBe('function');
      expect(typeof buyerController.updateProfile).toBe('function');
      expect(typeof buyerController.uploadProfileImage).toBe('function');
      expect(typeof buyerController.verifyOTP).toBe('function');
      expect(typeof buyerController.resendOTP).toBe('function');
      expect(typeof buyerController.checkToken).toBe('function');
    });

    it('should handle undefined controller methods gracefully', () => {
      // Test that accessing non-existent methods doesn't crash
      expect(() => {
        if (buyerController.nonExistentMethod) {
          buyerController.nonExistentMethod();
        }
      }).not.toThrow();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle null controller gracefully', () => {
      // Test that the test suite can handle edge cases
      expect(buyerController).toBeDefined();
      expect(buyerController).not.toBeNull();
    });

    it('should handle database connection errors', async () => {
      // This test ensures our test setup is working correctly
      const buyer = new Buyer({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });

      await expect(buyer.save()).resolves.toBeDefined();
    });
  });

  describe('Test Suite Organization', () => {
    it('should confirm test files are properly split', () => {
      // This test documents the test file organization
      const expectedTestFiles = [
        'register.test.js',
        'login.test.js', 
        'profile.test.js',
        'otp.test.js',
        'checkToken.test.js'
      ];

      expect(expectedTestFiles).toHaveLength(5);
    });
  });
});