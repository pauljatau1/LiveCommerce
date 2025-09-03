const { getPaginatedSellersToFollow } = require('@modules/buyer/services/getSellersToFollow.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const sellerRepository = require('@modules/buyer/repositories/seller.repository');
const ValidationError = require('@utils/errors/ValidationError');
const getSellersToFollowValidator = require('@modules/buyer/validators/getSellersToFollow.validator');

// Mock the repositories
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/repositories/seller.repository');
jest.mock('@modules/buyer/validators/getSellersToFollow.validator', () => ({
  validateGetSellersToFollowData: jest.fn()
}));

describe('getSellersToFollow.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSellersToFollowValidator.validateGetSellersToFollowData.mockResolvedValue();
  });

  describe('getSellersToFollow', () => {
    it('should return sellers with pagination when called with valid parameters', async () => {
      // Mock data
      const mockSellers = [
        {
          _id: 'seller1',
          storeName: 'Fashion Store',
          businessName: 'Fashion Store Ltd',
          aboutStore: 'Premium fashion items',
          storeAvatar: { url: 'https://example.com/avatar1.jpg' },
          categories: [{ name: 'Fashion' }],
          stats: { averageRating: 4.5, totalReviews: 100 },
          followers: [{}, {}, {}],
          isVerified: true,
          isFeatured: false,
          createdAt: new Date('2023-01-15')
        },
        {
          _id: 'seller2',
          storeName: 'Electronics Store',
          businessName: 'Electronics Store Ltd',
          aboutStore: 'Latest electronics',
          storeAvatar: { url: 'https://example.com/avatar2.jpg' },
          categories: [{ name: 'Electronics' }],
          stats: { averageRating: 4.2, totalReviews: 80 },
          followers: [{}, {}],
          isVerified: false,
          isFeatured: true,
          createdAt: new Date('2023-01-10')
        }
      ];

      const mockFollowedSellerIds = ['seller3', 'seller4'];

      // Mock repository methods
      sellerRepository.findFollowedSellerIds.mockResolvedValue(mockFollowedSellerIds);
      sellerRepository.countSellersToFollow.mockResolvedValue(50);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);
      sellerRepository.findSellersToFollowRandomized.mockResolvedValue(mockSellers);

      // Test parameters
      const buyerId = 'buyer123';

      // Execute service
      const result = await getPaginatedSellersToFollow(buyerId, {
        page: 1,
        limit: 10,
        filters: {
          search: 'fashion',
          category: 'clothing',
          sort: 'rating'
        }
      });

      // Verify repository calls
      expect(sellerRepository.findFollowedSellerIds).toHaveBeenCalledWith('buyer123');
      expect(sellerRepository.countSellersToFollow).toHaveBeenCalledWith(
        expect.objectContaining({
          isDisabled: false,
          $or: [
            { storeName: { $regex: 'fashion', $options: 'i' } },
            { businessName: { $regex: 'fashion', $options: 'i' } }
          ],
          'categories.name': { $regex: 'clothing', $options: 'i' },
          _id: { $nin: mockFollowedSellerIds }
        })
      );
      expect(sellerRepository.findSellersToFollowRandomized).toHaveBeenCalledWith(
        expect.any(Object),
        10,
        expect.any(Number)
      );

      // Verify response structure
      expect(result).toHaveProperty('data.sellers');
      expect(result).toHaveProperty('pagination');
      expect(result.data.sellers).toHaveLength(2);
      expect(result.pagination).toEqual({
        totalSellers: 50,
        totalPages: 5,
        currentPage: 1,
        hasMore: true,
        hasPrevious: false
      });

      // Verify transformed seller data (order may vary due to shuffling)
      expect(result.data.sellers).toHaveLength(2);
      expect(result.data.sellers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: 'seller1',
            storeName: 'Fashion Store',
            businessName: 'Fashion Store Ltd',
            aboutStore: 'Premium fashion items',
            storeAvatar: { url: 'https://example.com/avatar1.jpg' },
            categories: [{ name: 'Fashion' }],
            stats: { averageRating: 4.5, totalReviews: 100 },
            followerCount: 3,
            isVerified: true,
            isFeatured: false,
            createdAt: expect.any(Date)
          }),
          expect.objectContaining({
            _id: 'seller2',
            storeName: 'Electronics Store',
            businessName: 'Electronics Store Ltd',
            aboutStore: 'Latest electronics',
            storeAvatar: { url: 'https://example.com/avatar2.jpg' },
            categories: [{ name: 'Electronics' }],
            stats: { averageRating: 4.2, totalReviews: 80 },
            followerCount: 2,
            isVerified: false,
            isFeatured: true,
            createdAt: expect.any(Date)
          })
        ])
      );
    });

    it('should work without buyer ID (unauthenticated user)', async () => {
      const mockSellers = [
        {
          _id: 'seller1',
          storeName: 'Fashion Store',
          businessName: 'Fashion Store Ltd',
          aboutStore: 'Premium fashion items',
          storeAvatar: { url: 'https://example.com/avatar1.jpg' },
          categories: [{ name: 'Fashion' }],
          stats: { averageRating: 4.5, totalReviews: 100 },
          followers: [{}, {}, {}],
          isVerified: true,
          isFeatured: false,
          createdAt: new Date('2023-01-15')
        }
      ];

      // Mock repository methods
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(1);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);
      sellerRepository.findSellersToFollowRandomized.mockResolvedValue(mockSellers);

      // Execute service without buyer ID
      const result = await getPaginatedSellersToFollow(null, {
        page: 1,
        limit: 0,
        filters: {}
      });

      expect(sellerRepository.findFollowedSellerIds).toHaveBeenCalledWith(null);
      expect(sellerRepository.findSellersToFollowRandomized).toHaveBeenCalledWith(
        expect.any(Object),
        0,
        expect.any(Number)
      );

      expect(result.data.sellers).toHaveLength(1);
    });

    it('should handle pagination correctly', async () => {
      const mockSellers = [
        {
          _id: 'seller1',
          storeName: 'Fashion Store',
          businessName: 'Fashion Store Ltd',
          aboutStore: 'Premium fashion items',
          storeAvatar: { url: 'https://example.com/avatar1.jpg' },
          categories: [{ name: 'Fashion' }],
          stats: { averageRating: 4.5, totalReviews: 100 },
          followers: [{}, {}, {}],
          isVerified: true,
          isFeatured: false,
          createdAt: new Date('2023-01-15')
        }
      ];

      // Mock repository methods
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(25);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);
      sellerRepository.findSellersToFollowRandomized.mockResolvedValue(mockSellers);

      // Execute service with pagination
      const result = await getPaginatedSellersToFollow('buyer123', {
        page: 2,
        limit: 10,
        filters: {}
      });

      expect(sellerRepository.findSellersToFollowRandomized).toHaveBeenCalledWith(
        expect.any(Object),
        10,
        expect.any(Number)
      );

      expect(result.pagination).toEqual({
        totalSellers: 25,
        totalPages: 3,
        currentPage: 2,
        hasMore: true,
        hasPrevious: true
      });
    });

    it('should handle randomization when total > limit', async () => {
      const mockSellers = [
        {
          _id: 'seller1',
          storeName: 'Fashion Store',
          businessName: 'Fashion Store Ltd',
          aboutStore: 'Premium fashion items',
          storeAvatar: { url: 'https://example.com/avatar1.jpg' },
          categories: [{ name: 'Fashion' }],
          stats: { averageRating: 4.5, totalReviews: 100 },
          followers: [{}, {}, {}],
          isVerified: true,
          isFeatured: false,
          createdAt: new Date('2023-01-15')
        }
      ];

      // Mock repository methods
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(50);
      sellerRepository.findSellersToFollowRandomized.mockResolvedValue(mockSellers);

      // Execute service with randomization
      const result = await getPaginatedSellersToFollow('buyer123', {
        page: 1,
        limit: 10,
        filters: {}
      });

      expect(sellerRepository.findSellersToFollowRandomized).toHaveBeenCalledWith(
        expect.any(Object),
        10,
        expect.any(Number)
      );

      expect(result.data.sellers).toHaveLength(1);
    });

    it('should not randomize when total <= limit', async () => {
      const mockSellers = [
        {
          _id: 'seller1',
          storeName: 'Fashion Store',
          businessName: 'Fashion Store Ltd',
          aboutStore: 'Premium fashion items',
          storeAvatar: { url: 'https://example.com/avatar1.jpg' },
          categories: [{ name: 'Fashion' }],
          stats: { averageRating: 4.5, totalReviews: 100 },
          followers: [{}, {}, {}],
          isVerified: true,
          isFeatured: false,
          createdAt: new Date('2023-01-15')
        }
      ];

      // Mock repository methods
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(10);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);

      // Execute service without randomization
      const result = await getPaginatedSellersToFollow('buyer123', {
        page: 1,
        limit: 10,
        filters: {}
      });

      expect(sellerRepository.findSellersToFollow).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.any(Object),
          sortOptions: expect.any(Object),
          skip: 0,
          limit: 10
        })
      );

      expect(result.data.sellers).toHaveLength(1);
    });

    it('should handle sellers without store names', async () => {
      const mockSellers = [
        {
          _id: 'seller1',
          storeName: null,
          businessName: null,
          aboutStore: 'Some store',
          storeAvatar: null,
          categories: [],
          stats: { averageRating: 0, totalReviews: 0 },
          followers: [],
          isVerified: false,
          isFeatured: false,
          createdAt: new Date('2023-01-15')
        }
      ];

      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(1);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);

      const query = {
        page: '1',
        limit: '10',
        search: '',
        category: '',
        sort: 'rating'
      };

      const result = await getPaginatedSellersToFollow(null, {
        page: 1,
        limit: 10,
        filters: {
          search: '',
          category: '',
          sort: 'rating'
        }
      });

      expect(result.data.sellers[0].storeName).toBe('Shop'); // Default value
      expect(result.data.sellers[0].followerCount).toBe(0);
      expect(result.data.sellers[0].stats).toEqual({
        averageRating: 0,
        totalReviews: 0
      });
    });

    it('should throw ValidationError for invalid parameters', async () => {
      const invalidQuery = {
        page: '-1',
        limit: '101',
        sort: 'invalid'
      };

      // Mock validator to throw ValidationError for invalid parameters
      getSellersToFollowValidator.validateGetSellersToFollowData.mockRejectedValue(
        new ValidationError([
          { field: 'page', message: 'Page must be a positive integer' },
          { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' },
          { field: 'sort', message: 'Sort must be one of: rating, followers, newest' }
        ])
      );

      await expect(getPaginatedSellersToFollow('valid-buyer-id', {
        page: -1,
        limit: 101,
        filters: {
          search: '',
          category: '',
          sort: 'invalid'
        }
      })).rejects.toThrow(ValidationError);
    });

    it('should handle empty search and category filters', async () => {
      const mockSellers = [];
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(0);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);

      const query = {
        page: '1',
        limit: '10',
        search: '',
        category: '',
        sort: 'rating'
      };

      await getPaginatedSellersToFollow(null, {
        page: 1,
        limit: 10,
        filters: {
          search: '',
          category: '',
          sort: 'rating'
        }
      });

      expect(sellerRepository.countSellersToFollow).toHaveBeenCalledWith(
        expect.objectContaining({
          isDisabled: false
        })
      );
    });

    it('should handle search filter correctly', async () => {
      const mockSellers = [];
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(0);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);

      const query = {
        page: '1',
        limit: '10',
        search: 'fashion store',
        category: '',
        sort: 'rating'
      };

      await getPaginatedSellersToFollow(null, {
        page: 1,
        limit: 10,
        filters: {
          search: 'fashion store',
          category: '',
          sort: 'rating'
        }
      });

      expect(sellerRepository.countSellersToFollow).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { storeName: { $regex: 'fashion store', $options: 'i' } },
            { businessName: { $regex: 'fashion store', $options: 'i' } }
          ]
        })
      );
    });

    it('should handle category filter correctly', async () => {
      const mockSellers = [];
      sellerRepository.findFollowedSellerIds.mockResolvedValue([]);
      sellerRepository.countSellersToFollow.mockResolvedValue(0);
      sellerRepository.findSellersToFollow.mockResolvedValue(mockSellers);

      const query = {
        page: '1',
        limit: '10',
        search: '',
        category: 'electronics',
        sort: 'rating'
      };

      await getPaginatedSellersToFollow(null, {
        page: 1,
        limit: 10,
        filters: {
          search: '',
          category: 'electronics',
          sort: 'rating'
        }
      });

      expect(sellerRepository.countSellersToFollow).toHaveBeenCalledWith(
        expect.objectContaining({
          'categories.name': { $regex: 'electronics', $options: 'i' }
        })
      );
    });
  });
});
