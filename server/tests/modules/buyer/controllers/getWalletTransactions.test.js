const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

let mongoServer;

describe('Buyer Controller - getWalletTransactions', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('getWalletTransactions', () => {
    let testBuyer;
    let authToken;

    beforeEach(async () => {
      // Create a test buyer with wallet transactions
      testBuyer = new Buyer({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        wallet: {
          balance: 5000,
          onHoldAmount: 0,
          currency: 'NGN',
          transactions: [
            {
              type: 'credit',
              amount: 1000,
              paymentReference: 'TXN_001',
              description: 'Wallet top up',
              status: 'completed',
              createdAt: new Date('2024-01-15T10:00:00.000Z')
            },
            {
              type: 'debit',
              amount: 500,
              paymentReference: 'TXN_002',
              description: 'Purchase payment',
              status: 'completed',
              createdAt: new Date('2024-01-16T11:00:00.000Z')
            },
            {
              type: 'credit',
              amount: 2000,
              paymentReference: 'TXN_003',
              description: 'Refund',
              status: 'completed',
              createdAt: new Date('2024-01-17T12:00:00.000Z')
            }
          ],
          onHoldItems: []
        }
      });

      await testBuyer.save();

      // Generate JWT token for authentication
      authToken = jwt.sign(
        { id: testBuyer._id, role: 'Buyer' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should retrieve wallet transactions successfully with default pagination', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle type filter for credit transactions', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          type: 'credit'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle type filter for debit transactions', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          type: 'debit'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle startDate filter', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          startDate: '2024-01-16T00:00:00.000Z'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle endDate filter', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          endDate: '2024-01-16T23:59:59.000Z'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle date range filter', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-17T23:59:59.000Z'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle pagination parameters', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          page: '2',
          limit: '1'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 2,
            totalPages: expect.any(Number),
            totalTransactions: expect.any(Number),
            hasMore: expect.any(Boolean),
            hasPrevious: expect.any(Boolean)
          })
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle unpaginated request when page and limit are missing', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          type: 'credit'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle paginated request when both page and limit are provided', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          page: '1',
          limit: '10',
          type: 'credit'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: expect.any(Number),
            totalTransactions: expect.any(Number),
            hasMore: expect.any(Boolean),
            hasPrevious: expect.any(Boolean)
          })
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle buyer with no wallet transactions', async () => {
      // Create buyer without wallet transactions
      const buyerWithoutTransactions = new Buyer({
        firstName: 'No',
        lastName: 'Transactions',
        email: 'notrans@example.com',
        username: 'notrans',
        password: 'password123',
        wallet: {
          balance: 0,
          onHoldAmount: 0,
          currency: 'NGN',
          transactions: [],
          onHoldItems: []
        }
      });

      await buyerWithoutTransactions.save();

      const req = {
        user: { id: buyerWithoutTransactions._id.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle buyer with no wallet', async () => {
      // Create buyer without wallet
      const buyerWithoutWallet = new Buyer({
        firstName: 'No',
        lastName: 'Wallet',
        email: 'nowallet@example.com',
        username: 'nowallet',
        password: 'password123'
      });

      await buyerWithoutWallet.save();

      const req = {
        user: { id: buyerWithoutWallet._id.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle service errors gracefully', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      // Mock the service to throw an error
      const getWalletTransactionsService = require('@modules/buyer/services/getWalletTransactions.service');
      const originalGetPaginatedWalletTransactions = getWalletTransactionsService.getPaginatedWalletTransactions;
      const originalGetWalletTransactions = getWalletTransactionsService.getWalletTransactions;
      
      getWalletTransactionsService.getPaginatedWalletTransactions = jest.fn().mockRejectedValue(new Error('Service error'));
      getWalletTransactionsService.getWalletTransactions = jest.fn().mockRejectedValue(new Error('Service error'));

      await buyerController.getWalletTransactions(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      // Restore the original methods
      getWalletTransactionsService.getPaginatedWalletTransactions = originalGetPaginatedWalletTransactions;
      getWalletTransactionsService.getWalletTransactions = originalGetWalletTransactions;
    });

    it('should handle empty query parameters', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          type: '',
          startDate: '',
          endDate: '',
          page: '',
          limit: ''
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle combination of filters', async () => {
      const req = {
        user: { id: testBuyer._id.toString() },
        query: {
          type: 'credit',
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-17T23:59:59.000Z',
          page: '1',
          limit: '5'
        }
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });

    it('should handle invalid buyer ID', async () => {
      const req = {
        user: { id: 'invalid-id' },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle non-existent buyer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const req = {
        user: { id: nonExistentId.toString() },
        query: {}
      };

      const res = {
        success: jest.fn()
      };

      const next = jest.fn();

      await buyerController.getWalletTransactions(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          pagination: expect.any(Object)
        }),
        'Wallet transactions retrieved successfully'
      );
    });
  });
});
