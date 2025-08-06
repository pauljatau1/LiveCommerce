const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('@/app').app;
const Buyer = require('@modules/buyer/models/buyer.model');
const Seller = require('@models/Seller');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the reportUser service
jest.mock('@modules/buyer/services/reportUser.service');
const reportUserService = require('@modules/buyer/services/reportUser.service');

let mongoServer;

describe('reportUser.controller', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
    
    // Reset mocks
    jest.clearAllMocks();
  });

  const mockBuyerData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    country: 'NG',
    phoneNumber: '+2348012345678',
    password: 'hashedPassword123',
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    isNewBuyer: true,
    isIdentityVerified: false,
    preferredCurrency: 'NGN',
    preferredLanguage: 'en',
    authProvider: 'local'
  };

  const generateToken = (buyerId) => {
    return jwt.sign(
      { id: buyerId, role: 'Buyer' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
  };

  describe('POST /api/v2/buyers/report-user', () => {
    let buyerId;
    let token;

    beforeEach(async () => {
      // Create a buyer for authentication
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      buyerId = savedBuyer._id.toString();
      token = generateToken(buyerId);
    });

    it('should return 201 when report is submitted successfully', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      const mockResponse = {
        message: 'Report submitted successfully',
        report: {
          _id: new mongoose.Types.ObjectId(),
          reportedUser: {
            userId: requestBody.userId,
            userType: requestBody.userType
          },
          reason: requestBody.reason,
          description: requestBody.description,
          status: 'pending',
          createdAt: new Date()
        }
      };

      reportUserService.reportUser.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Report submitted successfully',
        data: expect.objectContaining({
          message: mockResponse.message,
          report: expect.objectContaining({
            _id: expect.any(String),
            reportedUser: mockResponse.report.reportedUser,
            reason: mockResponse.report.reason,
            description: mockResponse.report.description,
            status: mockResponse.report.status,
            createdAt: expect.any(String) // Dates get serialized as strings in JSON
          })
        }),
        pagination: null
      });

      expect(reportUserService.reportUser).toHaveBeenCalledWith(buyerId, requestBody);
    });

    it('should return 422 when validation fails due to missing fields', async () => {
      // Arrange
      const requestBody = {
        // Missing required fields
        userType: 'seller',
        reason: 'Fraudulent behavior'
        // description missing
      };

      const validationError = new ValidationError([
        { field: 'userId', message: 'User ID is required' },
        { field: 'description', message: 'Description is required' }
      ]);

      reportUserService.reportUser.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when validation fails due to invalid data', async () => {
      // Arrange
      const requestBody = {
        userId: 'invalid-id-format',
        userType: 'invalid-type',
        reason: 'ab', // too short
        description: 'short' // too short
      };

      const validationError = new ValidationError([
        { field: 'userId', message: 'Invalid user ID format' },
        { field: 'userType', message: 'User type must be either "buyer" or "seller"' },
        { field: 'reason', message: 'Reason must be at least 3 characters long' },
        { field: 'description', message: 'Description must be at least 10 characters long' }
      ]);

      reportUserService.reportUser.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when user tries to report themselves', async () => {
      // Arrange
      const requestBody = {
        userId: buyerId, // same as the authenticated user
        userType: 'buyer',
        reason: 'Self-report test',
        description: 'This is a test of self-reporting prevention.'
      };

      const validationError = new ValidationError([
        { field: 'userId', message: 'You cannot report yourself' }
      ]);

      reportUserService.reportUser.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 422 when reported user does not exist', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      const validationError = new ValidationError([
        { field: 'userId', message: 'Reported user not found' }
      ]);

      reportUserService.reportUser.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      reportUserService.reportUser.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', 'Bearer invalid-token')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should return 403 when user is not a buyer', async () => {
      // Arrange
      // Generate token for non-buyer role
      const nonBuyerToken = jwt.sign(
        { id: buyerId, role: 'Seller' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${nonBuyerToken}`)
        .send(requestBody)
        .expect(403);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Buyers only.'
      });
    });

    it('should handle malformed JSON in request body', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid JSON in request body',
        error: 'Bad Request'
      });
    });

    it('should handle service errors with specific error messages', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      reportUserService.reportUser.mockRejectedValue(new Error('SendGrid service unavailable'));

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
    });

    it('should properly extract buyerId from authenticated user token', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      const mockResponse = {
        message: 'Report submitted successfully',
        report: {
          _id: new mongoose.Types.ObjectId(),
          reportedUser: {
            userId: requestBody.userId,
            userType: requestBody.userType
          },
          reason: requestBody.reason,
          description: requestBody.description,
          status: 'pending',
          createdAt: new Date()
        }
      };

      reportUserService.reportUser.mockResolvedValue(mockResponse);

      // Act
      await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(201);

      // Assert
      expect(reportUserService.reportUser).toHaveBeenCalledWith(buyerId, requestBody);
    });

    it('should handle different userType values correctly', async () => {
      // Arrange
      const reportBuyerRequest = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'buyer',
        reason: 'Inappropriate behavior',
        description: 'This buyer is sending offensive messages to sellers and causing disruption.'
      };

      const mockResponse = {
        message: 'Report submitted successfully',
        report: {
          _id: new mongoose.Types.ObjectId(),
          reportedUser: {
            userId: reportBuyerRequest.userId,
            userType: reportBuyerRequest.userType
          },
          reason: reportBuyerRequest.reason,
          description: reportBuyerRequest.description,
          status: 'pending',
          createdAt: new Date()
        }
      };

      reportUserService.reportUser.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(reportBuyerRequest)
        .expect(201);

      // Assert
      expect(response.body.data.report.reportedUser.userType).toBe('buyer');
      expect(reportUserService.reportUser).toHaveBeenCalledWith(buyerId, reportBuyerRequest);
    });

    it('should handle empty request body', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'userId', message: 'User ID is required' },
        { field: 'userType', message: 'User type is required' },
        { field: 'reason', message: 'Reason is required' },
        { field: 'description', message: 'Description is required' }
      ]);

      reportUserService.reportUser.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(422);

      // Assert
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    });

    it('should preserve response format consistency', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      const mockResponse = {
        message: 'Report submitted successfully',
        report: {
          _id: new mongoose.Types.ObjectId(),
          reportedUser: {
            userId: requestBody.userId,
            userType: requestBody.userType
          },
          reason: requestBody.reason,
          description: requestBody.description,
          status: 'pending',
          createdAt: new Date()
        }
      };

      reportUserService.reportUser.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/report-user')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Report submitted successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination', null);
      expect(response.body.data).toMatchObject({
        message: mockResponse.message,
        report: expect.objectContaining({
          _id: expect.any(String),
          reportedUser: mockResponse.report.reportedUser,
          reason: mockResponse.report.reason,
          description: mockResponse.report.description,
          status: mockResponse.report.status,
          createdAt: expect.any(String) // Dates get serialized as strings in JSON
        })
      });
    });

    it('should handle concurrent requests properly', async () => {
      // Arrange
      const requestBody = {
        userId: new mongoose.Types.ObjectId().toString(),
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      const mockResponse = {
        message: 'Report submitted successfully',
        report: {
          _id: new mongoose.Types.ObjectId(),
          reportedUser: {
            userId: requestBody.userId,
            userType: requestBody.userType
          },
          reason: requestBody.reason,
          description: requestBody.description,
          status: 'pending',
          createdAt: new Date()
        }
      };

      reportUserService.reportUser.mockResolvedValue(mockResponse);

      // Act
      const promises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/v2/buyers/report-user')
          .set('Authorization', `Bearer ${token}`)
          .send(requestBody)
          .expect(201)
      );

      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Report submitted successfully');
      });

      expect(reportUserService.reportUser).toHaveBeenCalledTimes(3);
    });
  });
});