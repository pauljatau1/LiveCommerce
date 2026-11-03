const getSellerReviewsService = require('@modules/buyer/services/getSellerReviews.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('Get Seller Reviews Service', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockBuyerId = '507f1f77bcf86cd799439012';

  const mockSeller = {
    _id: mockSellerId,
    reviews: [
      {
        _id: 'review1',
        rating: 5,
        comment: 'Great seller! Fast delivery and excellent products.',
        buyer: mockBuyerId,
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        isVerifiedPurchase: true
      },
      {
        _id: 'review2',
        rating: 4,
        comment: 'Good experience overall.',
        buyer: '507f1f77bcf86cd799439013',
        createdAt: new Date('2024-01-14T10:30:00.000Z'),
        isVerifiedPurchase: false
      },
      {
        _id: 'review3',
        rating: 3,
        comment: 'Average experience.',
        buyer: '507f1f77bcf86cd799439014',
        createdAt: new Date('2024-01-13T10:30:00.000Z'),
        isVerifiedPurchase: true
      }
    ],
    stats: {
      averageRating: 4.0,
      totalReviews: 3,
      ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 }
    }
  };

  const mockBuyer = {
    _id: mockBuyerId,
    firstName: 'John',
    lastName: 'Doe',
    profileImage: { url: 'https://example.com/profile.jpg' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPaginationOptions', () => {
    it('should return pagination options for request with page and limit', () => {
      const mockReq = {
        query: {
          page: '2',
          limit: '5'
        }
      };

      const result = getSellerReviewsService.getPaginationOptions(mockReq);

      expect(result).toEqual({
        enabled: true,
        page: 2,
        limit: 5
      });
    });

    it('should return default pagination options for request without page and limit', () => {
      const mockReq = {
        query: {}
      };

      const result = getSellerReviewsService.getPaginationOptions(mockReq);

      expect(result).toEqual({
        enabled: false,
        page: 1,
        limit: 10
      });
    });
  });

  describe('getFilters', () => {
    it('should return filters from request query', () => {
      const mockReq = {
        query: {
          status: 'active',
          isAdmin: 'true'
        }
      };

      const result = getSellerReviewsService.getFilters(mockReq);

      expect(result).toEqual({
        status: 'active',
        isAdmin: true
      });
    });

    it('should return empty filters for request without query parameters', () => {
      const mockReq = {
        query: {}
      };

      const result = getSellerReviewsService.getFilters(mockReq);

      expect(result).toEqual({});
    });
  });

  describe('listPaginatedSellerReviews', () => {
    it('should return paginated seller reviews', async () => {
      buyerRepository.findSellerWithReviews.mockResolvedValue(mockSeller);
      buyerRepository.findBuyerByIdWithFields.mockResolvedValue(mockBuyer);

      const params = {
        page: 1,
        limit: 2,
        filters: { sort: 'recent' }
      };

      const result = await getSellerReviewsService.listPaginatedSellerReviews(mockSellerId, params);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data.reviews).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.pages).toBe(2);
    });

    it('should throw NotFoundException when seller is not found', async () => {
      buyerRepository.findSellerWithReviews.mockResolvedValue(null);

      const params = {
        page: 1,
        limit: 10,
        filters: { sort: 'recent' }
      };

      await expect(
        getSellerReviewsService.listPaginatedSellerReviews(mockSellerId, params)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listSellerReviews', () => {
    it('should return all seller reviews without pagination', async () => {
      buyerRepository.findSellerWithReviews.mockResolvedValue(mockSeller);
      buyerRepository.findBuyerByIdWithFields.mockResolvedValue(mockBuyer);

      const filters = { sort: 'recent' };

      const result = await getSellerReviewsService.listSellerReviews(mockSellerId, filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data.reviews).toHaveLength(3);
      expect(result.pagination).toEqual({});
    });

    it('should throw NotFoundException when seller is not found', async () => {
      buyerRepository.findSellerWithReviews.mockResolvedValue(null);

      const filters = { sort: 'recent' };

      await expect(
        getSellerReviewsService.listSellerReviews(mockSellerId, filters)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sortReviews', () => {
    it('should sort reviews by recent (default)', () => {
      const reviews = [
        { rating: 3, createdAt: new Date('2024-01-13') },
        { rating: 5, createdAt: new Date('2024-01-15') },
        { rating: 4, createdAt: new Date('2024-01-14') }
      ];

      const sorted = getSellerReviewsService.sortReviews(reviews, 'recent');

      expect(sorted[0].rating).toBe(5); // Most recent
      expect(sorted[1].rating).toBe(4);
      expect(sorted[2].rating).toBe(3);
    });

    it('should sort reviews by rating high to low', () => {
      const reviews = [
        { rating: 3, createdAt: new Date('2024-01-13') },
        { rating: 5, createdAt: new Date('2024-01-15') },
        { rating: 4, createdAt: new Date('2024-01-14') }
      ];

      const sorted = getSellerReviewsService.sortReviews(reviews, 'rating-high');

      expect(sorted[0].rating).toBe(5);
      expect(sorted[1].rating).toBe(4);
      expect(sorted[2].rating).toBe(3);
    });

    it('should sort reviews by rating low to high', () => {
      const reviews = [
        { rating: 3, createdAt: new Date('2024-01-13') },
        { rating: 5, createdAt: new Date('2024-01-15') },
        { rating: 4, createdAt: new Date('2024-01-14') }
      ];

      const sorted = getSellerReviewsService.sortReviews(reviews, 'rating-low');

      expect(sorted[0].rating).toBe(3);
      expect(sorted[1].rating).toBe(4);
      expect(sorted[2].rating).toBe(5);
    });
  });

  describe('buildReviewStats', () => {
    it('should build correct statistics for reviews', () => {
      const reviews = [
        { rating: 5, isVerifiedPurchase: true },
        { rating: 4, isVerifiedPurchase: false },
        { rating: 3, isVerifiedPurchase: true },
        { rating: 5, isVerifiedPurchase: true },
        { rating: 2, isVerifiedPurchase: false }
      ];

      const stats = getSellerReviewsService.buildReviewStats(reviews);

      expect(stats.averageRating).toBe(3.8);
      expect(stats.totalReviews).toBe(5);
      expect(stats.ratingDistribution).toEqual({ 1: 0, 2: 1, 3: 1, 4: 1, 5: 2 });
      expect(stats.verifiedPurchaseCount).toBe(3);
    });

    it('should handle empty reviews array', () => {
      const stats = getSellerReviewsService.buildReviewStats([]);

      expect(stats.averageRating).toBe(0);
      expect(stats.totalReviews).toBe(0);
      expect(stats.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(stats.verifiedPurchaseCount).toBe(0);
    });

    it('should handle null reviews', () => {
      const stats = getSellerReviewsService.buildReviewStats(null);

      expect(stats.averageRating).toBe(0);
      expect(stats.totalReviews).toBe(0);
      expect(stats.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(stats.verifiedPurchaseCount).toBe(0);
    });
  });
}); 