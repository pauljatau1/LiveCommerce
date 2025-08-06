const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { listPaginatedFollowers, listFollowers, formatFollower, getPaginationOptions, getFilters } = require('@modules/buyer/services/getFollowers.service');
const Buyer = require('@modules/buyer/models/buyer.model');
const Seller = require('@models/Seller');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('getFollowers.service', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
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
    await Seller.deleteMany({});
  });

  describe('formatFollower', () => {
    it('should format follower correctly with storeName', () => {
      const mockFollower = {
        sellerId: {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          storeName: 'John\'s Electronics',
          businessName: 'Doe Enterprises',
          profileImage: { url: 'https://cdn.example.com/profile.jpg' },
          storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' }
        },
        createdAt: new Date('2024-01-15T10:30:00.000Z')
      };

      const result = formatFollower(mockFollower);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        type: 'seller',
        name: 'John\'s Electronics',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        isVerified: false,
        rating: 0,
        totalSales: 0,
        followersCount: 0,
        createdAt: new Date('2024-01-15T10:30:00.000Z')
      });
    });

    it('should format follower correctly with businessName when storeName is not available', () => {
      const mockFollower = {
        sellerId: {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          businessName: 'Doe Enterprises',
          storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' },
          profileImage: { url: 'https://cdn.example.com/profile.jpg' }
        },
        createdAt: new Date('2024-01-15T10:30:00.000Z')
      };

      const result = formatFollower(mockFollower);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        type: 'seller',
        name: 'Doe Enterprises',
        storeName: 'Doe Enterprises',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        isVerified: false,
        rating: 0,
        totalSales: 0,
        followersCount: 0,
        createdAt: new Date('2024-01-15T10:30:00.000Z')
      });
    });

    it('should handle missing profile images', () => {
      const mockFollower = {
        sellerId: {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'John',
          lastName: 'Doe',
          storeName: 'John\'s Electronics'
        },
        createdAt: new Date('2024-01-15T10:30:00.000Z')
      };

      const result = formatFollower(mockFollower);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        type: 'seller',
        name: 'John\'s Electronics',
        storeName: 'John\'s Electronics',
        businessName: 'Unknown Business',
        profileImage: null,
        isVerified: false,
        rating: 0,
        totalSales: 0,
        followersCount: 0,
        createdAt: new Date('2024-01-15T10:30:00.000Z')
      });
    });
  });

  describe('getPaginationOptions', () => {
    it('should return pagination options from request', () => {
      const req = {
        query: {
          page: '2',
          limit: '5'
        }
      };

      const result = getPaginationOptions(req);

      expect(result).toEqual({
        enabled: true,
        page: 2,
        limit: 5
      });
    });

    it('should return default pagination when no query parameters', () => {
      const req = {
        query: {}
      };

      const result = getPaginationOptions(req);

      expect(result).toEqual({
        enabled: false,
        page: 1,
        limit: 10
      });
    });
  });

  describe('getFilters', () => {
    it('should return filters from request', () => {
      const req = {
        query: {
          status: 'active',
          isAdmin: 'true'
        }
      };

      const result = getFilters(req);

      expect(result).toEqual({
        status: 'active',
        isAdmin: true
      });
    });

    it('should return empty object when no filters', () => {
      const req = {
        query: {}
      };

      const result = getFilters(req);

      expect(result).toEqual({});
    });
  });

  describe('listFollowers', () => {
    it('should successfully get followers without pagination', async () => {
      // Create test seller
      const seller = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' }
      });
      await seller.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'password123',
        followers: [{
          sellerId: seller._id,
          storeName: 'John\'s Electronics',
          followDate: new Date('2024-01-15T10:30:00.000Z')
        }]
      });
      await buyer.save();

      const result = await listFollowers(buyer._id.toString(), {});

      expect(result.data.followers).toHaveLength(1);
      expect(result.data.followers[0].id).toBe(seller._id.toString());
      expect(result.data.followers[0].type).toBe('seller');
      expect(result.data.followers[0].name).toBe('John\'s Electronics');
      expect(result.data.followers[0].storeName).toBe('John\'s Electronics');
      expect(result.pagination).toEqual({});
    });

    it('should handle buyer with no followers', async () => {
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'password123',
        followers: []
      });
      await buyer.save();

      const result = await listFollowers(buyer._id.toString(), {});

      expect(result.data.followers).toHaveLength(0);
      expect(result.pagination).toEqual({});
    });

    it('should throw NotFoundException when buyer not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439099');

      await expect(listFollowers(nonExistentId.toString(), {}))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('listPaginatedFollowers', () => {
    it('should successfully get paginated followers', async () => {
      // Create test sellers
      const seller1 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile1.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar1.jpg' }
      });
      await seller1.save();

      const seller2 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        firstName: 'Jane',
        lastName: 'Wilson',
        email: 'jane.wilson@example.com',
        phoneNumber: '+1234567891',
        password: 'password123',
        storeName: 'Jane\'s Store',
        businessName: 'Wilson Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile2.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar2.jpg' }
      });
      await seller2.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        username: 'bobsmith',
        password: 'password123',
        followers: [
          {
            sellerId: seller1._id,
            storeName: 'John\'s Electronics',
            followDate: new Date('2024-01-15T10:30:00.000Z')
          },
          {
            sellerId: seller2._id,
            storeName: 'Jane\'s Store',
            followDate: new Date('2024-01-16T11:30:00.000Z')
          }
        ]
      });
      await buyer.save();

      const result = await listPaginatedFollowers(buyer._id.toString(), { page: 1, limit: 1 });

      expect(result.data.followers).toHaveLength(1);
      expect(result.data.followers[0].id).toBe(seller1._id.toString());
      expect(result.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2
      });
    });

    it('should handle second page correctly', async () => {
      // Create test sellers
      const seller1 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile1.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar1.jpg' }
      });
      await seller1.save();

      const seller2 = new Seller({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        firstName: 'Jane',
        lastName: 'Wilson',
        email: 'jane.wilson@example.com',
        phoneNumber: '+1234567891',
        password: 'password123',
        storeName: 'Jane\'s Store',
        businessName: 'Wilson Enterprises',
        profileImage: { url: 'https://cdn.example.com/profile2.jpg' },
        storeAvatar: { url: 'https://cdn.example.com/avatar2.jpg' }
      });
      await seller2.save();

      // Create test buyer with followers
      const buyer = new Buyer({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        username: 'bobsmith',
        password: 'password123',
        followers: [
          {
            sellerId: seller1._id,
            storeName: 'John\'s Electronics',
            followDate: new Date('2024-01-15T10:30:00.000Z')
          },
          {
            sellerId: seller2._id,
            storeName: 'Jane\'s Store',
            followDate: new Date('2024-01-16T11:30:00.000Z')
          }
        ]
      });
      await buyer.save();

      const result = await listPaginatedFollowers(buyer._id.toString(), { page: 2, limit: 1 });

      expect(result.data.followers).toHaveLength(1);
      expect(result.data.followers[0].id).toBe(seller2._id.toString());
      expect(result.pagination).toEqual({
        page: 2,
        limit: 1,
        total: 2,
        pages: 2
      });
    });

    it('should throw NotFoundException when buyer not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439099');

      await expect(listPaginatedFollowers(nonExistentId.toString(), { page: 1, limit: 10 }))
        .rejects.toThrow(NotFoundException);
    });
  });
}); 