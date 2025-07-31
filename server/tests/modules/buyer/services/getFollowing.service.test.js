const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getFollowingService = require('../../../../src/modules/buyer/services/getFollowing.service');
const buyerRepository = require('../../../../src/modules/buyer/repositories/buyer.repository');

// Mock the buyer repository
jest.mock('../../../../src/modules/buyer/repositories/buyer.repository');

describe('getFollowing.service', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start MongoDB Memory Server with compatible version for Debian 12
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
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatFollowingSeller', () => {
    it('should format seller data correctly', () => {
      const seller = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'John',
        lastName: 'Doe',
        storeName: 'John\'s Electronics',
        businessName: 'Doe Enterprises',
        storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' },
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        followers: [
          {
            buyerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
            followDate: new Date('2024-01-15T10:30:00.000Z')
          }
        ]
      };

      const buyerId = '507f1f77bcf86cd799439012';
      const result = getFollowingService.formatFollowingSeller(seller, buyerId);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        type: 'seller',
        name: 'John Doe',
        storeName: 'John\'s Electronics',
        profileImage: 'https://cdn.example.com/avatar.jpg',
        followDate: new Date('2024-01-15T10:30:00.000Z')
      });
    });

    it('should return null for seller without matching follower data', () => {
      const seller = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'John',
        lastName: 'Doe',
        followers: [
          {
            buyerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
            followDate: new Date('2024-01-15T10:30:00.000Z')
          }
        ]
      };

      const buyerId = '507f1f77bcf86cd799439012';
      const result = getFollowingService.formatFollowingSeller(seller, buyerId);

      expect(result).toBeNull();
    });

    it('should return null for null seller', () => {
      const result = getFollowingService.formatFollowingSeller(null, 'buyerId');
      expect(result).toBeNull();
    });
  });

  describe('formatFollowingBuyer', () => {
    it('should return null as buyers do not follow other buyers', () => {
      const buyer = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'Jane',
        lastName: 'Smith',
        profileImage: { url: 'https://cdn.example.com/profile.jpg' },
        followers: [
          {
            buyerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
            followDate: new Date('2024-01-15T10:30:00.000Z')
          }
        ]
      };

      const buyerId = '507f1f77bcf86cd799439012';
      const result = getFollowingService.formatFollowingBuyer(buyer, buyerId);

      expect(result).toBeNull();
    });
  });

  describe('getPaginationOptions', () => {
    it('should return pagination options from request', () => {
      const req = {
        query: {
          page: '2',
          limit: '15'
        }
      };

      const result = getFollowingService.getPaginationOptions(req);

      expect(result).toEqual({
        enabled: true,
        page: 2,
        limit: 15
      });
    });

    it('should return default pagination options when not provided', () => {
      const req = {
        query: {}
      };

      const result = getFollowingService.getPaginationOptions(req);

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

      const result = getFollowingService.getFilters(req);

      expect(result).toEqual({
        status: 'active',
        isAdmin: true
      });
    });

    it('should return empty filters when not provided', () => {
      const req = {
        query: {}
      };

      const result = getFollowingService.getFilters(req);

      expect(result).toEqual({});
    });
  });

  describe('listPaginatedFollowing', () => {
    it('should return paginated following data', async () => {
      const mockSellers = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          firstName: 'John',
          lastName: 'Doe',
          storeName: 'John\'s Store',
          followers: [
            {
              buyerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
              followDate: new Date('2024-01-15T10:30:00.000Z')
            }
          ]
        }
      ];

      buyerRepository.findSellersFollowingByBuyer.mockResolvedValue(mockSellers);
      buyerRepository.findBuyersFollowingByBuyer.mockResolvedValue([]);

      const buyerId = '507f1f77bcf86cd799439012';
      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      const result = await getFollowingService.listPaginatedFollowing(buyerId, params);

      expect(result).toEqual({
        data: {
          following: [
            {
              id: '507f1f77bcf86cd799439011',
              type: 'seller',
              name: 'John Doe',
              storeName: 'John\'s Store',
              profileImage: undefined,
              followDate: new Date('2024-01-15T10:30:00.000Z')
            }
          ]
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      });

      expect(buyerRepository.findSellersFollowingByBuyer).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findBuyersFollowingByBuyer).toHaveBeenCalledWith(buyerId);
    });

    it('should handle empty following lists', async () => {
      buyerRepository.findSellersFollowingByBuyer.mockResolvedValue([]);
      buyerRepository.findBuyersFollowingByBuyer.mockResolvedValue([]);

      const buyerId = '507f1f77bcf86cd799439012';
      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      const result = await getFollowingService.listPaginatedFollowing(buyerId, params);

      expect(result).toEqual({
        data: {
          following: []
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      });
    });
  });

  describe('listFollowing', () => {
    it('should return following data without pagination', async () => {
      const mockSellers = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          firstName: 'John',
          lastName: 'Doe',
          storeName: 'John\'s Store',
          followers: [
            {
              buyerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
              followDate: new Date('2024-01-15T10:30:00.000Z')
            }
          ]
        }
      ];

      buyerRepository.findSellersFollowingByBuyer.mockResolvedValue(mockSellers);
      buyerRepository.findBuyersFollowingByBuyer.mockResolvedValue([]);

      const buyerId = '507f1f77bcf86cd799439012';
      const filters = {};

      const result = await getFollowingService.listFollowing(buyerId, filters);

      expect(result).toEqual({
        data: {
          following: [
            {
              id: '507f1f77bcf86cd799439011',
              type: 'seller',
              name: 'John Doe',
              storeName: 'John\'s Store',
              profileImage: undefined,
              followDate: new Date('2024-01-15T10:30:00.000Z')
            }
          ]
        },
        pagination: {}
      });

      expect(buyerRepository.findSellersFollowingByBuyer).toHaveBeenCalledWith(buyerId);
      expect(buyerRepository.findBuyersFollowingByBuyer).toHaveBeenCalledWith(buyerId);
    });

    it('should handle empty following lists', async () => {
      buyerRepository.findSellersFollowingByBuyer.mockResolvedValue([]);
      buyerRepository.findBuyersFollowingByBuyer.mockResolvedValue([]);

      const buyerId = '507f1f77bcf86cd799439012';
      const filters = {};

      const result = await getFollowingService.listFollowing(buyerId, filters);

      expect(result).toEqual({
        data: {
          following: []
        },
        pagination: {}
      });
    });
  });
}); 