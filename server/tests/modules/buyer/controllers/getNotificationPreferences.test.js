const request = require('supertest');
const { app } = require('@/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const getNotificationPreferencesService = require('@modules/buyer/services/getNotificationPreferences.service');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the service
jest.mock('@modules/buyer/services/getNotificationPreferences.service');

describe('Get Notification Preferences Controller', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Specify compatible version for Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v2/buyers/notification-preferences', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';

    // Helper function to generate JWT token
    function generateToken(buyerId) {
      return jwt.sign(
        { 
          id: buyerId, 
          email: 'test@example.com',
          role: 'Buyer'
        },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      );
    }

    it('should return 200 when notification preferences are retrieved successfully', async () => {
      // Mock notification preferences data
      const mockPreferences = {
        orderUpdates: {
          orderConfirmation: true,
          shippingAndDelivery: true,
          orderCancellation: false,
          refundUpdates: true
        },
        liveShows: {
          allShows: true,
          followedSellers: true,
          recommendedShows: false
        },
        messages: {
          fromSellers: true,
          fromBuyers: false,
          chatReplies: true,
          mentions: true
        },
        communityActivity: {
          postComments: true,
          postLikes: false,
          repliesAndMentions: true
        },
        promotionsAndSales: {
          flashSales: true,
          couponsAndDeals: true,
          trendingProducts: false,
          recommendations: true
        }
      };

      // Mock the service method
      getNotificationPreferencesService.getNotificationPreferences.mockResolvedValue({
        data: {
          preferences: mockPreferences
        }
      });

      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .expect(200);

      // Verify service method was called
      expect(getNotificationPreferencesService.getNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Notification preferences retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual({
        preferences: mockPreferences
      });
    });

    it('should return 200 when buyer has no notification preferences', async () => {
      // Mock empty preferences
      const mockPreferences = {};

      // Mock the service method
      getNotificationPreferencesService.getNotificationPreferences.mockResolvedValue({
        data: {
          preferences: mockPreferences
        }
      });

      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .expect(200);

      // Verify service method was called
      expect(getNotificationPreferencesService.getNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Notification preferences retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual({
        preferences: mockPreferences
      });
    });

    it('should return 404 when buyer is not found', async () => {
      // Mock the service method to throw NotFoundException
      getNotificationPreferencesService.getNotificationPreferences.mockRejectedValue(
        new NotFoundException('Buyer not found')
      );

      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .expect(404);

      // Verify service method was called
      expect(getNotificationPreferencesService.getNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Buyer not found');
    });

    it('should return 422 when validation fails', async () => {
      // Mock the service method to throw ValidationError
      getNotificationPreferencesService.getNotificationPreferences.mockRejectedValue(
        new ValidationError([
          { field: 'buyerId', message: 'Buyer ID is required' }
        ])
      );

      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .expect(422);

      // Verify service method was called
      expect(getNotificationPreferencesService.getNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Mock the service method to throw unexpected error
      getNotificationPreferencesService.getNotificationPreferences.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .expect(500);

      // Verify service method was called
      expect(getNotificationPreferencesService.getNotificationPreferences).toHaveBeenCalledWith(mockBuyerId);

      // Verify response structure
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .expect(401);

      // Verify service method was not called
      expect(getNotificationPreferencesService.getNotificationPreferences).not.toHaveBeenCalled();

      // Verify response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('token');
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      const response = await request(app)
        .get('/api/v2/buyers/notification-preferences')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Verify service method was not called
      expect(getNotificationPreferencesService.getNotificationPreferences).not.toHaveBeenCalled();

      // Verify response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('token');
    });
  });
}); 