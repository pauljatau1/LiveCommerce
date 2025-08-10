const getSellerProfileService = require('@modules/buyer/services/getSellerProfile.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const getSellerProfileValidator = require('@modules/buyer/validators/getSellerProfile.validator');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/getSellerProfile.validator');

describe('getSellerProfile.service', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockBuyerId = '507f1f77bcf86cd799439012';

  const mockSeller = {
    _id: mockSellerId,
    firstName: 'John',
    lastName: 'Doe',
    storeName: 'John\'s Store',
    aboutStore: 'A great store',
    storeAvatar: { url: 'https://example.com/avatar.jpg' },
    storeBanner: { url: 'https://example.com/banner.jpg' },
    isVerified: true,
    isFeatured: false,
    accountPending: false,
    createdAt: new Date('2023-01-01'),
    businessName: 'John Doe Business',
    businessType: 'Retail',
    categories: [{ name: 'Electronics', subCategories: [{ name: 'Phones' }] }],
    businessAddress: { country: 'Nigeria', state: 'Lagos', city: 'Amuwo-Odofin' },
    sellerAddress: { country: 'Nigeria', state: 'Lagos', city: 'Amuwo-Odofin' },
    warehouseDetails: { name: 'Warehouse', address: { country: 'Nigeria' } },
    socialMedia: { instagram: '@johndoe', facebook: 'johndoe', tiktok: '@johndoe' },
    storePolicy: {
      processingTime: '2-3 days',
      deliveryTimes: '3-5 days',
      freeShippingPolicy: 'Free shipping on orders above $50',
      allowsCod: true,
      returnWindow: 14,
      returnCondition: 'Good condition',
      returnShipping: 'Buyer pays',
      nonRefundableItems: ['Digital products'],
      refundPolicy: 'Full refund within 14 days',
      refundMethod: 'Original payment method',
      lostOrDamagedPolicy: 'Replacement or refund',
      exchangePolicy: 'Exchange within 7 days'
    },
    followers: [
      { buyerId: mockBuyerId, firstName: 'Jane', lastName: 'Smith' }
    ],
    stats: {
      averageRating: 4.5,
      totalReviews: 100,
      ratingDistribution: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 }
    },
    reviews: [
      { isVerifiedPurchase: true, rating: 5, comment: 'Great product' },
      { isVerifiedPurchase: false, rating: 4, comment: 'Good product' }
    ]
  };

  const mockOrders = [
    {
      _id: 'order1',
      items: [
        { _id: 'item1', quantity: 2 },
        { _id: 'item2', quantity: 1 }
      ],
      shipping: { tracking: { status: 'delivered' } }
    },
    {
      _id: 'order2',
      items: [
        { _id: 'item3', quantity: 1 }
      ],
      shipping: { tracking: { status: 'in_transit' } }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSellerProfile', () => {
    it('should successfully get seller profile', async () => {
      // Mock validator
      getSellerProfileValidator.validateGetSellerProfileData.mockResolvedValue();

      // Mock repository methods
      buyerRepository.findSellerById.mockResolvedValue(mockSeller);
      buyerRepository.findOrdersBySeller.mockResolvedValue(mockOrders);
      buyerRepository.countStreamsBySeller.mockResolvedValue(5);
      buyerRepository.countBuyersFollowingSeller.mockResolvedValue(10);
      buyerRepository.getSellerReviewStats.mockResolvedValue([
        { totalReviews: 100, averageRating: 4.5 }
      ]);
      buyerRepository.incrementSellerStoreVisits.mockResolvedValue(mockSeller);

      const result = await getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId);

      // Verify validator was called
      expect(getSellerProfileValidator.validateGetSellerProfileData).toHaveBeenCalledWith({
        sellerId: mockSellerId
      });

      // Verify repository methods were called
      expect(buyerRepository.findSellerById).toHaveBeenCalledWith(mockSellerId);
      expect(buyerRepository.findOrdersBySeller).toHaveBeenCalledWith(mockSellerId);
      expect(buyerRepository.countStreamsBySeller).toHaveBeenCalledWith(mockSellerId);
      expect(buyerRepository.countBuyersFollowingSeller).toHaveBeenCalledWith(mockSellerId);
      expect(buyerRepository.getSellerReviewStats).toHaveBeenCalledWith(mockSellerId);
      expect(buyerRepository.incrementSellerStoreVisits).toHaveBeenCalledWith(mockSellerId);

      // Verify response structure
      expect(result).toHaveProperty('personalInfo');
      expect(result).toHaveProperty('storeInfo');
      expect(result).toHaveProperty('businessInfo');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('storePolicies');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('reviews');

      // Verify personal info
      expect(result.personalInfo).toEqual({
        firstName: 'John',
        lastName: 'Doe'
      });

      // Verify store info
      expect(result.storeInfo.storeName).toBe('John\'s Store');
      expect(result.storeInfo.isFollowing).toBe(true);
      expect(result.storeInfo.socialMedia).toEqual({
        instagram: '@johndoe',
        facebook: 'johndoe',
        tiktok: '@johndoe'
      });

      // Verify stats
      expect(result.stats.followersCount).toBe(1);
      expect(result.stats.followingCount).toBe(10);
      expect(result.stats.totalOrders).toBe(2);
      expect(result.stats.totalStreams).toBe(5);
      expect(result.stats.soldItems).toBe(3); // Only delivered items (2+1 from delivered order)

      // Verify reviews
      expect(result.reviews.averageRating).toBe(4.5);
      expect(result.reviews.totalReviews).toBe(100);
      expect(result.reviews.ratingDistribution).toEqual({
        1: 5, 2: 10, 3: 15, 4: 30, 5: 40
      });
    });

    it('should throw NotFoundException when seller not found', async () => {
      // Mock validator
      getSellerProfileValidator.validateGetSellerProfileData.mockResolvedValue();

      // Mock repository to return null
      buyerRepository.findSellerById.mockResolvedValue(null);

      await expect(getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId))
        .rejects.toThrow(NotFoundException);

      expect(getSellerProfileValidator.validateGetSellerProfileData).toHaveBeenCalledWith({
        sellerId: mockSellerId
      });
      expect(buyerRepository.findSellerById).toHaveBeenCalledWith(mockSellerId);
    });

    it('should throw ValidationError when validator fails', async () => {
      const validationError = new ValidationError([{ field: 'sellerId', message: 'Invalid seller ID' }]);
      getSellerProfileValidator.validateGetSellerProfileData.mockRejectedValue(validationError);

      await expect(getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId))
        .rejects.toThrow(ValidationError);

      expect(getSellerProfileValidator.validateGetSellerProfileData).toHaveBeenCalledWith({
        sellerId: mockSellerId
      });
    });

    it('should handle seller with no followers', async () => {
      const sellerWithoutFollowers = { ...mockSeller, followers: [] };
      
      getSellerProfileValidator.validateGetSellerProfileData.mockResolvedValue();
      buyerRepository.findSellerById.mockResolvedValue(sellerWithoutFollowers);
      buyerRepository.findOrdersBySeller.mockResolvedValue([]);
      buyerRepository.countStreamsBySeller.mockResolvedValue(0);
      buyerRepository.countBuyersFollowingSeller.mockResolvedValue(0);
      buyerRepository.getSellerReviewStats.mockResolvedValue([]);
      buyerRepository.incrementSellerStoreVisits.mockResolvedValue(sellerWithoutFollowers);

      const result = await getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId);

      expect(result.storeInfo.isFollowing).toBe(false);
      expect(result.stats.followersCount).toBe(0);
      expect(result.stats.followingCount).toBe(0);
      expect(result.stats.totalOrders).toBe(0);
      expect(result.stats.totalStreams).toBe(0);
      expect(result.stats.soldItems).toBe(0);
    });

    it('should handle seller with no reviews', async () => {
      const sellerWithoutReviews = { ...mockSeller, reviews: [], stats: {} };
      
      getSellerProfileValidator.validateGetSellerProfileData.mockResolvedValue();
      buyerRepository.findSellerById.mockResolvedValue(sellerWithoutReviews);
      buyerRepository.findOrdersBySeller.mockResolvedValue([]);
      buyerRepository.countStreamsBySeller.mockResolvedValue(0);
      buyerRepository.countBuyersFollowingSeller.mockResolvedValue(0);
      buyerRepository.getSellerReviewStats.mockResolvedValue([]);
      buyerRepository.incrementSellerStoreVisits.mockResolvedValue(sellerWithoutReviews);

      const result = await getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId);

      expect(result.reviews.averageRating).toBe(0);
      expect(result.reviews.totalReviews).toBe(0);
      expect(result.reviews.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      });
    });

    it('should handle seller with missing optional fields', async () => {
      const minimalSeller = {
        _id: mockSellerId,
        firstName: 'John',
        lastName: 'Doe',
        storeName: 'John\'s Store',
        createdAt: new Date('2023-01-01'),
        followers: [],
        reviews: [],
        stats: {}
      };
      
      getSellerProfileValidator.validateGetSellerProfileData.mockResolvedValue();
      buyerRepository.findSellerById.mockResolvedValue(minimalSeller);
      buyerRepository.findOrdersBySeller.mockResolvedValue([]);
      buyerRepository.countStreamsBySeller.mockResolvedValue(0);
      buyerRepository.countBuyersFollowingSeller.mockResolvedValue(0);
      buyerRepository.getSellerReviewStats.mockResolvedValue([]);
      buyerRepository.incrementSellerStoreVisits.mockResolvedValue(minimalSeller);

      const result = await getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId);

      expect(result.personalInfo).toEqual({
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(result.storeInfo.storeName).toBe('John\'s Store');
      expect(result.storeInfo.isFollowing).toBe(false);
      expect(result.storeInfo.socialMedia).toEqual({
        instagram: null,
        facebook: null,
        tiktok: null
      });
    });

    it('should calculate sold items correctly from delivered orders', async () => {
      const ordersWithDeliveredItems = [
        {
          _id: 'order1',
          items: [
            { _id: 'item1', quantity: 2 },
            { _id: 'item2', quantity: 1 }
          ],
          shipping: { tracking: { status: 'delivered' } }
        },
        {
          _id: 'order2',
          items: [
            { _id: 'item3', quantity: 3 }
          ],
          shipping: { tracking: { status: 'delivered' } }
        },
        {
          _id: 'order3',
          items: [
            { _id: 'item4', quantity: 1 }
          ],
          shipping: { tracking: { status: 'in_transit' } }
        }
      ];
      
      getSellerProfileValidator.validateGetSellerProfileData.mockResolvedValue();
      buyerRepository.findSellerById.mockResolvedValue(mockSeller);
      buyerRepository.findOrdersBySeller.mockResolvedValue(ordersWithDeliveredItems);
      buyerRepository.countStreamsBySeller.mockResolvedValue(5);
      buyerRepository.countBuyersFollowingSeller.mockResolvedValue(10);
      buyerRepository.getSellerReviewStats.mockResolvedValue([
        { totalReviews: 100, averageRating: 4.5 }
      ]);
      buyerRepository.incrementSellerStoreVisits.mockResolvedValue(mockSeller);

      const result = await getSellerProfileService.getSellerProfile(mockSellerId, mockBuyerId);

      // Should only count items from delivered orders (2 + 1 + 3 = 6)
      expect(result.stats.soldItems).toBe(6);
    });
  });
}); 