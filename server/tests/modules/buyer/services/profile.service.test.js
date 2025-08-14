const profileService = require('@modules/buyer/services/profile.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';
    const mockBuyer = {
      _id: mockBuyerId,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      country: 'US',
      phoneNumber: '+1234567890',
      profileImage: {
        url: 'https://example.com/profile.jpg'
      },
      shippingAddresses: [
        {
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        }
      ],
      emailVerified: true,
      phoneVerified: false,
      isDisabled: false,
      isNewBuyer: true,
      createdAt: new Date('2024-01-01'),
      isIdentityVerified: false,
      preferredCurrency: 'USD',
      preferredLanguage: 'en',
      role: 'buyer',
      wallet: {
        balance: 100.50
      },
      bio: 'Hello, I am John!',
      notificationPreferences: {
        email: true,
        push: false
      },
      isActive: true
    };

    it('should return enhanced buyer profile with counts', async () => {
      // Mock repository methods
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.getFollowersCount.mockResolvedValue(25);
      buyerRepository.getFollowingCount.mockResolvedValue(10);
      buyerRepository.getPostsCount.mockResolvedValue(5);

      const result = await profileService.getProfile(mockBuyerId);

      // Verify repository calls
      expect(buyerRepository.findByIdWithFields).toHaveBeenCalledWith(mockBuyerId, {
        firstName: 1,
        lastName: 1,
        username: 1,
        email: 1,
        country: 1,
        phoneNumber: 1,
        profileImage: 1,
        shippingAddresses: 1,
        emailVerified: 1,
        phoneVerified: 1,
        isDisabled: 1,
        isNewBuyer: 1,
        createdAt: 1,
        isIdentityVerified: 1,
        preferredCurrency: 1,
        preferredLanguage: 1,
        role: 1,
        wallet: 1,
        bio: 1,
        notificationPreferences: 1,
        isActive: 1
      });

      expect(buyerRepository.getFollowersCount).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.getFollowingCount).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.getPostsCount).toHaveBeenCalledWith(mockBuyerId);

      // Verify result structure
      expect(result).toEqual({
        ...mockBuyer,
        followersCount: 25,
        followingCount: 10,
        postsCount: 5,
        profilePictureUrl: 'https://example.com/profile.jpg',
        bio: 'Hello, I am John!'
      });
    });

    it('should handle buyer with no profile image', async () => {
      const buyerWithoutImage = {
        ...mockBuyer,
        profileImage: null
      };

      buyerRepository.findByIdWithFields.mockResolvedValue(buyerWithoutImage);
      buyerRepository.getFollowersCount.mockResolvedValue(0);
      buyerRepository.getFollowingCount.mockResolvedValue(0);
      buyerRepository.getPostsCount.mockResolvedValue(0);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.profilePictureUrl).toBeNull();
    });

    it('should handle buyer with no bio', async () => {
      const buyerWithoutBio = {
        ...mockBuyer,
        bio: null
      };

      buyerRepository.findByIdWithFields.mockResolvedValue(buyerWithoutBio);
      buyerRepository.getFollowersCount.mockResolvedValue(0);
      buyerRepository.getFollowingCount.mockResolvedValue(0);
      buyerRepository.getPostsCount.mockResolvedValue(0);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.bio).toBeNull();
    });

    it('should handle buyer with empty bio', async () => {
      const buyerWithEmptyBio = {
        ...mockBuyer,
        bio: ''
      };

      buyerRepository.findByIdWithFields.mockResolvedValue(buyerWithEmptyBio);
      buyerRepository.getFollowersCount.mockResolvedValue(0);
      buyerRepository.getFollowingCount.mockResolvedValue(0);
      buyerRepository.getPostsCount.mockResolvedValue(0);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.bio).toBeNull();
    });

    it('should handle buyer with undefined bio', async () => {
      const buyerWithUndefinedBio = {
        ...mockBuyer,
        bio: undefined
      };

      buyerRepository.findByIdWithFields.mockResolvedValue(buyerWithUndefinedBio);
      buyerRepository.getFollowersCount.mockResolvedValue(0);
      buyerRepository.getFollowingCount.mockResolvedValue(0);
      buyerRepository.getPostsCount.mockResolvedValue(0);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.bio).toBeNull();
    });

    it('should handle buyer with profile image without url', async () => {
      const buyerWithImageWithoutUrl = {
        ...mockBuyer,
        profileImage: {}
      };

      buyerRepository.findByIdWithFields.mockResolvedValue(buyerWithImageWithoutUrl);
      buyerRepository.getFollowersCount.mockResolvedValue(0);
      buyerRepository.getFollowingCount.mockResolvedValue(0);
      buyerRepository.getPostsCount.mockResolvedValue(0);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.profilePictureUrl).toBeNull();
    });

    it('should throw NotFoundException when buyer is not found', async () => {
      buyerRepository.findByIdWithFields.mockResolvedValue(null);

      await expect(profileService.getProfile(mockBuyerId)).rejects.toThrow(NotFoundException);
      await expect(profileService.getProfile(mockBuyerId)).rejects.toThrow('Buyer not found');

      // Verify that count methods are not called when buyer is not found
      expect(buyerRepository.getFollowersCount).not.toHaveBeenCalled();
      expect(buyerRepository.getFollowingCount).not.toHaveBeenCalled();
      expect(buyerRepository.getPostsCount).not.toHaveBeenCalled();
    });

    it('should handle zero counts correctly', async () => {
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.getFollowersCount.mockResolvedValue(0);
      buyerRepository.getFollowingCount.mockResolvedValue(0);
      buyerRepository.getPostsCount.mockResolvedValue(0);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.followersCount).toBe(0);
      expect(result.followingCount).toBe(0);
      expect(result.postsCount).toBe(0);
    });

    it('should handle large counts correctly', async () => {
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.getFollowersCount.mockResolvedValue(999999);
      buyerRepository.getFollowingCount.mockResolvedValue(5000);
      buyerRepository.getPostsCount.mockResolvedValue(1000);

      const result = await profileService.getProfile(mockBuyerId);

      expect(result.followersCount).toBe(999999);
      expect(result.followingCount).toBe(5000);
      expect(result.postsCount).toBe(1000);
    });

    it('should call all repository methods in parallel', async () => {
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.getFollowersCount.mockResolvedValue(25);
      buyerRepository.getFollowingCount.mockResolvedValue(10);
      buyerRepository.getPostsCount.mockResolvedValue(5);

      await profileService.getProfile(mockBuyerId);

      // Verify all count methods were called
      expect(buyerRepository.getFollowersCount).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.getFollowingCount).toHaveBeenCalledWith(mockBuyerId);
      expect(buyerRepository.getPostsCount).toHaveBeenCalledWith(mockBuyerId);
    });

    it('should preserve all original buyer fields in result', async () => {
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.getFollowersCount.mockResolvedValue(25);
      buyerRepository.getFollowingCount.mockResolvedValue(10);
      buyerRepository.getPostsCount.mockResolvedValue(5);

      const result = await profileService.getProfile(mockBuyerId);

      // Verify all original fields are preserved
      expect(result._id).toBe(mockBuyer._id);
      expect(result.firstName).toBe(mockBuyer.firstName);
      expect(result.lastName).toBe(mockBuyer.lastName);
      expect(result.username).toBe(mockBuyer.username);
      expect(result.email).toBe(mockBuyer.email);
      expect(result.country).toBe(mockBuyer.country);
      expect(result.phoneNumber).toBe(mockBuyer.phoneNumber);
      expect(result.profileImage).toEqual(mockBuyer.profileImage);
      expect(result.shippingAddresses).toEqual(mockBuyer.shippingAddresses);
      expect(result.emailVerified).toBe(mockBuyer.emailVerified);
      expect(result.phoneVerified).toBe(mockBuyer.phoneVerified);
      expect(result.isDisabled).toBe(mockBuyer.isDisabled);
      expect(result.isNewBuyer).toBe(mockBuyer.isNewBuyer);
      expect(result.createdAt).toEqual(mockBuyer.createdAt);
      expect(result.isIdentityVerified).toBe(mockBuyer.isIdentityVerified);
      expect(result.preferredCurrency).toBe(mockBuyer.preferredCurrency);
      expect(result.preferredLanguage).toBe(mockBuyer.preferredLanguage);
      expect(result.role).toBe(mockBuyer.role);
      expect(result.wallet).toEqual(mockBuyer.wallet);
      expect(result.notificationPreferences).toEqual(mockBuyer.notificationPreferences);
      expect(result.isActive).toBe(mockBuyer.isActive);
    });

    it('should handle repository errors gracefully', async () => {
      buyerRepository.findByIdWithFields.mockRejectedValue(new Error('Database connection failed'));

      await expect(profileService.getProfile(mockBuyerId)).rejects.toThrow('Database connection failed');
    });

    it('should handle count method errors gracefully', async () => {
      // Arrange
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.getFollowersCount.mockRejectedValue(new Error('Followers count failed'));
      buyerRepository.getFollowingCount.mockResolvedValue(10);
      buyerRepository.getPostsCount.mockResolvedValue(5);

      // Act
      const result = await profileService.getProfile(mockBuyerId);

      // Assert
      expect(result.followersCount).toBe(0); // Error should be caught and return 0
      expect(result.followingCount).toBe(10);
      expect(result.postsCount).toBe(5);
    });
  });
}); 