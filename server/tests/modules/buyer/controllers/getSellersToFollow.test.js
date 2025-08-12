const request = require('supertest');
const { app } = require('@/app');
const getSellersToFollowService = require('@modules/buyer/services/getSellersToFollow.service');

// Mock the service
jest.mock('@modules/buyer/services/getSellersToFollow.service');

describe('GET /api/v2/buyers/sellers', () => {
  const mockBuyerId = '507f1f77bcf86cd799439011';

  const mockSellersResponse = {
    data: {
      sellers: [
        {
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
          followerCount: 2,
          isVerified: false,
          isFeatured: true,
          createdAt: new Date('2023-01-10')
        }
      ]
    },
    pagination: {
      totalSellers: 2,
      totalPages: 1,
      currentPage: 1,
      hasMore: false,
      hasPrevious: false
    }
  };

  const generateToken = (buyerId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: buyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret');
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/sellers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/sellers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Successful requests', () => {
    it('should return sellers with default parameters', async () => {
      // Mock the service methods
      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockResolvedValue(mockSellersResponse);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify service was called with correct parameters
      expect(getSellersToFollowService.getPaginationOptions).toHaveBeenCalledWith(expect.any(Object));
      expect(getSellersToFollowService.getFilters).toHaveBeenCalledWith(expect.any(Object));
      expect(getSellersToFollowService.getPaginatedSellersToFollow).toHaveBeenCalledWith(
        mockBuyerId,
        {
          enabled: true,
          page: 1,
          limit: 10,
          filters: {
            search: '',
            category: '',
            sort: 'rating'
          }
        }
      );

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sellers retrieved successfully');
      expect(response.body.data).toHaveProperty('sellers');
      expect(response.body.data.sellers).toHaveLength(2);
      expect(response.body.data.sellers[0]).toHaveProperty('_id');
      expect(response.body.data.sellers[0]).toHaveProperty('storeName');
      expect(response.body.data.sellers[0]).toHaveProperty('businessName');
      expect(response.body.data.sellers[0]).toHaveProperty('aboutStore');
      expect(response.body.data.sellers[0]).toHaveProperty('stats');
      expect(response.body.data.sellers[0]).toHaveProperty('followerCount');
      expect(response.body.data.sellers[0]).toHaveProperty('isVerified');
      expect(response.body.data.sellers[0]).toHaveProperty('isFeatured');
      expect(response.body.data.sellers[0]).toHaveProperty('createdAt');
      expect(response.body.data.sellers[0]).toHaveProperty('categories');
      expect(response.body.pagination).toHaveProperty('totalSellers');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('currentPage');
      expect(response.body.pagination).toHaveProperty('hasMore');
      expect(response.body.pagination).toHaveProperty('hasPrevious');
    });

    it('should handle sort parameter', async () => {
      const sortResponse = {
        data: {
          sellers: [mockSellersResponse.data.sellers[0]] // Only fashion store
        },
        pagination: {
          totalSellers: 1,
          totalPages: 1,
          currentPage: 1,
          hasMore: false,
          hasPrevious: false
        }
      };

      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'followers' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockResolvedValue(sortResponse);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?sort=followers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getSellersToFollowService.getPaginatedSellersToFollow).toHaveBeenCalledWith(
        mockBuyerId,
        {
          enabled: true,
          page: 1,
          limit: 10,
          filters: {
            search: '',
            category: '',
            sort: 'followers'
          }
        }
      );

      expect(response.body.data.sellers).toHaveLength(1);
      expect(response.body.data.sellers[0].businessName).toBe('Fashion Store Ltd');
    });

    it('should handle search parameter', async () => {
      const searchResponse = {
        data: {
          sellers: [mockSellersResponse.data.sellers[0]] // Only fashion store
        },
        pagination: {
          totalSellers: 1,
          totalPages: 1,
          currentPage: 1,
          hasMore: false,
          hasPrevious: false
        }
      };

      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: 'fashion', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockResolvedValue(searchResponse);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?search=fashion')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getSellersToFollowService.getPaginatedSellersToFollow).toHaveBeenCalledWith(
        mockBuyerId,
        {
          enabled: true,
          page: 1,
          limit: 10,
          filters: {
            search: 'fashion',
            category: '',
            sort: 'rating'
          }
        }
      );

      expect(response.body.data.sellers).toHaveLength(1);
      expect(response.body.data.sellers[0].businessName).toBe('Fashion Store Ltd');
    });

    it('should handle category parameter', async () => {
      const categoryResponse = {
        data: {
          sellers: [mockSellersResponse.data.sellers[0]] // Only fashion store
        },
        pagination: {
          totalSellers: 1,
          totalPages: 1,
          currentPage: 1,
          hasMore: false,
          hasPrevious: false
        }
      };

      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: 'fashion', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockResolvedValue(categoryResponse);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?category=fashion')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getSellersToFollowService.getPaginatedSellersToFollow).toHaveBeenCalledWith(
        mockBuyerId,
        {
          enabled: true,
          page: 1,
          limit: 10,
          filters: {
            search: '',
            category: 'fashion',
            sort: 'rating'
          }
        }
      );

      expect(response.body.data.sellers).toHaveLength(1);
      expect(response.body.data.sellers[0].businessName).toBe('Fashion Store Ltd');
    });

    it('should handle pagination parameters', async () => {
      const paginationResponse = {
        data: {
          sellers: mockSellersResponse.data.sellers
        },
        pagination: {
          totalSellers: 15,
          totalPages: 3,
          currentPage: 2,
          hasMore: true,
          hasPrevious: true
        }
      };

      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 2, limit: 5 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockResolvedValue(paginationResponse);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getSellersToFollowService.getPaginatedSellersToFollow).toHaveBeenCalledWith(
        mockBuyerId,
        {
          enabled: true,
          page: 2,
          limit: 5,
          filters: {
            search: '',
            category: '',
            sort: 'rating'
          }
        }
      );

      expect(response.body.data.sellers).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.totalSellers).toBe(15);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('should handle empty results', async () => {
      const emptyResponse = {
        data: {
          sellers: []
        },
        pagination: {
          totalSellers: 0,
          totalPages: 0,
          currentPage: 1,
          hasMore: false,
          hasPrevious: false
        }
      };

      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockResolvedValue(emptyResponse);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.sellers).toHaveLength(0);
      expect(response.body.pagination.totalSellers).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
      expect(response.body.pagination.hasMore).toBe(false);
    });
  });

  describe('Validation errors', () => {
    it('should return 422 for invalid page parameter', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'page', message: 'Page must be a positive integer' }
      ]);
      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockRejectedValue(validationError);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?page=-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: 'Page must be a positive integer'
          })
        ])
      );
    });

    it('should return 422 for invalid limit parameter', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'limit', message: 'Limit must be a positive integer between 1 and 100' }
      ]);
      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockRejectedValue(validationError);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?limit=101')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
            message: 'Limit must be a positive integer between 1 and 100'
          })
        ])
      );
    });

    it('should return 422 for invalid sort parameter', async () => {
      const validationError = new (require('@utils/errors/ValidationError'))([
        { field: 'sort', message: 'Sort must be one of: rating, followers, newest' }
      ]);
      getSellersToFollowService.getPaginationOptions.mockReturnValue({ enabled: true, page: 1, limit: 10 });
      getSellersToFollowService.getFilters.mockReturnValue({ search: '', category: '', sort: 'rating' });
      getSellersToFollowService.getPaginatedSellersToFollow.mockRejectedValue(validationError);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get('/api/v2/buyers/sellers?sort=invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sort',
            message: 'Sort must be one of: rating, followers, newest'
          })
        ])
      );
    });
  });
});
