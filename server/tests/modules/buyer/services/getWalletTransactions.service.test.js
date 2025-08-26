const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const getWalletTransactionsService = require('@modules/buyer/services/getWalletTransactions.service');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@utils/queryParser');

const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const queryParser = require('@utils/queryParser');

let mongoServer;

describe('getWalletTransactions Service', () => {
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

  describe('getPaginationOptions', () => {
    it('should return pagination options when page and limit are provided', () => {
      const mockReq = {
        query: {
          page: '2',
          limit: '5'
        }
      };

      queryParser.getPaginationOptions.mockReturnValue({
        enabled: true,
        page: 2,
        limit: 5
      });

      const result = getWalletTransactionsService.getPaginationOptions(mockReq);

      expect(queryParser.getPaginationOptions).toHaveBeenCalledWith(mockReq);
      expect(result).toEqual({
        enabled: true,
        page: 2,
        limit: 5
      });
    });

    it('should return default pagination options when page and limit are missing', () => {
      const mockReq = {
        query: {}
      };

      queryParser.getPaginationOptions.mockReturnValue({
        enabled: false,
        page: 1,
        limit: 10
      });

      const result = getWalletTransactionsService.getPaginationOptions(mockReq);

      expect(queryParser.getPaginationOptions).toHaveBeenCalledWith(mockReq);
      expect(result).toEqual({
        enabled: false,
        page: 1,
        limit: 10
      });
    });
  });

  describe('getFilters', () => {
    it('should extract type filter from query', () => {
      const mockReq = {
        query: {
          type: 'credit'
        }
      };

      const result = getWalletTransactionsService.getFilters(mockReq);

      expect(result).toEqual({
        type: 'credit'
      });
    });

    it('should extract startDate filter from query', () => {
      const mockReq = {
        query: {
          startDate: '2024-01-15T00:00:00.000Z'
        }
      };

      const result = getWalletTransactionsService.getFilters(mockReq);

      expect(result).toEqual({
        startDate: '2024-01-15T00:00:00.000Z'
      });
    });

    it('should extract endDate filter from query', () => {
      const mockReq = {
        query: {
          endDate: '2024-01-17T23:59:59.000Z'
        }
      };

      const result = getWalletTransactionsService.getFilters(mockReq);

      expect(result).toEqual({
        endDate: '2024-01-17T23:59:59.000Z'
      });
    });

    it('should extract multiple filters from query', () => {
      const mockReq = {
        query: {
          type: 'debit',
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-01-17T23:59:59.000Z'
        }
      };

      const result = getWalletTransactionsService.getFilters(mockReq);

      expect(result).toEqual({
        type: 'debit',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-17T23:59:59.000Z'
      });
    });

    it('should return empty object when no filters are provided', () => {
      const mockReq = {
        query: {}
      };

      const result = getWalletTransactionsService.getFilters(mockReq);

      expect(result).toEqual({});
    });

    it('should handle undefined values in query', () => {
      const mockReq = {
        query: {
          type: undefined,
          startDate: undefined,
          endDate: undefined
        }
      };

      const result = getWalletTransactionsService.getFilters(mockReq);

      expect(result).toEqual({
        type: undefined,
        startDate: undefined,
        endDate: undefined
      });
    });
  });

  describe('filterTransactions', () => {
    const mockTransactions = [
      {
        type: 'credit',
        amount: 1000,
        createdAt: new Date('2024-01-15T10:00:00.000Z')
      },
      {
        type: 'debit',
        amount: 500,
        createdAt: new Date('2024-01-16T11:00:00.000Z')
      },
      {
        type: 'credit',
        amount: 2000,
        createdAt: new Date('2024-01-17T12:00:00.000Z')
      }
    ];

    it('should return all transactions when no filters are applied', () => {
      const filters = {};
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toEqual(mockTransactions);
    });

    it('should filter transactions by type credit', () => {
      const filters = { type: 'credit' };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toHaveLength(2);
      expect(result.every(t => t.type === 'credit')).toBe(true);
    });

    it('should filter transactions by type debit', () => {
      const filters = { type: 'debit' };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('debit');
    });

    it('should filter transactions by startDate', () => {
      const filters = { startDate: '2024-01-16T00:00:00.000Z' };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toHaveLength(2);
      expect(result.every(t => new Date(t.createdAt) >= new Date('2024-01-16T00:00:00.000Z'))).toBe(true);
    });

    it('should filter transactions by endDate', () => {
      const filters = { endDate: '2024-01-16T23:59:59.000Z' };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toHaveLength(2);
      expect(result.every(t => new Date(t.createdAt) <= new Date('2024-01-16T23:59:59.000Z'))).toBe(true);
    });

    it('should filter transactions by date range', () => {
      const filters = {
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-16T23:59:59.000Z'
      };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toHaveLength(2);
      expect(result.every(t => {
        const date = new Date(t.createdAt);
        return date >= new Date('2024-01-15T00:00:00.000Z') && date <= new Date('2024-01-16T23:59:59.000Z');
      })).toBe(true);
    });

    it('should filter transactions by type and date range', () => {
      const filters = {
        type: 'credit',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-16T23:59:59.000Z'
      };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('credit');
      expect(new Date(result[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date('2024-01-15T00:00:00.000Z').getTime());
      expect(new Date(result[0].createdAt).getTime()).toBeLessThanOrEqual(new Date('2024-01-16T23:59:59.000Z').getTime());
    });

    it('should return empty array when no transactions match filters', () => {
      const filters = { type: 'invalid' };
      const result = getWalletTransactionsService.filterTransactions(mockTransactions, filters);

      expect(result).toEqual([]);
    });

    it('should handle empty transactions array', () => {
      const filters = { type: 'credit' };
      const result = getWalletTransactionsService.filterTransactions([], filters);

      expect(result).toEqual([]);
    });
  });

  describe('sortTransactions', () => {
    it('should sort transactions by creation date in descending order', () => {
      const transactions = [
        {
          type: 'credit',
          amount: 1000,
          createdAt: new Date('2024-01-15T10:00:00.000Z')
        },
        {
          type: 'debit',
          amount: 500,
          createdAt: new Date('2024-01-17T12:00:00.000Z')
        },
        {
          type: 'credit',
          amount: 2000,
          createdAt: new Date('2024-01-16T11:00:00.000Z')
        }
      ];

      const result = getWalletTransactionsService.sortTransactions(transactions);

      expect(result).toHaveLength(3);
      expect(result[0].createdAt).toEqual(new Date('2024-01-17T12:00:00.000Z'));
      expect(result[1].createdAt).toEqual(new Date('2024-01-16T11:00:00.000Z'));
      expect(result[2].createdAt).toEqual(new Date('2024-01-15T10:00:00.000Z'));
    });

    it('should handle empty transactions array', () => {
      const result = getWalletTransactionsService.sortTransactions([]);

      expect(result).toEqual([]);
    });

    it('should handle single transaction', () => {
      const transactions = [
        {
          type: 'credit',
          amount: 1000,
          createdAt: new Date('2024-01-15T10:00:00.000Z')
        }
      ];

      const result = getWalletTransactionsService.sortTransactions(transactions);

      expect(result).toEqual(transactions);
    });

    it('should handle transactions with same date', () => {
      const sameDate = new Date('2024-01-15T10:00:00.000Z');
      const transactions = [
        {
          type: 'credit',
          amount: 1000,
          createdAt: sameDate
        },
        {
          type: 'debit',
          amount: 500,
          createdAt: sameDate
        }
      ];

      const result = getWalletTransactionsService.sortTransactions(transactions);

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toEqual(sameDate);
      expect(result[1].createdAt).toEqual(sameDate);
    });
  });

  describe('getWalletTransactions', () => {
    let testBuyer;

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
    });

    it('should retrieve all wallet transactions without pagination', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const result = await getWalletTransactionsService.getWalletTransactions(testBuyer._id.toString());

      expect(buyerRepository.findById).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(result).toEqual({
        data: expect.any(Array),
        pagination: {}
      });
      expect(result.data).toHaveLength(3);
      expect(result.data[0].createdAt).toEqual(new Date('2024-01-17T12:00:00.000Z')); // Most recent first
    });

    it('should filter transactions by type', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const filters = { type: 'credit' };
      const result = await getWalletTransactionsService.getWalletTransactions(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(2);
      expect(result.data.every(t => t.type === 'credit')).toBe(true);
    });

    it('should filter transactions by date range', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const filters = {
        startDate: '2024-01-16T00:00:00.000Z',
        endDate: '2024-01-17T23:59:59.000Z'
      };
      const result = await getWalletTransactionsService.getWalletTransactions(testBuyer._id.toString(), filters);

      expect(result.data).toHaveLength(2);
    });

    it('should return empty data when buyer has no wallet', async () => {
      const buyerWithoutWallet = new Buyer({
        firstName: 'No',
        lastName: 'Wallet',
        email: 'nowallet@example.com',
        username: 'nowallet',
        password: 'password123'
      });
      await buyerWithoutWallet.save();

      buyerRepository.findById.mockResolvedValue(buyerWithoutWallet);

      const result = await getWalletTransactionsService.getWalletTransactions(buyerWithoutWallet._id.toString());

      expect(result).toEqual({
        data: [],
        pagination: {}
      });
    });

    it('should return empty data when buyer has no transactions', async () => {
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

      buyerRepository.findById.mockResolvedValue(buyerWithoutTransactions);

      const result = await getWalletTransactionsService.getWalletTransactions(buyerWithoutTransactions._id.toString());

      expect(result).toEqual({
        data: [],
        pagination: {}
      });
    });

    it('should return empty data when buyer is not found', async () => {
      buyerRepository.findById.mockResolvedValue(null);

      const result = await getWalletTransactionsService.getWalletTransactions('nonexistent-id');

      expect(result).toEqual({
        data: [],
        pagination: {}
      });
    });

    it('should handle repository errors', async () => {
      buyerRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(
        getWalletTransactionsService.getWalletTransactions(testBuyer._id.toString())
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPaginatedWalletTransactions', () => {
    let testBuyer;

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
            },
            {
              type: 'debit',
              amount: 300,
              paymentReference: 'TXN_004',
              description: 'Purchase',
              status: 'completed',
              createdAt: new Date('2024-01-18T13:00:00.000Z')
            },
            {
              type: 'credit',
              amount: 1500,
              paymentReference: 'TXN_005',
              description: 'Top up',
              status: 'completed',
              createdAt: new Date('2024-01-19T14:00:00.000Z')
            }
          ],
          onHoldItems: []
        }
      });

      await testBuyer.save();
    });

    it('should retrieve paginated wallet transactions', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const params = {
        page: 1,
        limit: 2,
        filters: {}
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions(testBuyer._id.toString(), params);

      expect(buyerRepository.findById).toHaveBeenCalledWith(testBuyer._id.toString());
      expect(result).toEqual({
        data: expect.any(Array),
        pagination: expect.objectContaining({
          currentPage: 1,
          totalPages: 3,
          totalTransactions: 5,
          hasMore: true,
          hasPrevious: false
        })
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].createdAt).toEqual(new Date('2024-01-19T14:00:00.000Z')); // Most recent first
    });

    it('should handle second page', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const params = {
        page: 2,
        limit: 2,
        filters: {}
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions(testBuyer._id.toString(), params);

      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalTransactions: 5,
        hasMore: true,
        hasPrevious: true
      });
      expect(result.data).toHaveLength(2);
    });

    it('should handle last page', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const params = {
        page: 3,
        limit: 2,
        filters: {}
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions(testBuyer._id.toString(), params);

      expect(result.pagination).toEqual({
        currentPage: 3,
        totalPages: 3,
        totalTransactions: 5,
        hasMore: false,
        hasPrevious: true
      });
      expect(result.data).toHaveLength(1);
    });

    it('should filter transactions before pagination', async () => {
      buyerRepository.findById.mockResolvedValue(testBuyer);

      const params = {
        page: 1,
        limit: 2,
        filters: { type: 'credit' }
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions(testBuyer._id.toString(), params);

      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalTransactions: 3,
        hasMore: true,
        hasPrevious: false
      });
      expect(result.data).toHaveLength(2);
      expect(result.data.every(t => t.type === 'credit')).toBe(true);
    });

    it('should return empty pagination when buyer has no wallet', async () => {
      const buyerWithoutWallet = new Buyer({
        firstName: 'No',
        lastName: 'Wallet',
        email: 'nowallet@example.com',
        username: 'nowallet',
        password: 'password123'
      });
      await buyerWithoutWallet.save();

      buyerRepository.findById.mockResolvedValue(buyerWithoutWallet);

      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions(buyerWithoutWallet._id.toString(), params);

      expect(result).toEqual({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalTransactions: 0,
          hasMore: false,
          hasPrevious: false
        }
      });
    });

    it('should return empty pagination when buyer has no transactions', async () => {
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

      buyerRepository.findById.mockResolvedValue(buyerWithoutTransactions);

      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions(buyerWithoutTransactions._id.toString(), params);

      expect(result).toEqual({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalTransactions: 0,
          hasMore: false,
          hasPrevious: false
        }
      });
    });

    it('should return empty pagination when buyer is not found', async () => {
      buyerRepository.findById.mockResolvedValue(null);

      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      const result = await getWalletTransactionsService.getPaginatedWalletTransactions('nonexistent-id', params);

      expect(result).toEqual({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalTransactions: 0,
          hasMore: false,
          hasPrevious: false
        }
      });
    });

    it('should handle repository errors', async () => {
      buyerRepository.findById.mockRejectedValue(new Error('Database error'));

      const params = {
        page: 1,
        limit: 10,
        filters: {}
      };

      await expect(
        getWalletTransactionsService.getPaginatedWalletTransactions(testBuyer._id.toString(), params)
      ).rejects.toThrow('Database error');
    });
  });

});
