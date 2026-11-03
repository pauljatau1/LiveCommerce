/**
 * Get Profile Service Tests
 *
 * This test suite covers all functionality of the getProfile service
 * including edge cases, error handling, and data validation.
 *
 * @module getProfileServiceTests
 */

const { getProfile } = require('@modules/seller/services/getProfile.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const orderRepository = require('@modules/seller/repositories/order.repository');
const streamRepository = require('@modules/seller/repositories/stream.repository');
const productRepository = require('@modules/seller/repositories/product.repository');
const buyerRepository = require('@modules/seller/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock all repository dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/repositories/order.repository');
jest.mock('@modules/seller/repositories/stream.repository');
jest.mock('@modules/seller/repositories/product.repository');
jest.mock('@modules/seller/repositories/buyer.repository');

describe('Get Profile Service', () => {
  let mockSeller;
  let mockProducts;
  let mockOrders;
  let mockStreams;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock seller data
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+2348012345678',
      isVerified: true,
      emailVerified: true,
      isFeatured: false,
      isDisabled: false,
      walletBalance: 5000,
      storeVisits: 150,
      createdAt: new Date('2024-01-01'),
      accountType: 'business',
      businessName: 'John\'s Store Ltd',
      businessType: 'Retail',
      isProfileComplete: true,
      businessEmail: 'business@johnstore.com',
      businessNumber: 'BN123456789',
      businessAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '123 Main Street',
        zipCode: '100001'
      },
      sellerAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '456 Home Avenue',
        zipCode: '100002'
      },
      warehouseDetails: {
        name: 'Main Warehouse',
        contactNumber: '+2348012345678',
        address: {
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '789 Warehouse Road',
          zipCode: '100003'
        }
      },
      bankDetails: {
        bankCountry: 'Nigeria',
        bankName: 'First Bank',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'John\'s Store Ltd',
        swiftCode: 'FBNINGL',
        bankIdentifierCode: 'FBNINGLXXX'
      },
      shippingOptions: {
        shippingMethod: 'Standard Delivery',
        returnsAndExchangePolicy: '30 days return policy'
      },
      storeAvatar: {
        url: 'https://example.com/avatar.jpg',
        public_id: 'avatar_123'
      },
      storeBanner: {
        url: 'https://example.com/banner.jpg',
        public_id: 'banner_123'
      },
      hasFilledAddress: true,
      hasFilledBankDetails: true,
      hasFilledBusinessAddress: true,
      hasFilledCategoryDetails: true,
      hasFilledVerificationDocuments: true,
      hasFilledWarehouseAddress: true,
      isNewSeller: false,
      onboardingProcess: 'completed',
      notificationPreferences: {
        emailNotifications: true,
        pushNotifications: true,
        notificationTypes: {
          orderUpdates: true,
          lowStock: true,
          newReviews: true,
          promotions: true,
          campaignMetrics: true
        }
      },
      aboutStore: 'Premium quality products for discerning customers',
      storeName: 'John\'s Premium Store',
      stats: {
        averageRating: 4.5,
        totalReviews: 125,
        ratingDistribution: {
          1: 2,
          2: 3,
          3: 15,
          4: 45,
          5: 60
        }
      },
      campaignStats: {
        totalCampaigns: 12,
        totalRecipients: 5000,
        totalOpens: 1500,
        totalClicks: 300,
        dailyCampaignCount: 2,
        lastCampaignDate: new Date('2024-01-15')
      },
      cancelledStreamCount: 1,
      lastStreamCancellation: new Date('2024-01-10'),
      agoraUid: 123456789,
      followers: [
        { buyerId: '507f1f77bcf86cd799439012', firstName: 'Alice', lastName: 'Smith' },
        { buyerId: '507f1f77bcf86cd799439013', firstName: 'Bob', lastName: 'Johnson' }
      ],
      following: [
        { sellerId: '507f1f77bcf86cd799439014', businessName: 'Supplier A' },
        { sellerId: '507f1f77bcf86cd799439015', businessName: 'Supplier B' }
      ],
      operatingHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
      },
      specialDates: [
        {
          date: new Date('2024-12-25'),
          isOpen: false,
          openTime: '10:00',
          closeTime: '15:00',
          note: 'Christmas Day - Limited Hours'
        }
      ],
      timezone: 'Africa/Lagos',
      storePolicy: {
        deliveryTimes: '2-3 business days',
        freeShippingPolicy: 'Free shipping on orders above ₦50,000',
        lostOrDamagedPolicy: 'Full refund for lost or damaged items',
        refundPolicy: '30-day money-back guarantee',
        processingTime: '1-2 business days',
        refundMethod: 'Original payment method',
        nonRefundableItems: ['Gift cards', 'Digital downloads'],
        returnWindow: 30,
        returnCondition: 'Items must be unused and in original packaging',
        returnShipping: 'Buyer pays return shipping',
        exchangePolicy: 'Exchanges available for same value items',
        allowsCod: true
      },
      accountPending: false,
      offersStorePickup: true,
      smileIdVerification: {
        type: 'business',
        provider: 'SmileID',
        result: {},
        verifiedAt: new Date('2024-01-05'),
        status: 'verified'
      },
      socialMedia: {
        instagram: '@johnstore',
        facebook: 'John\'s Store',
        tiktok: '@johnstore'
      },
      isInternational: false
    };

    // Setup mock products data with 12 blips total (more than 10)
    mockProducts = [
      {
        _id: '507f1f77bcf86cd799439016',
        blips: [
          { _id: '507f1f77bcf86cd799439017', content: 'Product 1 blip 1' },
          { _id: '507f1f77bcf86cd799439018', content: 'Product 1 blip 2' },
          { _id: '507f1f77bcf86cd799439019', content: 'Product 1 blip 3' },
          { _id: '507f1f77bcf86cd799439020', content: 'Product 1 blip 4' }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439021',
        blips: [
          { _id: '507f1f77bcf86cd799439022', content: 'Product 2 blip 1' },
          { _id: '507f1f77bcf86cd799439023', content: 'Product 2 blip 2' },
          { _id: '507f1f77bcf86cd799439024', content: 'Product 2 blip 3' },
          { _id: '507f1f77bcf86cd799439025', content: 'Product 2 blip 4' }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439026',
        blips: [
          { _id: '507f1f77bcf86cd799439027', content: 'Product 3 blip 1' },
          { _id: '507f1f77bcf86cd799439028', content: 'Product 3 blip 2' },
          { _id: '507f1f77bcf86cd799439029', content: 'Product 3 blip 3' },
          { _id: '507f1f77bcf86cd799439030', content: 'Product 3 blip 4' }
        ]
      }
    ];

    // Setup mock counts
    mockOrders = 89;
    mockStreams = 15;
    mockCategories = 8;
    mockFollowing = 45;
  });

  describe('getProfile', () => {
    it('should successfully retrieve seller profile with all data', async () => {
      // Arrange
      const sellerId = mockSeller._id;

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
      orderRepository.countOrdersBySeller.mockResolvedValue(mockOrders);
      streamRepository.countStreamsBySeller.mockResolvedValue(mockStreams);
      sellerRepository.getCategoriesCount.mockResolvedValue(mockCategories);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(mockFollowing);
      productRepository.findProductsBySeller.mockResolvedValue(mockProducts);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.followersCount).toBe(2);
      expect(result.followingCount).toBe(45);
      expect(result.totalOrders).toBe(89);
      expect(result.streamCount).toBe(15);
      expect(result.categoriesCount).toBe(8);
      expect(result.hasProducts).toBe(true);
      expect(result.hasMoreThan10Blips).toBe(true); // 12 blips total
      expect(result.storeStatus).toBeDefined();
      expect(result.storeStatus.currentSchedule).toBeDefined();
      expect(result.storeStatus.currentSchedule.type).toBe('regular');
      expect(result.followers).toBeUndefined(); // Should be removed
      expect(result.following).toBeUndefined(); // Should be removed

      // Verify repository calls
      expect(sellerRepository.findByIdWithFields).toHaveBeenCalledWith(sellerId, expect.any(Object));
      expect(orderRepository.countOrdersBySeller).toHaveBeenCalledWith(sellerId);
      expect(streamRepository.countStreamsBySeller).toHaveBeenCalledWith(sellerId);
      expect(sellerRepository.getCategoriesCount).toHaveBeenCalledWith(sellerId);
      expect(buyerRepository.countBuyersFollowedBySeller).toHaveBeenCalledWith(sellerId);
      expect(productRepository.findProductsBySeller).toHaveBeenCalledWith(sellerId);
    });

    it('should handle seller with no products', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const sellerWithoutProducts = { ...mockSeller };

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(sellerWithoutProducts);
      orderRepository.countOrdersBySeller.mockResolvedValue(0);
      streamRepository.countStreamsBySeller.mockResolvedValue(0);
      sellerRepository.getCategoriesCount.mockResolvedValue(0);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(0);
      productRepository.findProductsBySeller.mockResolvedValue([]);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result.hasProducts).toBe(false);
      expect(result.hasMoreThan10Blips).toBe(false);
      expect(result.totalOrders).toBe(0);
      expect(result.streamCount).toBe(0);
      expect(result.categoriesCount).toBe(0);
      expect(result.followersCount).toBe(2);
      expect(result.followingCount).toBe(0);
    });

    it('should handle seller with less than 10 blips', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const productsWithFewBlips = [
        {
          _id: '507f1f77bcf86cd799439029',
          blips: [
            { _id: '507f1f77bcf86cd799439030', content: 'Blip 1' },
            { _id: '507f1f77bcf86cd799439031', content: 'Blip 2' }
          ]
        }
      ];

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
      orderRepository.countOrdersBySeller.mockResolvedValue(5);
      streamRepository.countStreamsBySeller.mockResolvedValue(3);
      sellerRepository.getCategoriesCount.mockResolvedValue(2);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(10);
      productRepository.findProductsBySeller.mockResolvedValue(productsWithFewBlips);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result.hasProducts).toBe(true);
      expect(result.hasMoreThan10Blips).toBe(false);
      expect(result.totalOrders).toBe(5);
      expect(result.streamCount).toBe(3);
      expect(result.categoriesCount).toBe(2);
      expect(result.followingCount).toBe(10);
    });

    it('should handle seller with special dates schedule', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const today = new Date('2024-12-25'); // Christmas Day
      const originalDate = global.Date;
      global.Date = jest.fn(() => today);
      global.Date.getDay = originalDate.prototype.getDay;

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
      orderRepository.countOrdersBySeller.mockResolvedValue(10);
      streamRepository.countStreamsBySeller.mockResolvedValue(5);
      sellerRepository.getCategoriesCount.mockResolvedValue(3);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(20);
      productRepository.findProductsBySeller.mockResolvedValue(mockProducts);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result.storeStatus.currentSchedule.type).toBe('special');
      expect(result.storeStatus.currentSchedule.isOpen).toBe(false);
      expect(result.storeStatus.currentSchedule.openTime).toBe('10:00');
      expect(result.storeStatus.currentSchedule.closeTime).toBe('15:00');
      expect(result.storeStatus.currentSchedule.note).toBe('Christmas Day - Limited Hours');

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle seller with regular operating hours', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const today = new Date('2024-01-15'); // Monday
      const originalDate = global.Date;

      // Mock Date constructor to return our specific date
      global.Date = jest.fn((...args) => {
        if (args.length === 0) {
          return today;
        }
        return new originalDate(...args);
      });
      global.Date.getDay = originalDate.prototype.getDay;
      global.Date.prototype = originalDate.prototype;

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
      orderRepository.countOrdersBySeller.mockResolvedValue(10);
      streamRepository.countStreamsBySeller.mockResolvedValue(5);
      sellerRepository.getCategoriesCount.mockResolvedValue(3);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(20);
      productRepository.findProductsBySeller.mockResolvedValue(mockProducts);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result.storeStatus.currentSchedule.type).toBe('regular');
      expect(result.storeStatus.currentSchedule.day).toBe('monday');
      expect(result.storeStatus.currentSchedule.isOpen).toBe(true);
      expect(result.storeStatus.currentSchedule.openTime).toBe('09:00');
      expect(result.storeStatus.currentSchedule.closeTime).toBe('17:00');

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle seller with missing operating hours', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const sellerWithoutHours = { ...mockSeller };
      delete sellerWithoutHours.operatingHours;
      delete sellerWithoutHours.specialDates;

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(sellerWithoutHours);
      orderRepository.countOrdersBySeller.mockResolvedValue(10);
      streamRepository.countStreamsBySeller.mockResolvedValue(5);
      sellerRepository.getCategoriesCount.mockResolvedValue(3);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(20);
      productRepository.findProductsBySeller.mockResolvedValue(mockProducts);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result.storeStatus.currentSchedule.type).toBe('regular');
      expect(result.storeStatus.currentSchedule.isOpen).toBe(false);
      expect(result.storeStatus.currentSchedule.openTime).toBeUndefined();
      expect(result.storeStatus.currentSchedule.closeTime).toBeUndefined();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const sellerId = mockSeller._id;

      // Mock repository responses with errors
      sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
      orderRepository.countOrdersBySeller.mockRejectedValue(new Error('Database error'));
      streamRepository.countStreamsBySeller.mockRejectedValue(new Error('Database error'));
      sellerRepository.getCategoriesCount.mockRejectedValue(new Error('Database error'));
      buyerRepository.countBuyersFollowedBySeller.mockRejectedValue(new Error('Database error'));
      productRepository.findProductsBySeller.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.totalOrders).toBe(0);
      expect(result.streamCount).toBe(0);
      expect(result.categoriesCount).toBe(0);
      expect(result.followingCount).toBe(0);
      expect(result.hasProducts).toBe(false);
      expect(result.hasMoreThan10Blips).toBe(false);
    });

    it('should throw NotFoundException when seller is not found', async () => {
      // Arrange
      const sellerId = '507f1f77bcf86cd799439032';

      // Mock repository to return null
      sellerRepository.findByIdWithFields.mockResolvedValue(null);

      // Act & Assert
      await expect(getProfile(sellerId))
        .rejects
        .toThrow(NotFoundException);
      expect(sellerRepository.findByIdWithFields).toHaveBeenCalledWith(sellerId, expect.any(Object));
    });

    it('should handle seller with no followers', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const sellerWithoutFollowers = { ...mockSeller, followers: [] };

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(sellerWithoutFollowers);
      orderRepository.countOrdersBySeller.mockResolvedValue(10);
      streamRepository.countStreamsBySeller.mockResolvedValue(5);
      sellerRepository.getCategoriesCount.mockResolvedValue(3);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(20);
      productRepository.findProductsBySeller.mockResolvedValue(mockProducts);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result.followersCount).toBe(0);
    });

    it('should handle seller with missing optional fields', async () => {
      // Arrange
      const sellerId = mockSeller._id;
      const sellerWithMinimalData = {
        _id: mockSeller._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+2348012345678',
        isVerified: false,
        emailVerified: false,
        isDisabled: false,
        walletBalance: 0,
        storeVisits: 0,
        createdAt: new Date(),
        accountType: 'individual',
        isProfileComplete: false,
        isNewSeller: true,
        onboardingProcess: '',
        hasFilledAddress: false,
        hasFilledBankDetails: false,
        hasFilledBusinessAddress: false,
        hasFilledCategoryDetails: false,
        hasFilledVerificationDocuments: false,
        hasFilledWarehouseAddress: false,
        accountPending: true,
        offersStorePickup: false,
        isInternational: false
      };

      // Mock repository responses
      sellerRepository.findByIdWithFields.mockResolvedValue(sellerWithMinimalData);
      orderRepository.countOrdersBySeller.mockResolvedValue(0);
      streamRepository.countStreamsBySeller.mockResolvedValue(0);
      sellerRepository.getCategoriesCount.mockResolvedValue(0);
      buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(0);
      productRepository.findProductsBySeller.mockResolvedValue([]);

      // Act
      const result = await getProfile(sellerId);

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.isVerified).toBe(false);
      expect(result.emailVerified).toBe(false);
      expect(result.isProfileComplete).toBe(false);
      expect(result.isNewSeller).toBe(true);
      expect(result.accountPending).toBe(true);
      expect(result.followersCount).toBe(0);
      expect(result.followingCount).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.streamCount).toBe(0);
      expect(result.categoriesCount).toBe(0);
      expect(result.hasProducts).toBe(false);
      expect(result.hasMoreThan10Blips).toBe(false);
    });

    /**
     * Phone Number Format Validation Tests
     * These tests verify the profile reset logic for sellers with old phone number formats
     */
    describe('phone number format validation', () => {
      it('should reset profile fields when phone number starts with 0', async () => {
        // Arrange: Mock seller with old phone number format
        const mockSeller = {
          _id: 'sellerId123',
          phoneNumber: '08106430258',
          storeName: 'Old Store Name',
          hasFilledAddress: true,
          hasFilledBusinessAddress: true,
          followers: []
        };

        sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
        orderRepository.countOrdersBySeller.mockResolvedValue(5);
        streamRepository.countStreamsBySeller.mockResolvedValue(2);
        sellerRepository.getCategoriesCount.mockResolvedValue(3);
        buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(10);
        productRepository.findProductsBySeller.mockResolvedValue([]);
        sellerRepository.findByIdAndUpdate.mockResolvedValue(mockSeller);

        // Act: Call getProfile
        const result = await getProfile('sellerId123');

        // Assert: Verify profile fields were reset
        expect(mockSeller.phoneNumber).toBeNull();
        expect(mockSeller.storeName).toBeNull();
        expect(mockSeller.hasFilledAddress).toBe(false);
        expect(mockSeller.hasFilledBusinessAddress).toBe(false);
        expect(sellerRepository.findByIdAndUpdate).toHaveBeenCalledWith('sellerId123', {
          hasFilledAddress: false,
          hasFilledBusinessAddress: false,
          storeName: null,
          phoneNumber: null
        });
      });

      it('should not reset profile fields for valid phone numbers without leading 0', async () => {
        // Arrange: Mock seller with correct phone number format
        const mockSeller = {
          _id: 'sellerId123',
          phoneNumber: '8106430258',
          storeName: 'Valid Store Name',
          hasFilledAddress: true,
          hasFilledBusinessAddress: true,
          followers: []
        };

        sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
        orderRepository.countOrdersBySeller.mockResolvedValue(5);
        streamRepository.countStreamsBySeller.mockResolvedValue(2);
        sellerRepository.getCategoriesCount.mockResolvedValue(3);
        buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(10);
        productRepository.findProductsBySeller.mockResolvedValue([]);

        // Act: Call getProfile
        const result = await getProfile('sellerId123');

        // Assert: Verify profile fields were NOT reset
        expect(result.phoneNumber).toBe('8106430258');
        expect(result.storeName).toBe('Valid Store Name');
        expect(result.hasFilledAddress).toBe(true);
        expect(result.hasFilledBusinessAddress).toBe(true);
        expect(sellerRepository.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      it('should handle sellers with null phone number', async () => {
        // Arrange: Mock seller with null phone number
        const mockSeller = {
          _id: 'sellerId123',
          phoneNumber: null,
          storeName: 'Store Name',
          hasFilledAddress: true,
          hasFilledBusinessAddress: true,
          followers: []
        };

        sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
        orderRepository.countOrdersBySeller.mockResolvedValue(5);
        streamRepository.countStreamsBySeller.mockResolvedValue(2);
        sellerRepository.getCategoriesCount.mockResolvedValue(3);
        buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(10);
        productRepository.findProductsBySeller.mockResolvedValue([]);

        // Act: Call getProfile
        const result = await getProfile('sellerId123');

        // Assert: Verify no reset logic was triggered
        expect(result.phoneNumber).toBeNull();
        expect(result.storeName).toBe('Store Name');
        expect(sellerRepository.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      it('should handle sellers with undefined phone number', async () => {
        // Arrange: Mock seller with undefined phone number
        const mockSeller = {
          _id: 'sellerId123',
          phoneNumber: undefined,
          storeName: 'Store Name',
          hasFilledAddress: true,
          hasFilledBusinessAddress: true,
          followers: []
        };

        sellerRepository.findByIdWithFields.mockResolvedValue(mockSeller);
        orderRepository.countOrdersBySeller.mockResolvedValue(5);
        streamRepository.countStreamsBySeller.mockResolvedValue(2);
        sellerRepository.getCategoriesCount.mockResolvedValue(3);
        buyerRepository.countBuyersFollowedBySeller.mockResolvedValue(10);
        productRepository.findProductsBySeller.mockResolvedValue([]);

        // Act: Call getProfile
        const result = await getProfile('sellerId123');

        // Assert: Verify no reset logic was triggered
        expect(result.phoneNumber).toBeUndefined();
        expect(result.storeName).toBe('Store Name');
        expect(sellerRepository.findByIdAndUpdate).not.toHaveBeenCalled();
      });
    });
  });
});
