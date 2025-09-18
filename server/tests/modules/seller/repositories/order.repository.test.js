/**
 * Order Repository Tests
 *
 * This test suite covers all functionality of the order repository
 * for seller-specific operations.
 *
 * @module orderRepositoryTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const orderRepository = require('@modules/seller/repositories/order.repository');
const Order = require('@models/Order');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

let mongoServer;

describe('Order Repository', () => {
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
  });

  const mockOrderData = {
    order_id: 'ORD123456',
    buyer: '507f1f77bcf86cd799439011',
    buyerDetails: {
      _id: '507f1f77bcf86cd799439011'
    },
    seller: '507f1f77bcf86cd799439012',
    items: [
      {
        product: '507f1f77bcf86cd799439013',
        quantity: 2,
        price: 1000,
        seller: '507f1f77bcf86cd799439012'
      }
    ],
    totalAmount: 2000,
    status: 'draft'
  };

  describe('countOrdersBySeller', () => {
    it('should return correct count of orders for a seller', async () => {
      const order = new Order(mockOrderData);
      await order.save();

      const result = await orderRepository.countOrdersBySeller(mockOrderData.seller);
      expect(result).toBe(1);
    });

    it('should return 0 when seller has no orders', async () => {
      const sellerWithNoOrders = '507f1f77bcf86cd799439014';
      const result = await orderRepository.countOrdersBySeller(sellerWithNoOrders);
      expect(result).toBe(0);
    });

    it('should count multiple orders for the same seller', async () => {
      const order1 = new Order(mockOrderData);
      const order2 = new Order({
        ...mockOrderData,
        order_id: 'ORD123457',
        items: [
          {
            product: '507f1f77bcf86cd799439015',
            quantity: 1,
            price: 500,
            seller: mockOrderData.seller
          }
        ],
        totalAmount: 500,
        status: 'confirmed'
      });
      
      await order1.save();
      await order2.save();

      const result = await orderRepository.countOrdersBySeller(mockOrderData.seller);
      expect(result).toBe(2);
    });

    it('should not count orders from other sellers', async () => {
      const order1 = new Order(mockOrderData);
      const otherSellerOrder = new Order({
        ...mockOrderData,
        order_id: 'ORD123458',
        seller: '507f1f77bcf86cd799439016',
        items: [
          {
            product: '507f1f77bcf86cd799439017',
            quantity: 1,
            price: 300,
            seller: '507f1f77bcf86cd799439016'
          }
        ],
        totalAmount: 300
      });
      
      await order1.save();
      await otherSellerOrder.save();

      const result = await orderRepository.countOrdersBySeller(mockOrderData.seller);
      expect(result).toBe(1); // Should still be 1 for the original seller
    });
  });

  describe('getTopProductsBySeller', () => {
    it('should return top products for a seller with orders', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId1 = new mongoose.Types.ObjectId();
      const productId2 = new mongoose.Types.ObjectId();

      // Create test products
      const product1 = new Product({
        _id: productId1,
        name: 'Product 1',
        description: 'Test product 1',
        price: 50.00,
        seller: sellerId,
        stock: 100,
        images: [{ url: 'https://example.com/product1.jpg' }],
        category: 'Electronics',
        brand: 'Brand1'
      });

      const product2 = new Product({
        _id: productId2,
        name: 'Product 2',
        description: 'Test product 2',
        price: 25.00,
        seller: sellerId,
        stock: 50,
        images: [{ url: 'https://example.com/product2.jpg' }],
        category: 'Electronics',
        brand: 'Brand2'
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
      const result = await orderRepository.getTopProductsBySeller(sellerId.toString());

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      // Check first product (should be product1 with higher quantity)
      const topProduct = result[0];
      expect(topProduct._id.toString()).toBe(productId1.toString());
      expect(topProduct.totalQuantity).toBe(7); // 5 + 2
      expect(topProduct.totalRevenue).toBe(350.00); // (5 * 50) + (2 * 50)
      expect(topProduct.productDetails).toBeDefined();
      expect(topProduct.productDetails.name).toBe('Product 1');

      // Check second product
      const secondProduct = result[1];
      expect(secondProduct._id.toString()).toBe(productId2.toString());
      expect(secondProduct.totalQuantity).toBe(3);
      expect(secondProduct.totalRevenue).toBe(75.00); // 3 * 25
      expect(secondProduct.productDetails.name).toBe('Product 2');
    });

    it('should return empty array when seller has no orders', async () => {
      // Arrange
      const sellerId = new mongoose.Types.ObjectId();

      // Act
      const result = await orderRepository.getTopProductsBySeller(sellerId.toString());

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should respect the limit parameter', async () => {
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

      // Create orders with different quantities
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

      // Act with limit of 3
      const result = await orderRepository.getTopProductsBySeller(sellerId.toString(), 3);

      // Assert
      expect(result.length).toBe(3);
      
      // Check that they are sorted by quantity (descending)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].totalQuantity).toBeGreaterThanOrEqual(result[i + 1].totalQuantity);
      }
    });

    it('should use default limit of 4 when no limit specified', async () => {
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

      // Create orders
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
              quantity: 10 - i,
              price: 10.00,
              seller: sellerId
            }
          ],
          totalAmount: (10 - i) * 10.00,
          paid: true
        });
        await order.save();
      }

      // Act without specifying limit
      const result = await orderRepository.getTopProductsBySeller(sellerId.toString());

      // Assert
      expect(result.length).toBe(4); // Default limit
    });

    it('should only return products for the specified seller', async () => {
      // Arrange
      const sellerId1 = new mongoose.Types.ObjectId();
      const sellerId2 = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId1 = new mongoose.Types.ObjectId();
      const productId2 = new mongoose.Types.ObjectId();

      // Create products for different sellers
      const product1 = new Product({
        _id: productId1,
        name: 'Seller 1 Product',
        description: 'Test product for seller 1',
        price: 50.00,
        seller: sellerId1,
        stock: 100,
        images: [{ url: 'https://example.com/product1.jpg' }],
        category: 'Electronics',
        brand: 'Brand1'
      });

      const product2 = new Product({
        _id: productId2,
        name: 'Seller 2 Product',
        description: 'Test product for seller 2',
        price: 25.00,
        seller: sellerId2,
        stock: 50,
        images: [{ url: 'https://example.com/product2.jpg' }],
        category: 'Electronics',
        brand: 'Brand2'
      });

      await product1.save();
      await product2.save();

      // Create orders for both sellers
      const order1 = new Order({
        order_id: 'ORD001',
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'John',
          lastName: 'Doe'
        },
        seller: sellerId1,
        items: [{ product: productId1, quantity: 5, price: 50.00, seller: sellerId1 }],
        totalAmount: 250.00,
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
        seller: sellerId2,
        items: [{ product: productId2, quantity: 3, price: 25.00, seller: sellerId2 }],
        totalAmount: 75.00,
        paid: true
      });

      await order1.save();
      await order2.save();

      // Act - get products for seller1 only
      const result = await orderRepository.getTopProductsBySeller(sellerId1.toString());

      // Assert
      expect(result.length).toBe(1);
      expect(result[0]._id.toString()).toBe(productId1.toString());
      expect(result[0].productDetails.name).toBe('Seller 1 Product');
    });

    it('should handle products that no longer exist in products collection', async () => {
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
      const result = await orderRepository.getTopProductsBySeller(sellerId.toString());

      // Assert
      expect(result.length).toBe(0); // Should return empty since product doesn't exist
    });
  });

  describe('countOrdersBySellerWithDateRange', () => {
    it('should count orders for seller with date range filter', async () => {
      // Arrange: Create test data
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const order1 = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 2000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 2000,
          status: 'delivered'
        }],
        isStale: false,
        createdAt: new Date('2024-01-15')
      });

      const order2 = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: false,
        createdAt: new Date('2024-01-20')
      });

      const order3 = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 1000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 1000,
          status: 'delivered'
        }],
        isStale: false,
        createdAt: new Date('2024-01-25')
      });

      await Order.insertMany([order1, order2, order3]);

      // Act: Count orders within date range
      const result = await orderRepository.countOrdersBySellerWithDateRange(
        sellerId.toString(),
        {
          $gte: new Date('2024-01-16'),
          $lt: new Date('2024-01-24')
        }
      );

      // Assert: Should return 1 order (order2)
      expect(result).toBe(1);
    });

    it('should count all orders for seller without date range filter', async () => {
      // Arrange: Create test data
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const order1 = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 2000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 2000,
          status: 'delivered'
        }],
        isStale: false
      });

      const order2 = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: false
      });

      await Order.insertMany([order1, order2]);

      // Act: Count all orders without date filter
      const result = await orderRepository.countOrdersBySellerWithDateRange(sellerId.toString());

      // Assert: Should return 2 orders
      expect(result).toBe(2);
    });

    it('should exclude stale orders from count', async () => {
      // Arrange: Create test data with stale orders
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const regularOrder = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 2000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 2000,
          status: 'delivered'
        }],
        isStale: false
      });

      const staleOrder = new Order({
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: 'Test',
          lastName: 'Buyer',
          email: 'test@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: true
      });

      await Order.insertMany([regularOrder, staleOrder]);

      // Act: Count orders
      const result = await orderRepository.countOrdersBySellerWithDateRange(sellerId.toString());

      // Assert: Should return only 1 order (excluding stale)
      expect(result).toBe(1);
    });

    it('should return 0 for seller with no orders', async () => {
      // Arrange: Use non-existent seller ID
      const sellerId = new mongoose.Types.ObjectId();

      // Act: Count orders
      const result = await orderRepository.countOrdersBySellerWithDateRange(sellerId.toString());

      // Assert: Should return 0
      expect(result).toBe(0);
    });
  });

  describe('getDistinctBuyersBySeller', () => {
    it('should return distinct buyers for seller', async () => {
      // Arrange: Create test data with multiple orders from same buyers
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId1 = new mongoose.Types.ObjectId();
      const buyerId2 = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const order1 = new Order({
        buyer: buyerId1,
        buyerDetails: {
          _id: buyerId1,
          firstName: 'Buyer',
          lastName: 'One',
          email: 'buyer1@example.com'
        },
        seller: sellerId,
        totalAmount: 2000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 2000,
          status: 'delivered'
        }],
        isStale: false
      });

      const order2 = new Order({
        buyer: buyerId1, // Same buyer as order1
        buyerDetails: {
          _id: buyerId1,
          firstName: 'Buyer',
          lastName: 'One',
          email: 'buyer1@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: false
      });

      const order3 = new Order({
        buyer: buyerId2, // Different buyer
        buyerDetails: {
          _id: buyerId2,
          firstName: 'Buyer',
          lastName: 'Two',
          email: 'buyer2@example.com'
        },
        seller: sellerId,
        totalAmount: 1000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 1000,
          status: 'delivered'
        }],
        isStale: false
      });

      await Order.insertMany([order1, order2, order3]);

      // Act: Get distinct buyers
      const result = await orderRepository.getDistinctBuyersBySeller(sellerId.toString());

      // Assert: Should return 2 distinct buyers
      expect(result.length).toBe(2);
      expect(result).toContainEqual(buyerId1);
      expect(result).toContainEqual(buyerId2);
    });

    it('should exclude stale orders from distinct buyers', async () => {
      // Arrange: Create test data with stale orders
      const sellerId = new mongoose.Types.ObjectId();
      const buyerId1 = new mongoose.Types.ObjectId();
      const buyerId2 = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      const regularOrder = new Order({
        buyer: buyerId1,
        buyerDetails: {
          _id: buyerId1,
          firstName: 'Buyer',
          lastName: 'One',
          email: 'buyer1@example.com'
        },
        seller: sellerId,
        totalAmount: 2000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 2000,
          status: 'delivered'
        }],
        isStale: false
      });

      const staleOrder = new Order({
        buyer: buyerId2,
        buyerDetails: {
          _id: buyerId2,
          firstName: 'Buyer',
          lastName: 'Two',
          email: 'buyer2@example.com'
        },
        seller: sellerId,
        totalAmount: 3000,
        items: [{
          product: productId,
          seller: sellerId,
          quantity: 1,
          price: 3000,
          status: 'delivered'
        }],
        isStale: true
      });

      await Order.insertMany([regularOrder, staleOrder]);

      // Act: Get distinct buyers
      const result = await orderRepository.getDistinctBuyersBySeller(sellerId.toString());

      // Assert: Should return only 1 buyer (excluding stale order buyer)
      expect(result.length).toBe(1);
      expect(result).toContainEqual(buyerId1);
    });

    it('should return empty array for seller with no orders', async () => {
      // Arrange: Use non-existent seller ID
      const sellerId = new mongoose.Types.ObjectId();

      // Act: Get distinct buyers
      const result = await orderRepository.getDistinctBuyersBySeller(sellerId.toString());

      // Assert: Should return empty array
      expect(result).toEqual([]);
    });
  });
});
