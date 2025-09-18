/**
 * Get Orders Service Tests
 *
 * This test suite covers all functionality of the getOrders service including:
 * - Order retrieval with pagination
 * - Order filtering by status and date range
 * - Seller validation
 * - Error handling for various scenarios
 * - Data population and formatting
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getOrdersService = require('@modules/seller/services/getOrders.service');
const orderRepository = require('@modules/seller/repositories/order.repository');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const Order = require('@models/Order');
const Seller = require('@models/Seller');
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

describe('Get Orders Service', () => {
  let mongoServer;
  let sellerId;
  let buyerId;
  let productId;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up database connection
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await Order.deleteMany({});
    await Seller.deleteMany({});
    await Buyer.deleteMany({});
    await Product.deleteMany({});

    // Create test data
    sellerId = new mongoose.Types.ObjectId();
    buyerId = new mongoose.Types.ObjectId();
    productId = new mongoose.Types.ObjectId();

    // Create seller
    const seller = new Seller({
      _id: sellerId,
      firstName: 'John',
      lastName: 'Seller',
      email: 'john.seller@example.com',
      password: 'hashedPassword',
      phoneNumber: '+2348012345678',
      storeName: 'John\'s Store'
    });

    // Create buyer
    const buyer = new Buyer({
      _id: buyerId,
      firstName: 'Jane',
      lastName: 'Buyer',
      email: 'jane.buyer@example.com',
      password: 'hashedPassword',
      phoneNumber: '+2348012345679'
    });

    // Create product
    const product = new Product({
      _id: productId,
      name: 'Test Product',
      description: 'Test product description',
      price: 100,
      category: 'Electronics',
      stock: 10,
      seller: sellerId,
      images: [{
        data: 'https://example.com/image.jpg',
        contentType: 'image/jpeg',
        key: 'test-image-key'
      }]
    });

    await Promise.all([seller.save(), buyer.save(), product.save()]);
  });

  describe('getPaginationOptions', () => {
    it('should return default pagination options when no query params provided', () => {
      // Arrange: Mock request with no query parameters
      const req = { query: {} };

      // Act: Get pagination options
      const result = getOrdersService.getPaginationOptions(req);

      // Assert: Verify default values
      expect(result).toEqual({
        enabled: true,
        page: 1,
        limit: 10,
        skip: 0
      });
    });

    it('should use provided page and limit parameters', () => {
      // Arrange: Mock request with query parameters
      const req = { query: { page: '3', limit: '20' } };

      // Act: Get pagination options
      const result = getOrdersService.getPaginationOptions(req);

      // Assert: Verify provided values
      expect(result).toEqual({
        enabled: true,
        page: 3,
        limit: 20,
        skip: 40 // (3-1) * 20
      });
    });

    it('should enforce minimum values for page and limit', () => {
      // Arrange: Mock request with invalid parameters
      const req = { query: { page: '0', limit: '-5' } };

      // Act: Get pagination options
      const result = getOrdersService.getPaginationOptions(req);

      // Assert: Verify minimum values are enforced
      expect(result).toEqual({
        enabled: true,
        page: 1,
        limit: 1,
        skip: 0
      });
    });

    it('should enforce maximum limit of 100', () => {
      // Arrange: Mock request with limit exceeding maximum
      const req = { query: { page: '1', limit: '200' } };

      // Act: Get pagination options
      const result = getOrdersService.getPaginationOptions(req);

      // Assert: Verify maximum limit is enforced
      expect(result).toEqual({
        enabled: true,
        page: 1,
        limit: 100,
        skip: 0
      });
    });
  });

  describe('getFilters', () => {
    it('should extract filter parameters from request', () => {
      // Arrange: Mock request with filter parameters
      const req = {
        query: {
          status: 'confirmed',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      };

      // Act: Get filters
      const result = getOrdersService.getFilters(req);

      // Assert: Verify filters are extracted
      expect(result).toEqual({
        status: 'confirmed',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });
    });

    it('should return null values when no filter parameters provided', () => {
      // Arrange: Mock request with no filter parameters
      const req = { query: {} };

      // Act: Get filters
      const result = getOrdersService.getFilters(req);

      // Assert: Verify null values
      expect(result).toEqual({
        status: null,
        startDate: null,
        endDate: null
      });
    });
  });

  describe('getPaginatedOrders', () => {
    it('should retrieve paginated orders successfully', async () => {
      // Arrange: Create test orders
      const order1 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 2,
          price: 100,
          status: 'confirmed'
        }],
        totalAmount: 200,
        status: 'confirmed'
      });

      const order2 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'shipped',
          }],
        totalAmount: 100,
        status: 'shipped'
      });

      await Order.insertMany([order1, order2]);

      // Act: Get paginated orders
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: null, startDate: null, endDate: null }
      };
      const result = await getOrdersService.getPaginatedOrders(sellerId.toString(), params);

      // Assert: Verify paginated response
      expect(result.data.orders).toHaveLength(2);
      expect(result.data.currentPage).toBe(1);
      expect(result.data.totalPages).toBe(1);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 2,
        hasMore: false,
        hasPrevious: false
      });
    });

    it('should filter orders by status', async () => {
      // Arrange: Create orders with different statuses
      const order1 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'confirmed',
          }],
        totalAmount: 100,
        status: 'confirmed'
      });

      const order2 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'shipped',
          }],
        totalAmount: 100,
        status: 'shipped'
      });

      await Order.insertMany([order1, order2]);

      // Act: Get orders filtered by status
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: 'confirmed', startDate: null, endDate: null }
      };
      const result = await getOrdersService.getPaginatedOrders(sellerId.toString(), params);

      // Assert: Verify only confirmed orders are returned
      expect(result.data.orders).toHaveLength(1);
      expect(result.data.orders[0].items[0].status).toBe('confirmed');
    });

    it('should filter orders by date range', async () => {
      // Arrange: Create orders with different dates
      const pastDate = new Date('2024-01-01');
      const currentDate = new Date('2024-06-01');
      const futureDate = new Date('2024-12-01');

      const order1 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'confirmed',
          }],
        totalAmount: 100,
        status: 'confirmed',
        createdAt: pastDate
      });

      const order2 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'confirmed',
          }],
        totalAmount: 100,
        status: 'confirmed',
        createdAt: currentDate
      });

      const order3 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'confirmed',
          }],
        totalAmount: 100,
        status: 'confirmed',
        createdAt: futureDate
      });

      await Order.insertMany([order1, order2, order3]);

      // Act: Get orders filtered by date range
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: null, startDate: '2024-05-01', endDate: '2024-07-01' }
      };
      const result = await getOrdersService.getPaginatedOrders(sellerId.toString(), params);

      // Assert: Verify only orders in date range are returned
      expect(result.data.orders).toHaveLength(1);
      expect(new Date(result.data.orders[0].createdAt)).toEqual(currentDate);
    });

    it('should throw ValidationError for invalid seller ID', async () => {
      // Arrange: Use invalid seller ID
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: null, startDate: null, endDate: null }
      };

      // Act & Assert: Verify ValidationError is thrown
      await expect(getOrdersService.getPaginatedOrders('invalid-id', params))
        .rejects.toThrow(ValidationError);
      
      // Verify error structure and specific message
      const error = await getOrdersService.getPaginatedOrders('invalid-id', params).catch(e => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'sellerId',
        message: 'Seller ID must be a valid ObjectId format'
      });
    });

    it('should throw NotFoundException for non-existent seller', async () => {
      // Arrange: Use non-existent seller ID
      const nonExistentSellerId = new mongoose.Types.ObjectId();
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: null, startDate: null, endDate: null }
      };

      // Act & Assert: Verify NotFoundException is thrown
      await expect(getOrdersService.getPaginatedOrders(nonExistentSellerId.toString(), params))
        .rejects.toThrow(NotFoundException);
      
      // Verify error structure and specific message
      const error = await getOrdersService.getPaginatedOrders(nonExistentSellerId.toString(), params).catch(e => e);
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Seller not found');
    });

    it('should return empty data when no orders exist', async () => {
      // Arrange: Use valid seller with no orders
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: null, startDate: null, endDate: null }
      };

      // Act: Get paginated orders
      const result = await getOrdersService.getPaginatedOrders(sellerId.toString(), params);

      // Assert: Verify empty response
      expect(result.data.orders).toEqual([]);
      expect(result.data.currentPage).toBe(1);
      expect(result.data.totalPages).toBe(0);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalOrders: 0,
        hasMore: false,
        hasPrevious: false
      });
    });

    it('should exclude stale orders from results', async () => {
      // Arrange: Create regular and stale orders
      const regularOrder = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'confirmed',
          }],
        totalAmount: 100,
        status: 'confirmed'
      });

      const staleOrder = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'cancelled',
          }],
        totalAmount: 100,
        status: 'cancelled',
        isStale: true
      });

      await Order.insertMany([regularOrder, staleOrder]);

      // Act: Get paginated orders
      const params = {
        page: 1,
        limit: 10,
        skip: 0,
        filters: { status: null, startDate: null, endDate: null }
      };
      const result = await getOrdersService.getPaginatedOrders(sellerId.toString(), params);

      // Assert: Verify only non-stale orders are returned
      expect(result.data.orders).toHaveLength(1);
      expect(result.data.orders[0].isStale).not.toBe(true);
    });
  });

  describe('getOrders', () => {
    it('should retrieve orders without pagination', async () => {
      // Arrange: Create test orders
      const order1 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 1,
          price: 100,
          status: 'confirmed',
          }],
        totalAmount: 100,
        status: 'confirmed'
      });

      const order2 = new Order({
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId, firstName: 'Jane', lastName: 'Buyer', email: 'jane.buyer@example.com' },
        items: [{
          seller: sellerId,
          product: productId,
          quantity: 2,
          price: 100,
          status: 'shipped',
          }],
        totalAmount: 200,
        status: 'shipped'
      });

      await Order.insertMany([order1, order2]);

      // Act: Get orders without pagination
      const filters = { status: null, startDate: null, endDate: null };
      const result = await getOrdersService.getOrders(sellerId.toString(), filters);

      // Assert: Verify orders are returned without pagination
      expect(result.data.orders).toHaveLength(2);
      expect(result.data.currentPage).toBe(1);
      expect(result.data.totalPages).toBe(1);
      expect(result.pagination).toEqual({});
    });

    it('should throw ValidationError for invalid seller ID', async () => {
      // Arrange: Use invalid seller ID
      const filters = { status: null, startDate: null, endDate: null };

      // Act & Assert: Verify ValidationError is thrown
      await expect(getOrdersService.getOrders('invalid-id', filters))
        .rejects.toThrow(ValidationError);
      
      // Verify error structure and specific message
      const error = await getOrdersService.getOrders('invalid-id', filters).catch(e => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'sellerId',
        message: 'Seller ID must be a valid ObjectId format'
      });
    });

    it('should throw NotFoundException for non-existent seller', async () => {
      // Arrange: Use non-existent seller ID
      const nonExistentSellerId = new mongoose.Types.ObjectId();
      const filters = { status: null, startDate: null, endDate: null };

      // Act & Assert: Verify NotFoundException is thrown
      await expect(getOrdersService.getOrders(nonExistentSellerId.toString(), filters))
        .rejects.toThrow(NotFoundException);
      
      // Verify error structure and specific message
      const error = await getOrdersService.getOrders(nonExistentSellerId.toString(), filters).catch(e => e);
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Seller not found');
    });
  });
});
