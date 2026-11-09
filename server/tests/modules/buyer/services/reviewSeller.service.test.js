const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const reviewSellerService = require('@modules/buyer/services/reviewSeller.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const sellerRepository = require('@modules/buyer/repositories/seller.repository');
const orderRepository = require('@modules/buyer/repositories/order.repository');

// Mock the repositories
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/repositories/seller.repository');
jest.mock('@modules/buyer/repositories/order.repository');

describe('reviewSeller.service', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start MongoDB Memory Server with compatible version for Debian 12
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRating', () => {
    it('should not throw error for valid rating', () => {
      expect(() => reviewSellerService.validateRating(5)).not.toThrow();
      expect(() => reviewSellerService.validateRating(1)).not.toThrow();
      expect(() => reviewSellerService.validateRating(3)).not.toThrow();
    });

    it('should throw ValidationError for rating less than 1', () => {
      expect(() => reviewSellerService.validateRating(0)).toThrow('Validation failed');
      expect(() => reviewSellerService.validateRating(-1)).toThrow('Validation failed');
    });

    it('should throw ValidationError for rating greater than 5', () => {
      expect(() => reviewSellerService.validateRating(6)).toThrow('Validation failed');
      expect(() => reviewSellerService.validateRating(10)).toThrow('Validation failed');
    });
  });

  describe('validateComment', () => {
    it('should not throw error for valid comment', () => {
      expect(() => reviewSellerService.validateComment('This is a great seller with excellent service!')).not.toThrow();
    });

    it('should throw ValidationError for comment shorter than 10 characters', () => {
      expect(() => reviewSellerService.validateComment('Short')).toThrow('Validation failed');
      expect(() => reviewSellerService.validateComment('')).toThrow('Validation failed');
      expect(() => reviewSellerService.validateComment(null)).toThrow('Validation failed');
      expect(() => reviewSellerService.validateComment(undefined)).toThrow('Validation failed');
    });

    it('should throw ValidationError for comment with only whitespace', () => {
      expect(() => reviewSellerService.validateComment('   ')).toThrow('Validation failed');
    });
  });

  describe('hasExistingReview', () => {
    it('should return true when buyer has already reviewed', () => {
      const seller = {
        reviews: [
          { buyer: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') },
          { buyer: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012') }
        ]
      };
      const buyerId = '507f1f77bcf86cd799439011';

      const result = reviewSellerService.hasExistingReview(seller, buyerId);
      expect(result).toBe(true);
    });

    it('should return false when buyer has not reviewed', () => {
      const seller = {
        reviews: [
          { buyer: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') },
          { buyer: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012') }
        ]
      };
      const buyerId = '507f1f77bcf86cd799439013';

      const result = reviewSellerService.hasExistingReview(seller, buyerId);
      expect(result).toBe(false);
    });

    it('should return false when seller has no reviews', () => {
      const seller = { reviews: [] };
      const buyerId = '507f1f77bcf86cd799439011';

      const result = reviewSellerService.hasExistingReview(seller, buyerId);
      expect(result).toBe(false);
    });
  });

  describe('isFollower', () => {
    it('should return true when buyer is a follower', () => {
      const buyer = {
        followers: [
          { sellerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') },
          { sellerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012') }
        ]
      };
      const sellerId = '507f1f77bcf86cd799439011';

      const result = reviewSellerService.isFollower(buyer, sellerId);
      expect(result).toBe(true);
    });

    it('should return false when buyer is not a follower', () => {
      const buyer = {
        followers: [
          { sellerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') },
          { sellerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012') }
        ]
      };
      const sellerId = '507f1f77bcf86cd799439013';

      const result = reviewSellerService.isFollower(buyer, sellerId);
      expect(result).toBe(false);
    });

    it('should return false when buyer has no followers', () => {
      const buyer = { followers: [] };
      const sellerId = '507f1f77bcf86cd799439011';

      const result = reviewSellerService.isFollower(buyer, sellerId);
      expect(result).toBe(false);
    });
  });

  describe('createReview', () => {
    it('should create review object correctly', () => {
      const buyerId = '507f1f77bcf86cd799439011';
      const buyer = {
        firstName: 'John',
        lastName: 'Doe',
        profileImage: { url: 'https://example.com/image.jpg' }
      };
      const rating = 5;
      const comment = 'Great seller!';
      const hasPurchase = true;

      const review = reviewSellerService.createReview(buyerId, buyer, rating, comment, hasPurchase);

      expect(review).toEqual({
        buyer: buyerId,
        rating: 5,
        comment: 'Great seller!',
        buyerName: 'John Doe',
        buyerImage: 'https://example.com/image.jpg',
        createdAt: expect.any(Date),
        isVerifiedPurchase: true
      });
    });

    it('should handle buyer without profile image', () => {
      const buyerId = '507f1f77bcf86cd799439011';
      const buyer = {
        firstName: 'John',
        lastName: 'Doe'
      };
      const rating = 4;
      const comment = 'Good seller';
      const hasPurchase = false;

      const review = reviewSellerService.createReview(buyerId, buyer, rating, comment, hasPurchase);

      expect(review.buyerImage).toBeUndefined();
      expect(review.isVerifiedPurchase).toBe(false);
    });
  });

  describe('updateSellerRatingStats', () => {
    it('should update seller rating statistics correctly', () => {
      const seller = {
        reviews: [
          { rating: 5 },
          { rating: 4 },
          { rating: 5 },
          { rating: 3 },
          { rating: 5 }
        ],
        stats: {}
      };

      reviewSellerService.updateSellerRatingStats(seller);

      expect(seller.stats.averageRating).toBe('4.4');
      expect(seller.stats.totalReviews).toBe(5);
      expect(seller.stats.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 3
      });
    });

    it('should handle seller with no reviews', () => {
      const seller = {
        reviews: [],
        stats: {}
      };

      reviewSellerService.updateSellerRatingStats(seller);

      expect(seller.stats.averageRating).toBe('0');
      expect(seller.stats.totalReviews).toBe(0);
      expect(seller.stats.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
    });
  });

  describe('reviewSeller', () => {
    const mockSeller = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      reviews: [],
      stats: {},
      save: jest.fn().mockResolvedValue(true)
    };

    const mockBuyer = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      firstName: 'John',
      lastName: 'Doe',
      profileImage: { url: 'https://example.com/image.jpg' },
      followers: []
    };

    beforeEach(() => {
      sellerRepository.findById.mockResolvedValue(mockSeller);
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      orderRepository.hasVerifiedPurchase.mockResolvedValue(true);
      sellerRepository.save.mockResolvedValue(mockSeller);
    });

    it('should create review successfully', async () => {
      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 5, comment: 'Excellent seller with great service!' };

      const result = await reviewSellerService.reviewSeller(buyerId, sellerId, reviewData);

      expect(result).toEqual({
        buyer: buyerId,
        rating: 5,
        comment: 'Excellent seller with great service!',
        buyerName: 'John Doe',
        buyerImage: 'https://example.com/image.jpg',
        createdAt: expect.any(Date),
        isVerifiedPurchase: true
      });

      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(buyerRepository.findById).toHaveBeenCalledWith(buyerId);
      expect(orderRepository.hasVerifiedPurchase).toHaveBeenCalledWith(buyerId, sellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
      expect(mockSeller.reviews).toHaveLength(1);
    });

    it('should throw ValidationError for invalid rating', async () => {
      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 6, comment: 'Great seller!' };

      await expect(reviewSellerService.reviewSeller(buyerId, sellerId, reviewData))
        .rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError for invalid comment', async () => {
      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 5, comment: 'Short' };

      await expect(reviewSellerService.reviewSeller(buyerId, sellerId, reviewData))
        .rejects.toThrow('Validation failed');
    });

    it('should throw NotFoundException when seller not found', async () => {
      sellerRepository.findById.mockResolvedValue(null);

      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 5, comment: 'Great seller!' };

      await expect(reviewSellerService.reviewSeller(buyerId, sellerId, reviewData))
        .rejects.toThrow('Seller not found');
    });

    it('should throw NotFoundException when buyer not found', async () => {
      buyerRepository.findById.mockResolvedValue(null);

      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 5, comment: 'Great seller!' };

      await expect(reviewSellerService.reviewSeller(buyerId, sellerId, reviewData))
        .rejects.toThrow('Buyer not found');
    });

    it('should throw ValidationError when buyer has already reviewed', async () => {
      const sellerWithReview = {
        ...mockSeller,
        reviews: [{ buyer: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012') }]
      };
      sellerRepository.findById.mockResolvedValue(sellerWithReview);

      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 5, comment: 'Great seller!' };

      await expect(reviewSellerService.reviewSeller(buyerId, sellerId, reviewData))
        .rejects.toThrow('Validation failed');
    });

    it('should throw ValidationError when buyer has no purchase and is not follower', async () => {
      orderRepository.hasVerifiedPurchase.mockResolvedValue(false);

      const buyerId = '507f1f77bcf86cd799439012';
      const sellerId = '507f1f77bcf86cd799439011';
      const reviewData = { rating: 5, comment: 'Great seller!' };

      await expect(reviewSellerService.reviewSeller(buyerId, sellerId, reviewData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('stars and chips', () => {
    it('keeps known chips and uses them as the comment when there are no words', () => {
      const review = reviewSellerService.createReview('507f1f77bcf86cd799439011', { firstName: 'Ada' }, 5, 'As shown live · Fast delivery', true, ['As shown live', 'Fast delivery']);
      expect(review.tags).toEqual(['As shown live', 'Fast delivery']);
      expect(reviewSellerService.REVIEW_TAGS).toEqual(['As shown live', 'Good quality', 'Well packed', 'Fast delivery']);
    });
  });
}); 