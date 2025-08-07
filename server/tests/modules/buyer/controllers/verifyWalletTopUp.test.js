const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const Buyer = require('../../../../src/modules/buyer/models/buyer.model');

// Mock the service
jest.mock('../../../../src/modules/buyer/services/verifyWalletTopUp.service');
const verifyWalletTopUpService = require('../../../../src/modules/buyer/services/verifyWalletTopUp.service');

// Import the app
const { app } = require('../../../../src/app');

let mongoServer;

// Helper function to generate JWT token
const generateToken = (buyerId) => {
  return jwt.sign(
    { id: buyerId, role: 'Buyer' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '2w' }
  );
};

describe('verifyWalletTopUp.controller', () => {
  beforeAll(async () => {
    // Start MongoDB memory server with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear database
    await Buyer.deleteMany({});
    jest.clearAllMocks();
  });

  describe('GET /api/v2/buyers/wallet/topup/verify', () => {
    it('should successfully verify wallet top-up', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const reference = 'TXN_1234567890';
      const createdAt = new Date();
      const mockResponse = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'TXN_1234567890',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: createdAt
        },
        newBalance: 15000
      };

      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet topped up successfully');
      expect(response.body.data.message).toBe('Wallet topped up successfully');
      expect(response.body.data.newBalance).toBe(15000);
      expect(response.body.data.transaction.type).toBe('credit');
      expect(response.body.data.transaction.amount).toBe(5000);
      expect(response.body.data.transaction.paymentReference).toBe('TXN_1234567890');
      expect(response.body.data.transaction.description).toBe('Wallet top up');
      expect(response.body.data.transaction.status).toBe('completed');
      expect(response.body.data.transaction.createdAt).toBe(createdAt.toISOString());
      expect(verifyWalletTopUpService.verifyWalletTopUp).toHaveBeenCalledWith(reference);
    });

    it('should return 422 when reference is missing', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const ValidationError = require('../../../../src/utils/errors/ValidationError');

      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new ValidationError([
          { field: 'reference', message: 'Payment reference is required' }
        ])
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual([
        { field: 'reference', message: 'Payment reference is required' }
      ]);
    });

    it('should return 401 when token is missing', async () => {
      // Arrange
      const reference = 'TXN_1234567890';

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const reference = 'TXN_1234567890';
      const invalidToken = 'invalid-token';

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${invalidToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 404 when buyer not found', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const reference = 'TXN_1234567890';
      const NotFoundException = require('../../../../src/utils/errors/NotFoundException');

      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new NotFoundException('Buyer not found')
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should return 422 when validation fails', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const reference = 'TXN_1234567890';
      const ValidationError = require('../../../../src/utils/errors/ValidationError');

      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new ValidationError([
          { field: 'reference', message: 'Payment reference is required' }
        ])
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual([
        { field: 'reference', message: 'Payment reference is required' }
      ]);
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const reference = 'TXN_1234567890';

      verifyWalletTopUpService.verifyWalletTopUp.mockRejectedValue(
        new Error('Unexpected error')
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle existing completed transaction', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const reference = 'TXN_1234567890';
      const createdAt = new Date();
      const mockResponse = {
        message: 'Payment already processed',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'TXN_1234567890',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: createdAt
        },
        currentBalance: 10000
      };

      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment already processed');
      expect(response.body.data.message).toBe('Payment already processed');
      expect(response.body.data.currentBalance).toBe(10000);
      expect(response.body.data.transaction.type).toBe('credit');
      expect(response.body.data.transaction.amount).toBe(5000);
      expect(response.body.data.transaction.paymentReference).toBe('TXN_1234567890');
      expect(response.body.data.transaction.description).toBe('Wallet top up');
      expect(response.body.data.transaction.status).toBe('completed');
      expect(response.body.data.transaction.createdAt).toBe(createdAt.toISOString());
    });

    it('should handle existing pending transaction', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const reference = 'TXN_1234567890';
      const createdAt = new Date();
      const mockResponse = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'TXN_1234567890',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: createdAt
        },
        newBalance: 15000
      };

      verifyWalletTopUpService.verifyWalletTopUp.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .get('/api/v2/buyers/wallet/topup/verify')
        .query({ reference })
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet topped up successfully');
      expect(response.body.data.message).toBe('Wallet topped up successfully');
      expect(response.body.data.newBalance).toBe(15000);
      expect(response.body.data.transaction.type).toBe('credit');
      expect(response.body.data.transaction.amount).toBe(5000);
      expect(response.body.data.transaction.paymentReference).toBe('TXN_1234567890');
      expect(response.body.data.transaction.description).toBe('Wallet top up');
      expect(response.body.data.transaction.status).toBe('completed');
      expect(response.body.data.transaction.createdAt).toBe(createdAt.toISOString());
    });
  });
}); 