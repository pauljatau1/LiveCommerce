// Controller-only fixtures use no accounts; real session revocation is covered separately.
jest.mock('@/services/auth/sessions', () => ({assertSession: jest.fn().mockResolvedValue(true)}));
const request = require('supertest');
const { app } = require('@/app');
const getSellerProfileService = require('@modules/buyer/services/getSellerProfile.service');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the service
jest.mock('@modules/buyer/services/getSellerProfile.service');

describe('Get Seller Profile Controller', () => {
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockBuyerId = '507f1f77bcf86cd799439012';

  const mockSellerProfile = {
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe'
    },
    storeInfo: {
      storeName: 'John\'s Store',
      aboutStore: 'A great store',
      storeAvatar: { url: 'https://example.com/avatar.jpg' },
      storeBanner: { url: 'https://example.com/banner.jpg' },
      isVerified: true,
      isFeatured: false,
      accountPending: false,
      joinedDate: new Date('2023-01-01'),
      bio: 'A great store',
      isFollowing: true,
      socialMedia: {
        instagram: '@johndoe',
        facebook: 'johndoe',
        tiktok: '@johndoe'
      }
    },
    businessInfo: {
      businessName: 'John Doe Business',
      businessType: 'Retail',
      categories: [{ name: 'Electronics', subCategories: [{ name: 'Phones' }] }],
      addresses: {
        business: { country: 'Nigeria', state: 'Lagos', city: 'Amuwo-Odofin' },
        warehouse: { name: 'Warehouse', address: { country: 'Nigeria' } },
        seller: { country: 'Nigeria', state: 'Lagos', city: 'Amuwo-Odofin' }
      }
    },
    location: {
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Amuwo-Odofin'
    },
    storePolicies: {
      delivery: {
        processingTime: '2-3 days',
        deliveryTimes: '3-5 days',
        freeShippingPolicy: 'Free shipping on orders above $50',
        allowsCod: true
      },
      returns: {
        returnWindow: 14,
        returnCondition: 'Good condition',
        returnShipping: 'Buyer pays',
        nonRefundableItems: ['Digital products']
      },
      refunds: {
        refundPolicy: 'Full refund within 14 days',
        refundMethod: 'Original payment method',
        lostOrDamagedPolicy: 'Replacement or refund'
      },
      exchange: {
        exchangePolicy: 'Exchange within 7 days'
      }
    },
    stats: {
      followersCount: 1,
      followingCount: 10,
      totalOrders: 2,
      totalStreams: 5,
      soldItems: 6
    },
    reviews: {
      averageRating: 4.5,
      totalReviews: 100,
      ratingDistribution: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 }
    }
  };

  const generateToken = (buyerId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: buyerId, role: 'Buyer' }, process.env.JWT_SECRET || 'test-secret');
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v2/buyers/seller/:sellerId', () => {
    it('should return 200 when seller profile is retrieved successfully with authentication', async () => {
      // Mock the service to return seller profile
      getSellerProfileService.getSellerProfile.mockResolvedValue(mockSellerProfile);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify service was called with correct parameters
      expect(getSellerProfileService.getSellerProfile).toHaveBeenCalledWith(mockSellerId, mockBuyerId);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller profile retrieved successfully');
      expect(response.body).toHaveProperty('data');

      // Verify data structure
      expect(response.body.data).toHaveProperty('personalInfo');
      expect(response.body.data).toHaveProperty('storeInfo');
      expect(response.body.data).toHaveProperty('businessInfo');
      expect(response.body.data).toHaveProperty('location');
      expect(response.body.data).toHaveProperty('storePolicies');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('reviews');

      // Verify specific data
      expect(response.body.data.personalInfo.firstName).toBe('John');
      expect(response.body.data.personalInfo.lastName).toBe('Doe');
      expect(response.body.data.storeInfo.storeName).toBe('John\'s Store');
      expect(response.body.data.storeInfo.isFollowing).toBe(true);
      expect(response.body.data.stats.followersCount).toBe(1);
      expect(response.body.data.stats.soldItems).toBe(6);
      expect(response.body.data.reviews.averageRating).toBe(4.5);
    });

    it('should return 200 when no token provided (public access)', async () => {
      // Mock the service to return seller profile with null buyerId
      const mockSellerProfileWithoutAuth = {
        ...mockSellerProfile,
        storeInfo: {
          ...mockSellerProfile.storeInfo,
          isFollowing: false // Should be false when not authenticated
        }
      };
      getSellerProfileService.getSellerProfile.mockResolvedValue(mockSellerProfileWithoutAuth);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .expect(200);

      // Verify service was called with null buyerId
      expect(getSellerProfileService.getSellerProfile).toHaveBeenCalledWith(mockSellerId, null);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller profile retrieved successfully');
      expect(response.body).toHaveProperty('data');

      // Verify isFollowing is false when not authenticated
      expect(response.body.data.storeInfo.isFollowing).toBe(false);
    });

    it('should return 200 when invalid token provided (treats as public access)', async () => {
      // Mock the service to return seller profile with null buyerId
      const mockSellerProfileWithoutAuth = {
        ...mockSellerProfile,
        storeInfo: {
          ...mockSellerProfile.storeInfo,
          isFollowing: false // Should be false when not authenticated
        }
      };
      getSellerProfileService.getSellerProfile.mockResolvedValue(mockSellerProfileWithoutAuth);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      // Verify service was called with null buyerId (invalid token treated as no auth)
      expect(getSellerProfileService.getSellerProfile).toHaveBeenCalledWith(mockSellerId, null);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller profile retrieved successfully');
      expect(response.body).toHaveProperty('data');

      // Verify isFollowing is false when not authenticated
      expect(response.body.data.storeInfo.isFollowing).toBe(false);
    });

    it('should return 404 when service throws NotFoundException', async () => {
      // Mock the service to throw NotFoundException
      getSellerProfileService.getSellerProfile.mockRejectedValue(new NotFoundException('Seller not found'));

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Seller not found');
    });

    it('should return 422 when service throws ValidationError', async () => {
      // Mock the service to throw ValidationError
      const validationError = new ValidationError([{ field: 'sellerId', message: 'Invalid seller ID' }]);
      getSellerProfileService.getSellerProfile.mockRejectedValue(validationError);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Mock the service to throw unexpected error
      getSellerProfileService.getSellerProfile.mockRejectedValue(new Error('Database connection failed'));

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should return 200 when token is for non-buyer user (public endpoint)', async () => {
      // Generate token for a seller instead of buyer
      const sellerToken = require('jsonwebtoken').sign(
        { id: mockSellerId, role: 'Seller' }, 
        process.env.JWT_SECRET || 'test-secret'
      );

      // Mock the service to return seller profile with null buyerId (since seller is not a buyer)
      const mockSellerProfileWithoutAuth = {
        ...mockSellerProfile,
        storeInfo: {
          ...mockSellerProfile.storeInfo,
          isFollowing: false // Should be false when not a buyer
        }
      };
      getSellerProfileService.getSellerProfile.mockResolvedValue(mockSellerProfileWithoutAuth);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      // Verify service was called with null buyerId (seller is not a buyer)
      expect(getSellerProfileService.getSellerProfile).toHaveBeenCalledWith(mockSellerId, null);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Seller profile retrieved successfully');
      expect(response.body).toHaveProperty('data');

      // Verify isFollowing is false when not a buyer
      expect(response.body.data.storeInfo.isFollowing).toBe(false);
    });

    it('should handle seller with minimal data', async () => {
      const minimalSellerProfile = {
        personalInfo: { firstName: 'John', lastName: 'Doe' },
        storeInfo: {
          storeName: 'John\'s Store',
          aboutStore: null,
          storeAvatar: null,
          storeBanner: null,
          isVerified: false,
          isFeatured: false,
          accountPending: false,
          joinedDate: new Date('2023-01-01'),
          bio: null,
          isFollowing: false,
          socialMedia: { instagram: null, facebook: null, tiktok: null }
        },
        businessInfo: {
          businessName: null,
          businessType: null,
          categories: [],
          addresses: { business: null, warehouse: null, seller: null }
        },
        location: { country: null, state: null, city: null },
        storePolicies: {
          delivery: { processingTime: null, deliveryTimes: null, freeShippingPolicy: null, allowsCod: true },
          returns: { returnWindow: 14, returnCondition: null, returnShipping: null, nonRefundableItems: [] },
          refunds: { refundPolicy: null, refundMethod: null, lostOrDamagedPolicy: null },
          exchange: { exchangePolicy: null }
        },
        stats: { followersCount: 0, followingCount: 0, totalOrders: 0, totalStreams: 0, soldItems: 0 },
        reviews: { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
      };

      getSellerProfileService.getSellerProfile.mockResolvedValue(minimalSellerProfile);

      const token = generateToken(mockBuyerId);

      const response = await request(app)
        .get(`/api/v2/buyers/seller/${mockSellerId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.personalInfo.firstName).toBe('John');
      expect(response.body.data.storeInfo.isFollowing).toBe(false);
      expect(response.body.data.stats.followersCount).toBe(0);
    });
  });
}); 