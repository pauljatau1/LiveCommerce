const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const getShippingLabelService = require('@modules/seller/services/getShippingLabel.service');
const orderRepository = require('@modules/seller/repositories/order.repository');
const getShippingLabelValidator = require('@modules/seller/validators/getShippingLabel.validator');
const Order = require('@models/Order');
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock external dependencies
jest.mock('@modules/seller/validators/getShippingLabel.validator');

describe('Get Shipping Label Service', () => {
  let mongoServer;
  let testOrder;
  let testBuyer;
  let testProduct;
  let testSeller;

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
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up test data
    await Order.deleteMany({});
    await Buyer.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
    jest.clearAllMocks();

    // Create test seller
    testSeller = new Seller({
      firstName: 'John',
      lastName: 'Seller',
      email: 'seller@test.com',
      password: 'hashedPassword',
      phoneNumber: '+2348012345678',
      storeName: 'Test Store'
    });
    await testSeller.save();

    // Create test buyer
    testBuyer = new Buyer({
      firstName: 'Jane',
      lastName: 'Buyer',
      email: 'buyer@test.com',
      password: 'hashedPassword',
      username: 'jane_buyer'
    });
    await testBuyer.save();

    // Create test product
    testProduct = new Product({
      name: 'Test Product',
      description: 'Test product description',
      price: 25.99,
      weight: 1.5,
      dimensions: '10x15x5cm',
      category: 'Electronics',
      stock: 10,
      seller: testSeller._id
    });
    await testProduct.save();

    // Create test order
    testOrder = new Order({
      buyer: testBuyer._id,
      seller: testSeller._id,
      buyerDetails: {
        _id: testBuyer._id,
        firstName: testBuyer.firstName,
        lastName: testBuyer.lastName,
        email: testBuyer.email
      },
      items: [{
        product: testProduct._id,
        seller: testSeller._id,
        quantity: 2,
        price: 25.99
      }],
      totalAmount: 51.98
    });
    await testOrder.save();
  });

  describe('getShippingLabel', () => {
    const validShippingLabelData = {
      orderId: null, // Will be set in tests
      itemId: null, // Will be set in tests
      sellerId: null // Will be set in tests
    };

    beforeEach(() => {
      // Set valid IDs for each test
      validShippingLabelData.orderId = testOrder._id.toString();
      validShippingLabelData.itemId = testOrder.items[0]._id.toString();
      validShippingLabelData.sellerId = testSeller._id.toString();
    });

    it('should generate shipping label successfully with valid data', async () => {
      // Mock validator to pass
      getShippingLabelValidator.validateGetShippingLabelData.mockResolvedValue();

      // Call the service
      const result = await getShippingLabelService.getShippingLabel(validShippingLabelData);

      // Verify the result structure
      expect(result).toHaveProperty('orderId', validShippingLabelData.orderId);
      expect(result).toHaveProperty('trackingNumber');
      expect(result).toHaveProperty('labelUrl', 'https://shipping-label-url.com');

      // Verify tracking number format
      expect(result.trackingNumber).toMatch(/^TN\d+$/);

      // Verify validator was called
      expect(getShippingLabelValidator.validateGetShippingLabelData).toHaveBeenCalledWith(validShippingLabelData);
    });

    it('should throw ValidationError when validation fails', async () => {
      const ValidationError = require('@utils/errors/ValidationError');
      const validationError = new ValidationError('Invalid data', ['Order ID is required']);
      
      // Mock validator to throw error
      getShippingLabelValidator.validateGetShippingLabelData.mockRejectedValue(validationError);

      // Call the service and expect it to throw
      await expect(getShippingLabelService.getShippingLabel(validShippingLabelData))
        .rejects.toThrow(ValidationError);

      // Verify validator was called
      expect(getShippingLabelValidator.validateGetShippingLabelData).toHaveBeenCalledWith(validShippingLabelData);
    });

    it('should throw error when order is not found', async () => {
      // Mock validator to pass
      getShippingLabelValidator.validateGetShippingLabelData.mockResolvedValue();

      // Use non-existent order ID
      const invalidData = { ...validShippingLabelData, orderId: new mongoose.Types.ObjectId().toString() };

      // Call the service and expect it to throw
      await expect(getShippingLabelService.getShippingLabel(invalidData))
        .rejects.toThrow('Order not found');
    });

    it('should throw error when order item is not found', async () => {
      // Mock validator to pass
      getShippingLabelValidator.validateGetShippingLabelData.mockResolvedValue();

      // Use non-existent item ID
      const invalidData = { ...validShippingLabelData, itemId: new mongoose.Types.ObjectId().toString() };

      // Call the service and expect it to throw
      await expect(getShippingLabelService.getShippingLabel(invalidData))
        .rejects.toThrow('Order item not found');
    });

    it('should throw error when seller is not authorized to access order item', async () => {
      // Mock validator to pass
      getShippingLabelValidator.validateGetShippingLabelData.mockResolvedValue();

      // Create another seller
      const anotherSeller = new Seller({
        firstName: 'Another',
        lastName: 'Seller',
        email: 'another@test.com',
        password: 'hashedPassword',
        phoneNumber: '+2348012345679',
        storeName: 'Another Store'
      });
      await anotherSeller.save();

      // Use different seller ID
      const invalidData = { ...validShippingLabelData, sellerId: anotherSeller._id.toString() };

      // Call the service and expect it to throw
      await expect(getShippingLabelService.getShippingLabel(invalidData))
        .rejects.toThrow('Unauthorized to access this order item');
    });

    it('should generate unique tracking numbers for multiple calls', async () => {
      // Mock validator to pass
      getShippingLabelValidator.validateGetShippingLabelData.mockResolvedValue();

      // Call the service multiple times
      const result1 = await getShippingLabelService.getShippingLabel(validShippingLabelData);
      const result2 = await getShippingLabelService.getShippingLabel(validShippingLabelData);

      // Verify tracking numbers are different
      expect(result1.trackingNumber).not.toBe(result2.trackingNumber);
      expect(result1.trackingNumber).toMatch(/^TN\d+$/);
      expect(result2.trackingNumber).toMatch(/^TN\d+$/);
    });

    it('should handle order with multiple items correctly', async () => {
      // Mock validator to pass
      getShippingLabelValidator.validateGetShippingLabelData.mockResolvedValue();

      // Create another product
      const anotherProduct = new Product({
        name: 'Another Product',
        description: 'Another product description',
        price: 15.99,
        weight: 0.5,
        dimensions: '5x10x3cm',
        category: 'Electronics',
        stock: 5,
        seller: testSeller._id
      });
      await anotherProduct.save();

      // Add another item to the order
      testOrder.items.push({
        product: anotherProduct._id,
        seller: testSeller._id,
        quantity: 1,
        price: 15.99
      });
      await testOrder.save();

      // Test with the second item
      const dataWithSecondItem = {
        ...validShippingLabelData,
        itemId: testOrder.items[1]._id.toString()
      };

      // Call the service
      const result = await getShippingLabelService.getShippingLabel(dataWithSecondItem);

      // Verify the result is for the correct order
      expect(result.orderId).toBe(testOrder._id.toString());
    });
  });
});
