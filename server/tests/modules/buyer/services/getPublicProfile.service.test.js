const { getPublicProfile } = require('@modules/buyer/services/getPublicProfile.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('getPublicProfile.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicProfile', () => {
    it('should return formatted public profile data for valid buyer ID', async () => {
      // Mock data
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = {
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: { url: 'https://example.com/profile.jpg' },
        bio: 'Passionate shopper and reviewer',
        country: 'Nigeria',
        createdAt: new Date('2023-01-15T10:30:00Z'),
        isIdentityVerified: true,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [{ name: 'Smartphones' }]
          }
        ],
        activityFeed: [
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
        followers: [{ _id: 'follower1' }, { _id: 'follower2' }],
        following: []
      };
      const mockPostCount = 25;

      // Mock repository method
      buyerRepository.getPublicProfileData.mockResolvedValue({
        buyer: mockBuyer,
        postCount: mockPostCount
      });

      // Execute service
      const result = await getPublicProfile(mockBuyerId);

      // Verify repository was called with correct parameters
      expect(buyerRepository.getPublicProfileData).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(result).toHaveProperty('basicInfo');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('selectedCategories');

      // Verify basic info
      expect(result.basicInfo).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: { url: 'https://example.com/profile.jpg' },
        bio: 'Passionate shopper and reviewer',
        country: 'Nigeria',
        joinedDate: new Date('2023-01-15T10:30:00Z'),
        isIdentityVerified: true
      });

      // Verify stats
      expect(result.stats).toEqual({
        totalPosts: 25,
        totalReviews: 1,
        totalFollowers: 2,
        totalFollowing: 1
      });

      // Verify recent activity
      expect(result.recentActivity).toHaveLength(2);
      expect(result.recentActivity[0]).toEqual({
        type: 'product_review',
        content: 'Great product, highly recommended!',
        createdAt: new Date('2023-12-01T15:30:00Z')
      });

      // Verify selected categories
      expect(result.selectedCategories).toHaveLength(1);
      expect(result.selectedCategories[0]).toEqual({
        name: 'Electronics',
        subCategories: [{ name: 'Smartphones' }]
      });
    });

    it('should handle buyer with no activity feed', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = {
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: null,
        bio: null,
        country: 'Nigeria',
        createdAt: new Date('2023-01-15T10:30:00Z'),
        isIdentityVerified: false,
        selectedCategories: [],
        activityFeed: null,
        followers: [],
        following: []
      };
      const mockPostCount = 0;

      buyerRepository.getPublicProfileData.mockResolvedValue({
        buyer: mockBuyer,
        postCount: mockPostCount
      });

      const result = await getPublicProfile(mockBuyerId);

      expect(result.stats).toEqual({
        totalPosts: 0,
        totalReviews: 0,
        totalFollowers: 0,
        totalFollowing: 0
      });

      expect(result.recentActivity).toEqual([]);
      expect(result.selectedCategories).toEqual([]);
    });

    it('should handle buyer with empty arrays', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = {
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: { url: 'https://example.com/profile.jpg' },
        bio: 'Test bio',
        country: 'Nigeria',
        createdAt: new Date('2023-01-15T10:30:00Z'),
        isIdentityVerified: true,
        selectedCategories: [],
        activityFeed: [],
        followers: [],
        following: []
      };
      const mockPostCount = 5;

      buyerRepository.getPublicProfileData.mockResolvedValue({
        buyer: mockBuyer,
        postCount: mockPostCount
      });

      const result = await getPublicProfile(mockBuyerId);

      expect(result.stats).toEqual({
        totalPosts: 5,
        totalReviews: 0,
        totalFollowers: 0,
        totalFollowing: 0
      });

      expect(result.recentActivity).toEqual([]);
      expect(result.selectedCategories).toEqual([]);
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';

      buyerRepository.getPublicProfileData.mockResolvedValue(null);

      await expect(getPublicProfile(mockBuyerId)).rejects.toThrow(NotFoundException);
      expect(buyerRepository.getPublicProfileData).toHaveBeenCalledWith(mockBuyerId);
    });

    it('should throw ValidationError for invalid buyer ID', async () => {
      const invalidBuyerId = 'invalid-id';

      await expect(getPublicProfile(invalidBuyerId)).rejects.toThrow(ValidationError);
      expect(buyerRepository.getPublicProfileData).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      await expect(getPublicProfile(null)).rejects.toThrow(ValidationError);
      expect(buyerRepository.getPublicProfileData).not.toHaveBeenCalled();
    });

    it('should calculate correct statistics from activity feed', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = {
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: { url: 'https://example.com/profile.jpg' },
        bio: 'Test bio',
        country: 'Nigeria',
        createdAt: new Date('2023-01-15T10:30:00Z'),
        isIdentityVerified: true,
        selectedCategories: [],
        activityFeed: [
          { type: 'product_review', content: 'Review 1', createdAt: new Date() },
          { type: 'product_review', content: 'Review 2', createdAt: new Date() },
          { type: 'follow', content: 'Follow 1', createdAt: new Date() },
          { type: 'follow', content: 'Follow 2', createdAt: new Date() },
          { type: 'follow', content: 'Follow 3', createdAt: new Date() },
          { type: 'purchase', content: 'Purchase 1', createdAt: new Date() }
        ],
        followers: [{ _id: 'follower1' }, { _id: 'follower2' }, { _id: 'follower3' }],
        following: []
      };
      const mockPostCount = 10;

      buyerRepository.getPublicProfileData.mockResolvedValue({
        buyer: mockBuyer,
        postCount: mockPostCount
      });

      const result = await getPublicProfile(mockBuyerId);

      expect(result.stats).toEqual({
        totalPosts: 10,
        totalReviews: 2,
        totalFollowers: 3,
        totalFollowing: 3
      });
    });

    it('should format selected categories correctly', async () => {
      const mockBuyerId = '507f1f77bcf86cd799439011';
      const mockBuyer = {
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        profileImage: { url: 'https://example.com/profile.jpg' },
        bio: 'Test bio',
        country: 'Nigeria',
        createdAt: new Date('2023-01-15T10:30:00Z'),
        isIdentityVerified: true,
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          },
          {
            name: 'Fashion',
            subCategories: []
          }
        ],
        activityFeed: [],
        followers: [],
        following: []
      };
      const mockPostCount = 0;

      buyerRepository.getPublicProfileData.mockResolvedValue({
        buyer: mockBuyer,
        postCount: mockPostCount
      });

      const result = await getPublicProfile(mockBuyerId);

      expect(result.selectedCategories).toEqual([
        {
          name: 'Electronics',
          subCategories: [
            { name: 'Smartphones' },
            { name: 'Laptops' }
          ]
        },
        {
          name: 'Fashion',
          subCategories: []
        }
      ]);
    });
  });
});
