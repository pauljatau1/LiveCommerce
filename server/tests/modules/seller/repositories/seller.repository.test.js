/**
 * Seller Repository Tests
 *
 * This test suite covers all functionality of the seller repository
 * including the new methods for profile functionality.
 *
 * @module sellerRepositoryTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const Seller = require('@models/Seller');
const Buyer = require('@models/Buyer');

let mongoServer;

describe('Seller Repository', () => {
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
    await Seller.deleteMany({});
    await Buyer.deleteMany({});
  });

  const mockSellerData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword123',
    phoneNumber: '+2348012345678',
    businessName: 'John\'s Store Ltd',
    businessType: 'Retail',
    accountType: 'business',
    categories: [
      { name: 'Electronics' },
      { name: 'Clothing' },
      { name: 'Books' }
    ],
    followers: [
      { buyerId: '507f1f77bcf86cd799439011', firstName: 'Alice', lastName: 'Smith' },
      { buyerId: '507f1f77bcf86cd799439012', firstName: 'Bob', lastName: 'Johnson' }
    ]
  };

  const mockBuyerData = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@example.com',
    password: 'hashedPassword123',
    phoneNumber: '+2348012345679',
    followers: [
      { sellerId: '507f1f77bcf86cd799439013', firstName: 'John', lastName: 'Doe' }
    ]
  };

  describe('findAll', () => {
    it('should retrieve all sellers excluding sensitive fields', async () => {
      const seller1 = new Seller(mockSellerData);
      const seller2 = new Seller({
        ...mockSellerData,
        email: 'jane.doe@example.com',
        businessName: 'Jane\'s Store',
        firstName: 'Jane',
        lastName: 'Smith'
      });
      
      await seller1.save();
      await seller2.save();

      const result = await sellerRepository.findAll();
      
      expect(result).toHaveLength(2);
      expect(result[0].password).toBeUndefined();
      expect(result[0].__v).toBeUndefined();
      expect(result[0]).toHaveProperty('firstName');
      expect(result[0]).toHaveProperty('email');
    });

    it('should return empty array when no sellers exist', async () => {
      const result = await sellerRepository.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should save a new seller', async () => {
      const newSeller = new Seller(mockSellerData);
      const result = await sellerRepository.save(newSeller);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result._id).toBeDefined();
    });
  });

  describe('findByEmail', () => {
    it('should find seller by email (case insensitive)', async () => {
      const seller = new Seller(mockSellerData);
      await seller.save();

      const result = await sellerRepository.findByEmail('JOHN.DOE@EXAMPLE.COM');
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should return null when seller email not found', async () => {
      const result = await sellerRepository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('saveSeller', () => {
    it('should save a seller instance', async () => {
      const sellerInstance = new Seller(mockSellerData);
      const result = await sellerRepository.saveSeller(sellerInstance);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result._id).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find seller by ID', async () => {
      const seller = new Seller(mockSellerData);
      await seller.save();

      const result = await sellerRepository.findById(seller._id);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should return null when seller ID not found', async () => {
      const nonExistentId = '507f1f77bcf86cd799439014';
      const result = await sellerRepository.findById(nonExistentId);
      expect(result).toBeNull();
    });
  });

  describe('findByIdWithFields', () => {
    it('should find seller by ID with specific fields selected', async () => {
      const seller = new Seller(mockSellerData);
      await seller.save();

      const fields = { firstName: 1, lastName: 1, email: 1 };
      const result = await sellerRepository.findByIdWithFields(seller._id, fields);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.phoneNumber).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it('should return null when seller ID not found with fields', async () => {
      const nonExistentId = '507f1f77bcf86cd799439015';
      const fields = { firstName: 1, lastName: 1 };
      const result = await sellerRepository.findByIdWithFields(nonExistentId, fields);
      expect(result).toBeNull();
    });
  });

  describe('findByAgoraUid', () => {
    it('should find seller by Agora UID', async () => {
      const agoraUid = 123456789;
      const sellerWithAgora = new Seller({
        ...mockSellerData,
        agoraUid: agoraUid
      });
      await sellerWithAgora.save();

      const result = await sellerRepository.findByAgoraUid(agoraUid);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.agoraUid).toBe(agoraUid);
    });

    it('should return null when Agora UID not found', async () => {
      const result = await sellerRepository.findByAgoraUid(999999999);
      expect(result).toBeNull();
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should update seller by ID', async () => {
      const seller = new Seller(mockSellerData);
      await seller.save();

      const updateData = { businessName: 'Updated Store Name' };
      const result = await sellerRepository.findByIdAndUpdate(seller._id, updateData);
      
      expect(result).toBeDefined();
      expect(result.businessName).toBe('Updated Store Name');
      expect(result.firstName).toBe('John'); // Other fields should remain unchanged
      expect(result.lastName).toBe('Doe');
    });

    it('should return null when updating non-existent seller', async () => {
      const nonExistentId = '507f1f77bcf86cd799439016';
      const updateData = { businessName: 'Updated Store Name' };
      const result = await sellerRepository.findByIdAndUpdate(nonExistentId, updateData);
      expect(result).toBeNull();
    });
  });

  describe('findByIdAndDelete', () => {
    it('should delete seller by ID', async () => {
      const seller = new Seller(mockSellerData);
      await seller.save();

      const result = await sellerRepository.findByIdAndDelete(seller._id);
      
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');

      // Verify seller was deleted
      const deletedSeller = await Seller.findById(seller._id);
      expect(deletedSeller).toBeNull();
    });

    it('should return null when deleting non-existent seller', async () => {
      const nonExistentId = '507f1f77bcf86cd799439017';
      const result = await sellerRepository.findByIdAndDelete(nonExistentId);
      expect(result).toBeNull();
    });
  });

  describe('getCategoriesCount', () => {
    it('should return correct count of categories', async () => {
      const seller = new Seller(mockSellerData);
      await seller.save();

      const result = await sellerRepository.getCategoriesCount(seller._id);
      expect(result).toBe(3);
    });

    it('should return 0 when seller has no categories', async () => {
      const sellerWithoutCategories = new Seller({
        ...mockSellerData,
        categories: []
      });
      await sellerWithoutCategories.save();

      const result = await sellerRepository.getCategoriesCount(sellerWithoutCategories._id);
      expect(result).toBe(0);
    });

    it('should return 0 when seller not found', async () => {
      const nonExistentId = '507f1f77bcf86cd799439018';
      const result = await sellerRepository.getCategoriesCount(nonExistentId);
      expect(result).toBe(0);
    });
  });
});
