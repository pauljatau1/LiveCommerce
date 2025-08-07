const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Mock the service
jest.mock('@modules/buyer/services/topUpWallet.service');
const topUpWalletService = require('@modules/buyer/services/topUpWallet.service');

// Import the app
const { app } = require('@/app');

let mongoServer;

// Helper function to generate JWT token
const generateToken = (buyerId, isAdmin = false) => {
  return jwt.sign(
    { id: buyerId, role: 'Buyer', isAdmin },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '2w' }
  );
};

describe('topUpWallet.controller', () => {
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
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('POST /api/v2/buyers/wallet/topup', () => {
    it('should successfully top up wallet', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up',
        bypassPaystack: false
      };
      const createdAt = new Date();
      const mockResponse = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'PAY-1234567890-ABC123',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: createdAt
        },
        newBalance: 15000
      };

      topUpWalletService.topUpWallet.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet topped up successfully');
      expect(response.body.data.message).toBe('Wallet topped up successfully');
      expect(response.body.data.newBalance).toBe(15000);
      expect(response.body.data.transaction.type).toBe('credit');
      expect(response.body.data.transaction.amount).toBe(5000);
      expect(response.body.data.transaction.paymentReference).toBe('PAY-1234567890-ABC123');
      expect(response.body.data.transaction.description).toBe('Wallet top up');
      expect(response.body.data.transaction.status).toBe('completed');
      expect(response.body.data.transaction.createdAt).toBe(createdAt.toISOString());
      expect(topUpWalletService.topUpWallet).toHaveBeenCalledWith(
        buyerId,
        topUpData,
        expect.objectContaining({ id: buyerId, role: 'Buyer', isAdmin: false }),
        expect.any(String)
      );
    });

    it('should handle existing completed transaction', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up',
        paymentReference: 'PAY-1234567890-ABC123'
      };
      const createdAt = new Date();
      const mockResponse = {
        message: 'Payment already processed',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'PAY-1234567890-ABC123',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: createdAt
        },
        newBalance: 10000
      };

      topUpWalletService.topUpWallet.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment already processed');
      expect(response.body.data.message).toBe('Payment already processed');
      expect(response.body.data.newBalance).toBe(10000);
      expect(response.body.data.transaction.type).toBe('credit');
      expect(response.body.data.transaction.amount).toBe(5000);
      expect(response.body.data.transaction.paymentReference).toBe('PAY-1234567890-ABC123');
      expect(response.body.data.transaction.description).toBe('Wallet top up');
      expect(response.body.data.transaction.status).toBe('completed');
      expect(response.body.data.transaction.createdAt).toBe(createdAt.toISOString());
    });

    it('should return 422 when validation fails', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: -100,
        description: 'Wallet top up'
      };
      const ValidationError = require('@utils/errors/ValidationError');

      topUpWalletService.topUpWallet.mockRejectedValue(
        new ValidationError([
          { field: 'amount', message: 'Invalid amount. Amount must be greater than 0.' }
        ])
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual([
        { field: 'amount', message: 'Invalid amount. Amount must be greater than 0.' }
      ]);
    });

    it('should return 404 when buyer not found', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up'
      };
      const NotFoundException = require('@utils/errors/NotFoundException');

      topUpWalletService.topUpWallet.mockRejectedValue(
        new NotFoundException('Buyer not found')
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should return 401 when token is missing', async () => {
      // Arrange
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up'
      };

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up'
      };
      const invalidToken = 'invalid-token';

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${invalidToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 403 when non-admin user tries to bypass Paystack', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up',
        bypassPaystack: true
      };
      const ValidationError = require('@utils/errors/ValidationError');

      topUpWalletService.topUpWallet.mockRejectedValue(
        new ValidationError([
          { field: 'bypassPaystack', message: 'Direct wallet top-up is not allowed' }
        ])
      );
      const token = generateToken(buyerId, false); // non-admin

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual([
        { field: 'bypassPaystack', message: 'Direct wallet top-up is not allowed' }
      ]);
    });

    it('should allow admin user to bypass Paystack', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up',
        bypassPaystack: true
      };
      const createdAt = new Date();
      const mockResponse = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 5000,
          paymentReference: 'PAY-1234567890-ABC123',
          description: 'Wallet top up (Direct)',
          status: 'completed',
          createdAt: createdAt
        },
        newBalance: 15000
      };

      topUpWalletService.topUpWallet.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId, true); // admin user

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet topped up successfully');
      expect(response.body.data.transaction.description).toBe('Wallet top up (Direct)');
      expect(topUpWalletService.topUpWallet).toHaveBeenCalledWith(
        buyerId,
        topUpData,
        expect.objectContaining({ id: buyerId, role: 'Buyer', isAdmin: true }),
        expect.any(String)
      );
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 5000,
        description: 'Wallet top up'
      };

      topUpWalletService.topUpWallet.mockRejectedValue(
        new Error('Unexpected error')
      );
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle minimal valid data', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId().toString();
      const topUpData = {
        amount: 1000
      };
      const createdAt = new Date();
      const mockResponse = {
        message: 'Wallet topped up successfully',
        transaction: {
          type: 'credit',
          amount: 1000,
          paymentReference: 'PAY-1234567890-ABC123',
          description: 'Wallet top up',
          status: 'completed',
          createdAt: createdAt
        },
        newBalance: 6000
      };

      topUpWalletService.topUpWallet.mockResolvedValue(mockResponse);
      const token = generateToken(buyerId);

      // Act
      const response = await request(app)
        .post('/api/v2/buyers/wallet/topup')
        .send(topUpData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet topped up successfully');
      expect(response.body.data.transaction.amount).toBe(1000);
      expect(response.body.data.transaction.paymentReference).toBe('PAY-1234567890-ABC123');
    });
  });
});
