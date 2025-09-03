const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

// Mock the selectAccountType service
jest.mock('@modules/seller/services/selectAccountType.service', () => ({
  selectAccountType: jest.fn()
}));

// Import the mocked service
const selectAccountTypeService = require('@modules/seller/services/selectAccountType.service');

const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('Seller Controller - Select Account Type', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
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

  // Helper function to create a valid JWT token
  const createAuthToken = (userId = '507f1f77bcf86cd799439011', role = 'Seller') => {
    return jwt.sign(
      { id: userId, role: role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  };

  describe('PUT /api/v2/sellers/profile/account-type', () => {
    const validAccountTypeData = {
      accountType: 'business'
    };

    const mockSellerResponse = {
      _id: '507f1f77bcf86cd799439011',
      accountType: 'business',
      isProfileComplete: true,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      storeName: "John's Store"
    };

    it('should successfully select business account type', async () => {
      // Arrange
      const authToken = createAuthToken();
      selectAccountTypeService.selectAccountType.mockResolvedValue(mockSellerResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAccountTypeData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: mockSellerResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', validAccountTypeData);
    });

    it('should successfully select individual account type', async () => {
      // Arrange
      const authToken = createAuthToken();
      const individualData = { accountType: 'individual' };
      const individualResponse = {
        ...mockSellerResponse,
        accountType: 'individual',
        isProfileComplete: false
      };
      selectAccountTypeService.selectAccountType.mockResolvedValue(individualResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(individualData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: individualResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', individualData);
    });

    it('should handle uppercase account type input', async () => {
      // Arrange
      const authToken = createAuthToken();
      const uppercaseData = { accountType: 'BUSINESS' };
      selectAccountTypeService.selectAccountType.mockResolvedValue(mockSellerResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(uppercaseData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: mockSellerResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', uppercaseData);
    });

    it('should handle mixed case account type input', async () => {
      // Arrange
      const authToken = createAuthToken();
      const mixedCaseData = { accountType: 'BuSiNeSs' };
      selectAccountTypeService.selectAccountType.mockResolvedValue(mockSellerResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mixedCaseData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: mockSellerResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', mixedCaseData);
    });

    it('should handle incomplete profile response', async () => {
      // Arrange
      const authToken = createAuthToken();
      const incompleteResponse = {
        ...mockSellerResponse,
        isProfileComplete: false
      };
      selectAccountTypeService.selectAccountType.mockResolvedValue(incompleteResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAccountTypeData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: incompleteResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', validAccountTypeData);
    });

    it('should return 422 for validation errors', async () => {
      // Arrange
      const authToken = createAuthToken();
      const validationError = new ValidationError([
        { field: 'accountType', message: 'Invalid account type' }
      ]);
      selectAccountTypeService.selectAccountType.mockRejectedValue(validationError);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountType: 'invalid' });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'accountType', message: 'Invalid account type' }
        ]
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { accountType: 'invalid' });
    });

    it('should return 404 when seller is not found', async () => {
      // Arrange
      const authToken = createAuthToken();
      const notFoundError = new NotFoundException('Seller not found');
      selectAccountTypeService.selectAccountType.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAccountTypeData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found'
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', validAccountTypeData);
    });

    it('should return 500 for generic errors', async () => {
      // Arrange
      const authToken = createAuthToken();
      const genericError = new Error('Database connection failed');
      selectAccountTypeService.selectAccountType.mockRejectedValue(genericError);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAccountTypeData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong!'
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', validAccountTypeData);
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .send(validAccountTypeData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'No token provided'
      });
      expect(selectAccountTypeService.selectAccountType).not.toHaveBeenCalled();
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', 'Bearer invalid-token')
        .send(validAccountTypeData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid token'
      });
      expect(selectAccountTypeService.selectAccountType).not.toHaveBeenCalled();
    });

    it('should handle request with additional fields in body', async () => {
      // Arrange
      const authToken = createAuthToken();
      const extendedData = {
        accountType: 'business',
        additionalField: 'extra value',
        anotherField: 123
      };
      selectAccountTypeService.selectAccountType.mockResolvedValue(mockSellerResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(extendedData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: mockSellerResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', extendedData);
    });

    it('should handle request with minimal required data', async () => {
      // Arrange
      const authToken = createAuthToken();
      const minimalData = { accountType: 'individual' };
      const individualResponse = {
        ...mockSellerResponse,
        accountType: 'individual',
        isProfileComplete: false
      };
      selectAccountTypeService.selectAccountType.mockResolvedValue(individualResponse);

      // Act
      const response = await request(app)
        .put('/api/v2/sellers/profile/account-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Account type selected successfully',
        data: {
          message: 'Account type selected successfully',
          seller: individualResponse
        },
        pagination: null
      });
      expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', minimalData);
    });

    it('should handle different error types correctly', async () => {
      // Test with different error types
      const errorTypes = [
        { error: new TypeError('Invalid type'), expectedStatus: 500 },
        { error: new ReferenceError('Undefined variable'), expectedStatus: 500 },
        { error: new SyntaxError('Syntax error'), expectedStatus: 500 }
      ];

      for (const { error, expectedStatus } of errorTypes) {
        // Reset mocks
        jest.clearAllMocks();
        
        // Arrange
        const authToken = createAuthToken();
        selectAccountTypeService.selectAccountType.mockRejectedValue(error);

        // Act
        const response = await request(app)
          .put('/api/v2/sellers/profile/account-type')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validAccountTypeData);

        // Assert
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toEqual({
          error: 'Something went wrong!'
        });
        expect(selectAccountTypeService.selectAccountType).toHaveBeenCalledWith('507f1f77bcf86cd799439011', validAccountTypeData);
      }
    });
  });
});
