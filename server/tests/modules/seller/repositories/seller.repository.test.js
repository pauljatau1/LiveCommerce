const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the repository
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const Seller = require('@models/Seller');

describe('Seller Repository', () => {
  let mongoServer;

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
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Seller.deleteMany({});
  });

  describe('findAll', () => {
    it('should return all sellers when no filters provided', async () => {
      // Create test sellers
      const seller1 = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      const seller2 = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password456',
        phoneNumber: '0987654321',
        storeName: 'Jane Store'
      });

      await seller1.save();
      await seller2.save();

      const result = await sellerRepository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
      // Should exclude password field
      expect(result[0].password).toBeUndefined();
      expect(result[1].password).toBeUndefined();
    });

    it('should return filtered sellers when filters provided', async () => {
      // Create test sellers
      const seller1 = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      const seller2 = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password456',
        phoneNumber: '0987654321',
        storeName: 'Jane Store'
      });

      await seller1.save();
      await seller2.save();

      const result = await sellerRepository.findAll({ firstName: 'John' });

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('John');
    });

    it('should return empty array when no sellers exist', async () => {
      const result = await sellerRepository.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should save a new seller', async () => {
      const newSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });

      const result = await sellerRepository.save(newSeller);

      expect(result._id).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should find seller by email (case insensitive)', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const result = await sellerRepository.findByEmail('JOHN@EXAMPLE.COM');

      expect(result).toBeDefined();
      expect(result.email).toBe('john@example.com');
    });

    it('should return null when email not found', async () => {
      const result = await sellerRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('saveSeller', () => {
    it('should save a seller instance', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });

      const result = await sellerRepository.saveSeller(seller);

      expect(result._id).toBeDefined();
      expect(result.firstName).toBe('John');
    });
  });

  describe('findById', () => {
    it('should find seller by ID', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      const savedSeller = await seller.save();

      const result = await sellerRepository.findById(savedSeller._id);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
    });

    it('should return null when ID not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await sellerRepository.findById(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithFields', () => {
    it('should find seller by ID with specific fields', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      const savedSeller = await seller.save();

      const result = await sellerRepository.findByIdWithFields(savedSeller._id, 'firstName lastName');

      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it('should return null when ID not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await sellerRepository.findByIdWithFields(fakeId, 'firstName');

      expect(result).toBeNull();
    });
  });

  describe('findByAgoraUid', () => {
    it('should find seller by Agora UID', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store',
        agoraUid: 123456789
      });
      await seller.save();

      const result = await sellerRepository.findByAgoraUid(123456789);

      expect(result).toBeDefined();
      expect(result.agoraUid).toBe(123456789);
    });

    it('should return null when Agora UID not found', async () => {
      const result = await sellerRepository.findByAgoraUid(999999999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should update seller by ID', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      const savedSeller = await seller.save();

      const updateData = { firstName: 'Jane' };
      const result = await sellerRepository.findByIdAndUpdate(savedSeller._id, updateData);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Doe'); // Should remain unchanged
    });

    it('should return null when ID not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await sellerRepository.findByIdAndUpdate(fakeId, { firstName: 'Jane' });

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndDelete', () => {
    it('should delete seller by ID', async () => {
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      const savedSeller = await seller.save();

      const result = await sellerRepository.findByIdAndDelete(savedSeller._id);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');

      // Verify seller is deleted
      const deletedSeller = await Seller.findById(savedSeller._id);
      expect(deletedSeller).toBeNull();
    });

    it('should return null when ID not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await sellerRepository.findByIdAndDelete(fakeId);

      expect(result).toBeNull();
    });
  });
});
