const request = require('supertest');
const { app } = require('../../../../src/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getSellerReviewsService = require('../../../../src/modules/buyer/services/getSellerReviews.service');
const NotFoundException = require('../../../../src/utils/errors/NotFoundException');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

// Mock the service
jest.mock('../../../../src/modules/buyer/services/getSellerReviews.service');

describe('Get Seller Reviews Controller', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockBuyerId = '507f1f77bcf86cd799439012';

  const mockSellerReviews = {
    reviews: [
      {
        _id: 'review1',
        rating: 5,
        comment: 'Great seller! Fast delivery and excellent products.',
        buyer: {
          id: mockBuyerId,
          name: 'John Doe',
          image: 'https://example.com/profile.jpg'
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        isVerifiedPurchase: true
      },
      {
        _id: 'review2',
        rating: 4,
        comment: 'Good experience overall.',
        buyer: {
          id: '507f1f77bcf86cd799439013',
          name: 'Jane Smith',
          image: null
        },
        createdAt: '2024-01-14T10:30:00.000Z',
        isVerifiedPurchase: false
      }
    ],
    stats: {
      averageRating: 4.5,
      totalReviews: 25,
      ratingDistribution: { 1: 1, 2: 2, 3: 3, 4: 8, 5: 11 },
      verifiedPurchaseCount: 20
    },
    pagination: {
      currentPage: 1,
      totalPages: 3,
      totalReviews: 25
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v2/buyers/seller/:sellerId/reviews', () => {
    it('should return 200 when seller reviews are retrieved successfully with pagination', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({});
      getSellerReviewsService.listPaginatedSellerReviews.mockResolvedValue({
        data: mockSellerReviews
      });

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listPaginatedSellerReviews).toHaveBeenCalledWith(mockSellerId, {
        enabled: true,
        page: 1,
        limit: 10,
        filters: {}
      });

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller reviews retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockSellerReviews);
    });

    it('should return 200 when seller reviews are retrieved successfully without pagination', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: false,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({ sort: 'recent' });
      getSellerReviewsService.listSellerReviews.mockResolvedValue({
        data: mockSellerReviews
      });

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .expect(200);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listSellerReviews).toHaveBeenCalledWith(mockSellerId, {
        sort: 'recent'
      });

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller reviews retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockSellerReviews);
    });

    it('should return 200 with custom query parameters', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 2,
        limit: 5
      });
      getSellerReviewsService.getFilters.mockReturnValue({ sort: 'rating-high' });
      getSellerReviewsService.listPaginatedSellerReviews.mockResolvedValue({
        data: mockSellerReviews
      });

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({
          page: 2,
          limit: 5,
          sort: 'rating-high'
        })
        .expect(200);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listPaginatedSellerReviews).toHaveBeenCalledWith(mockSellerId, {
        enabled: true,
        page: 2,
        limit: 5,
        filters: { sort: 'rating-high' }
      });

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller reviews retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockSellerReviews);
    });

    it('should return 404 when seller is not found', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({});
      getSellerReviewsService.listPaginatedSellerReviews.mockRejectedValue(
        new NotFoundException('Seller not found')
      );

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({ page: 1, limit: 10 })
        .expect(404);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listPaginatedSellerReviews).toHaveBeenCalled();

      // Verify error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Seller not found');
    });

    it('should return 422 when validation fails', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({});
      const validationError = new ValidationError([
        { field: 'sellerId', message: 'Seller ID is required' }
      ]);
      getSellerReviewsService.listPaginatedSellerReviews.mockRejectedValue(validationError);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({ page: 1, limit: 10 })
        .expect(422);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listPaginatedSellerReviews).toHaveBeenCalled();

      // Verify error response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({});
      getSellerReviewsService.listPaginatedSellerReviews.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({ page: 1, limit: 10 })
        .expect(500);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listPaginatedSellerReviews).toHaveBeenCalled();

      // Verify error response
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should handle empty query parameters correctly', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: false,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({});
      getSellerReviewsService.listSellerReviews.mockResolvedValue({
        data: mockSellerReviews
      });

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({})
        .expect(200);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listSellerReviews).toHaveBeenCalledWith(mockSellerId, {});

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller reviews retrieved successfully');
      expect(response.body).toHaveProperty('data');
    });

    it('should handle string query parameters correctly', async () => {
      // Mock the service methods
      getSellerReviewsService.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 1,
        limit: 10
      });
      getSellerReviewsService.getFilters.mockReturnValue({ sort: 'recent' });
      getSellerReviewsService.listPaginatedSellerReviews.mockResolvedValue({
        data: mockSellerReviews
      });

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}/reviews`)
        .query({
          page: '1',
          limit: '10',
          sort: 'recent'
        })
        .expect(200);

      // Verify service methods were called
      expect(getSellerReviewsService.getPaginationOptions).toHaveBeenCalled();
      expect(getSellerReviewsService.getFilters).toHaveBeenCalled();
      expect(getSellerReviewsService.listPaginatedSellerReviews).toHaveBeenCalledWith(mockSellerId, {
        enabled: true,
        page: 1,
        limit: 10,
        filters: { sort: 'recent' }
      });

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller reviews retrieved successfully');
      expect(response.body).toHaveProperty('data');
    });
  });
}); 