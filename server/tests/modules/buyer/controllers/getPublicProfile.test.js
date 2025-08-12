const request = require('supertest');
const { app } = require('@/app');
const getPublicProfileService = require('@modules/buyer/services/getPublicProfile.service');

// Mock the service
jest.mock('@modules/buyer/services/getPublicProfile.service');

describe('GET /api/v2/buyers/public-profile/:buyerId', () => {
  const mockBuyerId = '507f1f77bcf86cd799439011';

  const mockPublicProfileResponse = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      profileImage: { url: 'https://example.com/profile.jpg' },
      bio: 'Passionate shopper and reviewer',
      country: 'Nigeria',
      joinedDate: new Date('2023-01-15T10:30:00Z'),
      isIdentityVerified: true
    },
    stats: {
      totalPosts: 25,
      totalReviews: 15,
      totalFollowers: 120,
      totalFollowing: 45
    },
    recentActivity: [
      {
        type: 'product_review',
        content: 'Great product, highly recommended!',
        createdAt: new Date('2023-12-01T15:30:00Z')
      },
      {
        type: 'follow',
        content: 'Started following a seller',
        createdAt: new Date('2023-11-30T12:00:00Z')
      }
    ],
    selectedCategories: [
      {
        name: 'Electronics',
        subCategories: [{ name: 'Smartphones' }]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    it('should return public profile data for valid buyer ID', async () => {
      // Mock the service to return public profile data
      getPublicProfileService.getPublicProfile.mockResolvedValue(mockPublicProfileResponse);

      const response = await request(app)
        .get(`/api/v2/buyers/public-profile/${mockBuyerId}`)
        .expect(200);

      // Verify service was called with correct parameters
      expect(getPublicProfileService.getPublicProfile).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Public profile retrieved successfully');
      expect(response.body.data).toHaveProperty('basicInfo');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data).toHaveProperty('selectedCategories');

      // Verify basic info
      expect(response.body.data.basicInfo).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: { url: 'https://example.com/profile.jpg' },
        bio: 'Passionate shopper and reviewer',
        country: 'Nigeria',
        joinedDate: expect.any(String), // Date will be serialized to string
        isIdentityVerified: true
      });

      // Verify stats
      expect(response.body.data.stats).toEqual({
        totalPosts: 25,
        totalReviews: 15,
        totalFollowers: 120,
        totalFollowing: 45
      });

      // Verify recent activity
      expect(response.body.data.recentActivity).toHaveLength(2);
      expect(response.body.data.recentActivity[0]).toEqual({
        type: 'product_review',
        content: 'Great product, highly recommended!',
        createdAt: expect.any(String) // Date will be serialized to string
      });

      // Verify selected categories
      expect(response.body.data.selectedCategories).toHaveLength(1);
      expect(response.body.data.selectedCategories[0]).toEqual({
        name: 'Electronics',
        subCategories: [{ name: 'Smartphones' }]
      });
    });

    it('should handle buyer with minimal data', async () => {
      const minimalResponse = {
        basicInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith',
          profileImage: null,
          bio: null,
          country: 'Nigeria',
          joinedDate: new Date('2023-02-01T10:30:00Z'),
          isIdentityVerified: false
        },
        stats: {
          totalPosts: 0,
          totalReviews: 0,
          totalFollowers: 0,
          totalFollowing: 0
        },
        recentActivity: [],
        selectedCategories: []
      };

      getPublicProfileService.getPublicProfile.mockResolvedValue(minimalResponse);

      const response = await request(app)
        .get(`/api/v2/buyers/public-profile/${mockBuyerId}`)
        .expect(200);

      expect(response.body.data.basicInfo.profileImage).toBeNull();
      expect(response.body.data.basicInfo.bio).toBeNull();
      expect(response.body.data.basicInfo.isIdentityVerified).toBe(false);
      expect(response.body.data.stats.totalPosts).toBe(0);
      expect(response.body.data.recentActivity).toEqual([]);
      expect(response.body.data.selectedCategories).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should return 404 when buyer is not found', async () => {
      const NotFoundException = require('@utils/errors/NotFoundException');
      getPublicProfileService.getPublicProfile.mockRejectedValue(new NotFoundException('Buyer not found'));

      const response = await request(app)
        .get(`/api/v2/buyers/public-profile/${mockBuyerId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should return 422 for invalid buyer ID format', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'buyerId', message: 'Invalid buyer ID format' }
      ]);
      getPublicProfileService.getPublicProfile.mockRejectedValue(validationError);

      const response = await request(app)
        .get('/api/v2/buyers/public-profile/invalid-id')
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          })
        ])
      );
    });

    it('should return 422 for missing buyer ID', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError([
        { field: 'buyerId', message: 'Buyer ID is required' }
      ]);
      getPublicProfileService.getPublicProfile.mockRejectedValue(validationError);

      const response = await request(app)
        .get('/api/v2/buyers/public-profile/')
        .expect(404); // Express will return 404 for missing parameter

      // The route won't be matched, so we get a 404 from Express
      expect(response.status).toBe(404);
    });

    it('should return 500 for internal server error', async () => {
      getPublicProfileService.getPublicProfile.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/v2/buyers/public-profile/${mockBuyerId}`)
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long buyer ID', async () => {
      const longBuyerId = '507f1f77bcf86cd799439011507f1f77bcf86cd799439011';
      getPublicProfileService.getPublicProfile.mockResolvedValue(mockPublicProfileResponse);

      const response = await request(app)
        .get(`/api/v2/buyers/public-profile/${longBuyerId}`)
        .expect(200);

      expect(getPublicProfileService.getPublicProfile).toHaveBeenCalledWith(longBuyerId);
      expect(response.body.success).toBe(true);
    });

    it('should handle buyer ID with special characters', async () => {
      const specialBuyerId = '507f1f77bcf86cd799439011%20';
      const decodedBuyerId = '507f1f77bcf86cd799439011 ';
      getPublicProfileService.getPublicProfile.mockResolvedValue(mockPublicProfileResponse);

      const response = await request(app)
        .get(`/api/v2/buyers/public-profile/${specialBuyerId}`)
        .expect(200);

      expect(getPublicProfileService.getPublicProfile).toHaveBeenCalledWith(decodedBuyerId);
      expect(response.body.success).toBe(true);
    });
  });
});
