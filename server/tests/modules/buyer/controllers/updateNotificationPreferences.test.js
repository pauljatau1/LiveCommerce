const request = require('supertest');
const { app } = require('@/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const updateNotificationPreferencesService = require('@modules/buyer/services/updateNotificationPreferences.service');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the service to isolate controller testing from service implementation
jest.mock('@modules/buyer/services/updateNotificationPreferences.service');

describe('Update Notification Preferences Controller', () => {
  let mongoServer;

  // Setup MongoDB memory server for isolated testing
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Specify compatible version for Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // Clean up database connection and memory server
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear all mocks before each test to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/v2/buyers/notification-preferences', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';

    // Helper function to generate JWT token for authentication testing
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

    it('should return 200 when notification preferences are updated successfully', async () => {
      // Mock updated preferences data that represents the complete notification structure
      const mockUpdatedPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          shippingAndDelivery: false,
          orderCancellation: true,
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

      // Mock the service method to return successful response
      updateNotificationPreferencesService.updateNotificationPreferences.mockResolvedValue({
        data: {
          preferences: mockUpdatedPreferences
        }
      });

      // Prepare request body with partial preferences update
      const requestBody = {
        preferences: {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false
          },
          liveShows: {
            recommendedShows: false
          },
          messages: {
            fromBuyers: false
          },
          communityActivity: {
            postLikes: false
          },
          promotionsAndSales: {
            trendingProducts: false
          }
        }
      };

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(200);

      // Verify service method was called with correct parameters
      expect(updateNotificationPreferencesService.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, requestBody.preferences);

      // Verify response structure matches expected format
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Notification preferences updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual({
        preferences: mockUpdatedPreferences
      });
    });

    it('should return 404 when buyer is not found', async () => {
      // Mock the service method to throw NotFoundException
      updateNotificationPreferencesService.updateNotificationPreferences.mockRejectedValue(
        new NotFoundException('Buyer not found')
      );

      // Prepare request body with valid preferences
      const requestBody = {
        preferences: {
          orderUpdates: {
            orderConfirmation: false
          }
        }
      };

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(404);

      // Verify service method was called with correct parameters
      expect(updateNotificationPreferencesService.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, requestBody.preferences);

      // Verify error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Buyer not found');
    });

    it('should return 422 when validation fails', async () => {
      // Mock the service method to throw ValidationError for invalid field
      updateNotificationPreferencesService.updateNotificationPreferences.mockRejectedValue(
        new ValidationError([
          { field: 'preferences.orderUpdates.invalidField', message: 'Invalid field: invalidField' }
        ])
      );

      // Prepare request body with invalid field
      const requestBody = {
        preferences: {
          orderUpdates: {
            invalidField: true
          }
        }
      };

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(422);

      // Verify service method was called with correct parameters
      expect(updateNotificationPreferencesService.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, requestBody.preferences);

      // Verify error response structure includes validation details
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Mock the service method to throw unexpected error
      updateNotificationPreferencesService.updateNotificationPreferences.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Prepare request body with valid preferences
      const requestBody = {
        preferences: {
          orderUpdates: {
            orderConfirmation: false
          }
        }
      };

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(500);

      // Verify service method was called with correct parameters
      expect(updateNotificationPreferencesService.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, requestBody.preferences);

      // Verify generic error response structure
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Prepare request body with valid preferences
      const requestBody = {
        preferences: {
          orderUpdates: {
            orderConfirmation: false
          }
        }
      };

      // Make the API request without authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .send(requestBody)
        .expect(401);

      // Verify service method was not called due to authentication failure
      expect(updateNotificationPreferencesService.updateNotificationPreferences).not.toHaveBeenCalled();

      // Verify authentication error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('token');
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Prepare request body with valid preferences
      const requestBody = {
        preferences: {
          orderUpdates: {
            orderConfirmation: false
          }
        }
      };

      // Make the API request with invalid authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', 'Bearer invalid-token')
        .send(requestBody)
        .expect(401);

      // Verify service method was not called due to authentication failure
      expect(updateNotificationPreferencesService.updateNotificationPreferences).not.toHaveBeenCalled();

      // Verify authentication error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('token');
    });

    it('should return 422 when request body is missing preferences', async () => {
      // Prepare request body without preferences field
      const requestBody = {};

      // Mock the service to throw a ValidationError for missing preferences
      updateNotificationPreferencesService.updateNotificationPreferences.mockImplementation(() => {
        throw new ValidationError([{ field: 'preferences', message: 'Notification preferences are required' }]);
      });

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(422);

      // Verify response structure includes validation error details
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 422 when preferences is null', async () => {
      // Prepare request body with null preferences
      const requestBody = {
        preferences: null
      };

      // Mock the service to throw a ValidationError for null preferences
      updateNotificationPreferencesService.updateNotificationPreferences.mockImplementation(() => {
        throw new ValidationError([{ field: 'preferences', message: 'Notification preferences are required' }]);
      });

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(422);

      // Verify response structure includes validation error details
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle partial preferences update', async () => {
      // Mock updated preferences data showing complete merged result
      const mockUpdatedPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          shippingAndDelivery: true,
          orderCancellation: true,
          refundUpdates: true
        },
        liveShows: {
          allShows: true,
          followedSellers: true,
          recommendedShows: true
        },
        messages: {
          fromSellers: true,
          fromBuyers: true,
          chatReplies: true,
          mentions: true
        },
        communityActivity: {
          postComments: true,
          postLikes: true,
          repliesAndMentions: true
        },
        promotionsAndSales: {
          flashSales: true,
          couponsAndDeals: true,
          trendingProducts: true,
          recommendations: true
        }
      };

      // Mock the service method to return successful response
      updateNotificationPreferencesService.updateNotificationPreferences.mockResolvedValue({
        data: {
          preferences: mockUpdatedPreferences
        }
      });

      // Prepare request body with only partial preferences update
      const requestBody = {
        preferences: {
          orderUpdates: {
            orderConfirmation: false
          }
        }
      };

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(200);

      // Verify service method was called with correct parameters
      expect(updateNotificationPreferencesService.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, requestBody.preferences);

      // Verify response structure shows complete merged preferences
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Notification preferences updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual({
        preferences: mockUpdatedPreferences
      });
    });

    it('should handle complete preferences update', async () => {
      // Mock updated preferences data showing all preferences set to false
      const mockUpdatedPreferences = {
        orderUpdates: {
          orderConfirmation: false,
          shippingAndDelivery: false,
          orderCancellation: false,
          refundUpdates: false
        },
        liveShows: {
          allShows: false,
          followedSellers: false,
          recommendedShows: false
        },
        messages: {
          fromSellers: false,
          fromBuyers: false,
          chatReplies: false,
          mentions: false
        },
        communityActivity: {
          postComments: false,
          postLikes: false,
          repliesAndMentions: false
        },
        promotionsAndSales: {
          flashSales: false,
          couponsAndDeals: false,
          trendingProducts: false,
          recommendations: false
        }
      };

      // Mock the service method to return successful response
      updateNotificationPreferencesService.updateNotificationPreferences.mockResolvedValue({
        data: {
          preferences: mockUpdatedPreferences
        }
      });

      // Prepare request body with complete preferences update
      const requestBody = {
        preferences: mockUpdatedPreferences
      };

      // Make the API request with authentication token
      const response = await request(app)
        .put('/api/v2/buyers/notification-preferences')
        .set('Authorization', `Bearer ${generateToken(mockBuyerId)}`)
        .send(requestBody)
        .expect(200);

      // Verify service method was called with correct parameters
      expect(updateNotificationPreferencesService.updateNotificationPreferences).toHaveBeenCalledWith(mockBuyerId, requestBody.preferences);

      // Verify response structure shows complete updated preferences
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Notification preferences updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual({
        preferences: mockUpdatedPreferences
      });
    });
  });
}); 