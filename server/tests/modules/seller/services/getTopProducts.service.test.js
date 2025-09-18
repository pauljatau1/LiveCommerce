/**
 * Get Top Products Service Tests
 *
 * This test suite covers all functionality of the getTopProducts service.
 *
 * @module getTopProductsServiceTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getTopProductsService = require('@modules/seller/services/getTopProducts.service');
const Order = require('@models/Order');
const Product = require('@models/Product');
const Seller = require('@models/Seller');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('Get Top Products Service', () => {
  beforeAll(async () => {
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
    await Order.deleteMany({});
    await Product.deleteMany({});
  });

  describe('getTopProducts', () => {
    it('should successfully retrieve top products for a valid seller', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();
      const productId1 = new mongoose.Types.ObjectId();
      const productId2 = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();

      // Create test products
      const product1 = new Product({
        _id: productId1,
        name: 'Premium Headphones',
        description: 'High-quality wireless headphones',
        price: 50.00,
        seller: sellerId,
        stock: 100,
        images: [{ url: 'https://example.com/headphones.jpg' }],
        category: 'Electronics',
        brand: 'TechBrand'
      });

      const product2 = new Product({
        _id: productId2,
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 25.00,
        seller: sellerId,
        stock: 50,
        images: [{ url: 'https://example.com/mouse.jpg' }],
        category: 'Electronics',
        brand: 'TechBrand'
      });

      await product1.save();
      await product2.save();

      // Create test orders
      const order1 = new Order({
        order_id: 'ORD001',
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'John',
          lastName: 'Doe'
        },
        seller: sellerId,
        items: [
          {
            product: productId1,
            quantity: 5,
            price: 50.00,
            seller: sellerId
          },
          {
            product: productId2,
            quantity: 3,
            price: 25.00,
            seller: sellerId
          }
        ],
        totalAmount: 325.00,
        paid: true
      });

      const order2 = new Order({
        order_id: 'ORD002',
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'John',
          lastName: 'Doe'
        },
        seller: sellerId,
        items: [
          {
            product: productId1,
            quantity: 2,
            price: 50.00,
            seller: sellerId
          }
        ],
        totalAmount: 100.00,
        paid: true
      });

      await order1.save();
      await order2.save();

      // Act
      const result = await getTopProductsService.getTopProducts(sellerId.toString());

      // Assert
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Check that products are sorted by quantity (headphones should be first with 7 total)
      const topProduct = result.data[0];
      expect(topProduct._id.toString()).toBe(productId1.toString());
      expect(topProduct.totalQuantity).toBe(7); // 5 + 2
      expect(topProduct.totalRevenue).toBe(350.00); // (5 * 50) + (2 * 50)
      expect(topProduct.productDetails).toBeDefined();
      expect(topProduct.productDetails.name).toBe('Premium Headphones');
    });

    it('should return empty array when seller has no orders', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();

      // Act
      const result = await getTopProductsService.getTopProducts(sellerId.toString());

      // Assert
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(0);
    });

    it('should throw ValidationError for invalid seller ID', async () => {
      // Arrange
      const invalidSellerId = 'invalid-id';

      // Act & Assert
      await expect(getTopProductsService.getTopProducts(invalidSellerId))
        .rejects
        .toThrow(ValidationError);
      
      // Check the specific error message in the errors array
      await expect(getTopProductsService.getTopProducts(invalidSellerId))
        .rejects
        .toMatchObject({
          name: 'ValidationError',
          errors: [{ field: 'sellerId', message: 'Seller ID must be a valid ObjectId format' }]
        });
    });

    it('should throw ValidationError for null seller ID', async () => {
      // Act & Assert
      await expect(getTopProductsService.getTopProducts(null))
        .rejects
        .toThrow(ValidationError);
      
      // Check the specific error message in the errors array
      await expect(getTopProductsService.getTopProducts(null))
        .rejects
        .toMatchObject({
          name: 'ValidationError',
          errors: [{ field: 'sellerId', message: 'Valid seller ID is required' }]
        });
    });

    it('should throw ValidationError for undefined seller ID', async () => {
      // Act & Assert
      await expect(getTopProductsService.getTopProducts(undefined))
        .rejects
        .toThrow(ValidationError);
      
      // Check the specific error message in the errors array
      await expect(getTopProductsService.getTopProducts(undefined))
        .rejects
        .toMatchObject({
          name: 'ValidationError',
          errors: [{ field: 'sellerId', message: 'Valid seller ID is required' }]
        });
    });

    it('should throw ValidationError for empty string seller ID', async () => {
      // Act & Assert
      await expect(getTopProductsService.getTopProducts(''))
        .rejects
        .toThrow(ValidationError);
      
      // Check the specific error message in the errors array
      await expect(getTopProductsService.getTopProducts(''))
        .rejects
        .toMatchObject({
          name: 'ValidationError',
          errors: [{ field: 'sellerId', message: 'Valid seller ID is required' }]
        });
    });

    it('should limit results to top 4 products', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productIds = Array.from({ length: 6 }, () => new mongoose.Types.ObjectId());

      // Create 6 products
      for (let i = 0; i < 6; i++) {
        const product = new Product({
          _id: productIds[i],
          name: `Product ${i + 1}`,
          description: `Test product ${i + 1}`,
          price: 10.00,
          seller: sellerId,
          stock: 100,
          images: [{ url: `https://example.com/product${i + 1}.jpg` }],
          category: 'Test',
          brand: 'TestBrand'
        });
        await product.save();
      }

      // Create orders with different quantities to ensure proper sorting
      for (let i = 0; i < 6; i++) {
        const order = new Order({
          order_id: `ORD${i + 1}`,
          buyer: buyerId,
          buyerDetails: {
            _id: buyerId,
            firstName: 'John',
            lastName: 'Doe'
          },
          seller: sellerId,
          items: [
            {
              product: productIds[i],
              quantity: 10 - i, // Decreasing quantities: 10, 9, 8, 7, 6, 5
              price: 10.00,
              seller: sellerId
            }
          ],
          totalAmount: (10 - i) * 10.00,
          paid: true
        });
        await order.save();
      }

      // Act
      const result = await getTopProductsService.getTopProducts(sellerId.toString());

      // Assert
      expect(result.data.length).toBe(4); // Should be limited to 4
      
      // Check that they are sorted by quantity (descending)
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].totalQuantity).toBeGreaterThanOrEqual(result.data[i + 1].totalQuantity);
      }
    });

    it('should handle products with no details gracefully', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      // Create order with product that doesn't exist in products collection
      const order = new Order({
        order_id: 'ORD001',
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'John',
          lastName: 'Doe'
        },
        seller: sellerId,
        items: [
          {
            product: productId,
            quantity: 5,
            price: 50.00,
            seller: sellerId
          }
        ],
        totalAmount: 250.00,
        paid: true
      });

      await order.save();

      // Act
      const result = await getTopProductsService.getTopProducts(sellerId.toString());

      // Assert
      expect(result.data.length).toBe(0); // Should return empty since product doesn't exist
    });

    it('should calculate revenue correctly for multiple orders of same product', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      // Create product
      const product = new Product({
        _id: productId,
        name: 'Test Product',
        description: 'Test product description',
        price: 30.00,
        seller: sellerId,
        stock: 100,
        images: [{ url: 'https://example.com/test.jpg' }],
        category: 'Test',
        brand: 'TestBrand'
      });
      await product.save();

      // Create multiple orders for the same product
      const orders = [
        {
          order_id: 'ORD001',
          buyer: buyerId,
          buyerDetails: {
            _id: buyerId,
            firstName: 'John',
            lastName: 'Doe'
          },
          seller: sellerId,
          items: [{ product: productId, quantity: 2, price: 30.00, seller: sellerId }],
          totalAmount: 60.00,
          paid: true
        },
        {
          order_id: 'ORD002',
          buyer: buyerId,
          buyerDetails: {
            _id: buyerId,
            firstName: 'John',
            lastName: 'Doe'
          },
          seller: sellerId,
          items: [{ product: productId, quantity: 3, price: 30.00, seller: sellerId }],
          totalAmount: 90.00,
          paid: true
        },
        {
          order_id: 'ORD003',
          buyer: buyerId,
          buyerDetails: {
            _id: buyerId,
            firstName: 'John',
            lastName: 'Doe'
          },
          seller: sellerId,
          items: [{ product: productId, quantity: 1, price: 30.00, seller: sellerId }],
          totalAmount: 30.00,
          paid: true
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      // Act
      const result = await getTopProductsService.getTopProducts(sellerId.toString());

      // Assert
      expect(result.data.length).toBe(1);
      const topProduct = result.data[0];
      expect(topProduct.totalQuantity).toBe(6); // 2 + 3 + 1
      expect(topProduct.totalRevenue).toBe(180.00); // (2 * 30) + (3 * 30) + (1 * 30)
    });
  });
});
