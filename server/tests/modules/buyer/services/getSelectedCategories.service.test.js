const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const getSelectedCategoriesService = require('@modules/buyer/services/getSelectedCategories.service');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Import the repository
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

// Import error classes
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('Get Selected Categories Service', () => {
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
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('getSelectedCategories', () => {
    let testBuyer;

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
    });

    it('should retrieve selected categories successfully', async () => {
      const result = await getSelectedCategoriesService.getSelectedCategories(testBuyer._id.toString());

      expect(result).toEqual({
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
      });
    });

    it('should handle buyer not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(
        getSelectedCategoriesService.getSelectedCategories(nonExistentId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty selected categories', async () => {
      // Create buyer without selected categories
      const emptyBuyer = new Buyer({
        firstName: 'Empty',
        lastName: 'User',
        email: 'empty@example.com',
        username: 'emptyuser',
      phoneNumber: '+2348012345678',
        password: 'password123',
        selectedCategories: []
      });

      await emptyBuyer.save();

      const result = await getSelectedCategoriesService.getSelectedCategories(emptyBuyer._id.toString());

      expect(result).toEqual({
        categories: []
      });
    });

    it('should handle buyer with null selected categories', async () => {
      // Create buyer with null selected categories
      const nullBuyer = new Buyer({
        firstName: 'Null',
        lastName: 'User',
        email: 'null@example.com',
        username: 'nulluser',
      phoneNumber: '+2348012345678',
        password: 'password123',
        selectedCategories: null
      });

      await nullBuyer.save();

      const result = await getSelectedCategoriesService.getSelectedCategories(nullBuyer._id.toString());

      expect(result).toEqual({
        categories: []
      });
    });

    it('should handle repository errors', async () => {
      // Mock the repository to throw an error
      const originalFindByIdWithSelectedCategories = buyerRepository.findByIdWithSelectedCategories;
      buyerRepository.findByIdWithSelectedCategories = jest.fn().mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        getSelectedCategoriesService.getSelectedCategories(testBuyer._id.toString())
      ).rejects.toThrow('Database connection error');

      // Restore the original method
      buyerRepository.findByIdWithSelectedCategories = originalFindByIdWithSelectedCategories;
    });

    it('should handle invalid buyer ID format', async () => {
      await expect(
        getSelectedCategoriesService.getSelectedCategories('invalid-id')
      ).rejects.toThrow();
    });

    it('should format categories correctly with nested subcategories', async () => {
      // Create buyer with complex category structure
      const complexBuyer = new Buyer({
        firstName: 'Complex',
        lastName: 'User',
        email: 'complex@example.com',
        username: 'complexuser',
        password: 'password123',
        selectedCategories: [
          {
            name: 'Technology',
            subCategories: [
              { name: 'Computers' },
              { name: 'Mobile Devices' },
              { name: 'Accessories' }
            ]
          }
        ]
      });

      await complexBuyer.save();

      const result = await getSelectedCategoriesService.getSelectedCategories(complexBuyer._id.toString());

      expect(result).toEqual({
        categories: [
          {
            name: 'Technology',
            subCategories: [
              { name: 'Computers' },
              { name: 'Mobile Devices' },
              { name: 'Accessories' }
            ]
          }
        ]
      });
    });
  });
}); 