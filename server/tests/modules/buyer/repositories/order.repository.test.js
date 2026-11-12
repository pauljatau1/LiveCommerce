const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const orderRepository = require('@modules/buyer/repositories/order.repository');
const Order = require('@models/Order');
const Product = require('@models/Product');
const Seller = require('@models/Seller');
const Buyer = require('@models/Buyer');

describe('Order Repository', () => {
  let mongoServer;

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
    await Seller.deleteMany({});
    await Buyer.deleteMany({});
  });

  describe('countOrders', () => {
    it('should return 0 when no orders exist', async () => {
      const count = await orderRepository.countOrders({});
      expect(count).toBe(0);
    });

    it('should return correct count for query', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      
      await Order.create([
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 1000,
          status: 'pending_payment',
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 1000 }]
        },
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 2000,
          status: 'delivered',
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 2000 }]
        },
        { 
          buyer: new mongoose.Types.ObjectId(), 
          seller: sellerId,
          buyerDetails: { _id: new mongoose.Types.ObjectId() },
          totalAmount: 1500,
          status: 'pending_payment',
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 1500 }]
        }
      ]);

      const count = await orderRepository.countOrders({ buyer: buyerId });
      expect(count).toBe(2);
    });
  });

  describe('findOrders', () => {
    it('should return orders with pagination and sorting', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      
      await Order.create([
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 1000,
          status: 'pending_payment', 
          createdAt: new Date('2023-01-01'),
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 1000 }]
        },
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 2000,
          status: 'delivered', 
          createdAt: new Date('2023-01-02'),
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 2000 }]
        },
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 1500,
          status: 'pending_payment', 
          createdAt: new Date('2023-01-03'),
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 1500 }]
        }
      ]);

      const orders = await orderRepository.findOrders(
        { buyer: buyerId },
        { sort: '-createdAt', skip: 0, limit: 2 }
      );

      expect(orders).toHaveLength(2);
      expect(orders[0].createdAt.getTime()).toBeGreaterThan(orders[1].createdAt.getTime());
    });
  });

  describe('findByIdAndBuyer', () => {
    it('should return order with populated data', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      
      // Create seller and product first
      await Seller.create({ 
        _id: sellerId, 
        storeName: 'Test Store',
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '08031234567'
      });
      await Product.create({ 
        _id: productId, 
        name: 'Test Product',
        description: 'Test product description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: sellerId
      });
      
      const order = await Order.create({
        _id: new mongoose.Types.ObjectId(),
        buyer: buyerId,
        seller: sellerId,
        buyerDetails: { _id: buyerId },
        totalAmount: 1000,
        status: 'pending_payment',
        items: [{ product: productId, seller: sellerId, quantity: 1, price: 1000 }]
      });

      const result = await orderRepository.findByIdAndBuyer(order._id.toString(), buyerId.toString());
      
      expect(result).toBeTruthy();
      expect(result._id.toString()).toBe(order._id.toString());
    });

    it('should return null for non-existent order', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();
      
      const result = await orderRepository.findByIdAndBuyer(orderId.toString(), buyerId.toString());
      expect(result).toBeNull();
    });
  });

  describe('findBuyerOrders', () => {
    it('should return all orders for buyer', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      
      await Order.create([
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 1000,
          status: 'pending_payment',
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 1000 }]
        },
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 2000,
          status: 'delivered',
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 2000 }]
        },
        { 
          buyer: new mongoose.Types.ObjectId(), 
          seller: sellerId,
          buyerDetails: { _id: new mongoose.Types.ObjectId() },
          totalAmount: 1500,
          status: 'pending_payment',
          items: [{ product: new mongoose.Types.ObjectId(), seller: sellerId, quantity: 1, price: 1500 }]
        }
      ]);

      const orders = await orderRepository.findBuyerOrders(buyerId.toString());
      expect(orders).toHaveLength(2);
      expect(orders.every(order => order.buyer.toString() === buyerId.toString())).toBe(true);
    });
  });

  describe('findRecentOrders', () => {
    it('should return recent orders with populated data', async () => {
      const buyerId = new mongoose.Types.ObjectId();
      const sellerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      
      await Product.create({ 
        _id: productId, 
        name: 'Test Product',
        description: 'Test product description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: sellerId
      });
      
      await Order.create([
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 1000,
          status: 'pending_payment',
          items: [{ product: productId, seller: sellerId, quantity: 1, price: 1000 }],
          createdAt: new Date('2023-01-01')
        },
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 2000,
          status: 'delivered',
          items: [{ product: productId, seller: sellerId, quantity: 1, price: 2000 }],
          createdAt: new Date('2023-01-02')
        },
        { 
          buyer: buyerId, 
          seller: sellerId,
          buyerDetails: { _id: buyerId },
          totalAmount: 1500,
          status: 'processing',
          items: [{ product: productId, seller: sellerId, quantity: 1, price: 1500 }],
          createdAt: new Date('2023-01-03')
        }
      ]);

      const orders = await orderRepository.findRecentOrders(buyerId.toString(), 2);
      
      expect(orders).toHaveLength(2);
      expect(orders[0].createdAt.getTime()).toBeGreaterThan(orders[1].createdAt.getTime());
    });
  });

  describe('hasVerifiedPurchase', () => {
    let testBuyer;
    let testSeller;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await testBuyer.save();

      testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await testSeller.save();
    });

    it('should return true for verified purchase with completed payment and delivered shipping', async () => {
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        paymentInfo: {
          status: 'completed'
        },
        shipping: {
          tracking: {
            status: 'delivered'
          }
        },
        items: [{ 
          seller: testSeller._id, 
          product: new mongoose.Types.ObjectId(), 
          quantity: 1, 
          price: 1000 
        }]
      });
      
      await order.save();

      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id, testSeller._id);
      expect(result).toBe(true);
    });

    it('should return false for order with completed payment but pending shipping', async () => {
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        paymentInfo: {
          status: 'completed'
        },
        shipping: {
          status: 'pending'
        },
        items: [{ 
          seller: testSeller._id, 
          product: new mongoose.Types.ObjectId(), 
          quantity: 1, 
          price: 1000 
        }]
      });
      await order.save();

      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id.toString(), testSeller._id.toString());
      expect(result).toBe(false);
    });

    it('should return false for order with pending payment but delivered shipping', async () => {
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        paymentInfo: {
          status: 'pending'
        },
        shipping: {
          tracking: {
            status: 'delivered'
          }
        },
        items: [{ 
          seller: testSeller._id, 
          product: new mongoose.Types.ObjectId(), 
          quantity: 1, 
          price: 1000 
        }]
      });
      await order.save();

      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id.toString(), testSeller._id.toString());
      expect(result).toBe(false);
    });

    it('should return false for order with pending payment and pending shipping', async () => {
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        paymentInfo: {
          status: 'pending'
        },
        shipping: {
          status: 'pending'
        },
        items: [{ 
          seller: testSeller._id, 
          product: new mongoose.Types.ObjectId(), 
          quantity: 1, 
          price: 1000 
        }]
      });
      await order.save();

      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id.toString(), testSeller._id.toString());
      expect(result).toBe(false);
    });

    it('should return false when buyer has no orders from seller', async () => {
      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id.toString(), testSeller._id.toString());
      expect(result).toBe(false);
    });

    it('should return false for non-existent buyer', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();
      const result = await orderRepository.hasVerifiedPurchase(nonExistentBuyerId, testSeller._id.toString());
      expect(result).toBe(false);
    });

    it('should return false for non-existent seller', async () => {
      const nonExistentSellerId = new mongoose.Types.ObjectId().toString();
      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id.toString(), nonExistentSellerId);
      expect(result).toBe(false);
    });

    it('should return true when multiple orders exist from same seller', async () => {
      // Create an order with completed payment but pending shipping
      const oldOrder = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        paymentInfo: {
          status: 'completed'
        },
        shipping: {
          status: 'delivered'
        },
        items: [{ 
          seller: testSeller._id, 
          product: new mongoose.Types.ObjectId(), 
          quantity: 1, 
          price: 1000 
        }]
      });
      await oldOrder.save();

      // Create an order with completed payment and delivered shipping
      const recentOrder = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 2000,
        status: 'delivered',
        paymentInfo: {
          status: 'completed'
        },
        shipping: {
          tracking: {
            status: 'delivered'
          }
        },
        items: [{ 
          seller: testSeller._id, 
          product: new mongoose.Types.ObjectId(), 
          quantity: 1, 
          price: 2000 
        }]
      });
      await recentOrder.save();

      const result = await orderRepository.hasVerifiedPurchase(testBuyer._id, testSeller._id);
      expect(result).toBe(true);
    });
  });

  describe('findOrdersBySeller', () => {
    let testSeller;
    let testBuyer;

    beforeEach(async () => {
      testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await testSeller.save();

      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await testBuyer.save();
    });

    it('should return all orders for a specific seller', async () => {
      const orders = [
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: { _id: testBuyer._id },
          totalAmount: 1000,
          status: 'delivered',
          items: [{ seller: testSeller._id, product: new mongoose.Types.ObjectId(), quantity: 1, price: 1000 }]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: { _id: testBuyer._id },
          totalAmount: 2000,
          status: 'pending_payment',
          items: [{ seller: testSeller._id, product: new mongoose.Types.ObjectId(), quantity: 2, price: 1000 }]
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      const result = await orderRepository.findOrdersBySeller(testSeller._id.toString());
      expect(result).toHaveLength(2);
      expect(result.every(order => order.seller.toString() === testSeller._id.toString())).toBe(true);
    });

    it('should return empty array when seller has no orders', async () => {
      const result = await orderRepository.findOrdersBySeller(testSeller._id.toString());
      expect(result).toHaveLength(0);
    });

    it('should not return orders from other sellers', async () => {
      const otherSeller = new Seller({
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@test.com',
        password: 'password123',
        phoneNumber: '08031234569',
        storeName: 'Other Store'
      });
      await otherSeller.save();

      const order = new Order({
        buyer: testBuyer._id,
        seller: otherSeller._id,
        buyerDetails: { _id: testBuyer._id },
        totalAmount: 1000,
        status: 'delivered',
        items: [{ seller: otherSeller._id, product: new mongoose.Types.ObjectId(), quantity: 1, price: 1000 }]
      });
      await order.save();

      const result = await orderRepository.findOrdersBySeller(testSeller._id.toString());
      expect(result).toHaveLength(0);
    });

    it('should handle non-existent seller ID', async () => {
      const nonExistentSellerId = new mongoose.Types.ObjectId().toString();
      const result = await orderRepository.findOrdersBySeller(nonExistentSellerId);
      expect(result).toHaveLength(0);
    });
  });

  describe('getReviewStats', () => {
    let testSeller;
    let testProduct;

    beforeEach(async () => {
      testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await testSeller.save();

      testProduct = new Product({
        name: 'Test Product',
        description: 'A test product',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: testSeller._id,
        reviews: [
          { rating: 5, comment: 'Excellent product', buyer: new mongoose.Types.ObjectId() },
          { rating: 4, comment: 'Good product', buyer: new mongoose.Types.ObjectId() },
          { rating: 3, comment: 'Average product', buyer: new mongoose.Types.ObjectId() }
        ]
      });
      await testProduct.save();
    });

    it('should return review statistics for seller with reviews', async () => {
      const order = new Order({
        buyer: new mongoose.Types.ObjectId(),
        seller: testSeller._id,
        buyerDetails: { _id: new mongoose.Types.ObjectId() },
        totalAmount: 1000,
        status: 'delivered',
        items: [{ 
          product: testProduct._id, 
          seller: testSeller._id, 
          quantity: 1, 
          price: 1000 
        }]
      });
      await order.save();

      const stats = await orderRepository.getReviewStats(testSeller._id.toString());
      
      expect(stats).toHaveLength(1);
      expect(stats[0].totalReviews).toBe(3);
      expect(stats[0].averageRating).toBe(4);
    });

    it('should return empty array when seller has no orders', async () => {
      const stats = await orderRepository.getReviewStats(testSeller._id.toString());
      expect(stats).toHaveLength(0);
    });

    it('should handle products with no reviews', async () => {
      const productWithoutReviews = new Product({
        name: 'Product Without Reviews',
        description: 'A product without reviews',
        price: 500,
        category: 'Electronics',
        stock: 5,
        seller: testSeller._id,
        reviews: []
      });
      await productWithoutReviews.save();

      const order = new Order({
        buyer: new mongoose.Types.ObjectId(),
        seller: testSeller._id,
        buyerDetails: { _id: new mongoose.Types.ObjectId() },
        totalAmount: 500,
        status: 'delivered',
        items: [{ 
          product: productWithoutReviews._id, 
          seller: testSeller._id, 
          quantity: 1, 
          price: 500 
        }]
      });
      await order.save();

      const stats = await orderRepository.getReviewStats(testSeller._id.toString());
      expect(stats).toHaveLength(0);
    });

    it('should handle multiple products with different review counts', async () => {
      const product2 = new Product({
        name: 'Product 2',
        description: 'Another test product',
        price: 800,
        category: 'Electronics',
        stock: 8,
        seller: testSeller._id,
        reviews: [
          { rating: 5, comment: 'Great product', buyer: new mongoose.Types.ObjectId() },
          { rating: 2, comment: 'Poor product', buyer: new mongoose.Types.ObjectId() }
        ]
      });
      await product2.save();

      const orders = [
        {
          buyer: new mongoose.Types.ObjectId(),
          seller: testSeller._id,
          buyerDetails: { _id: new mongoose.Types.ObjectId() },
          totalAmount: 1000,
          status: 'delivered',
          items: [{ 
            product: testProduct._id, 
            seller: testSeller._id, 
            quantity: 1, 
            price: 1000 
          }]
        },
        {
          buyer: new mongoose.Types.ObjectId(),
          seller: testSeller._id,
          buyerDetails: { _id: new mongoose.Types.ObjectId() },
          totalAmount: 800,
          status: 'delivered',
          items: [{ 
            product: product2._id, 
            seller: testSeller._id, 
            quantity: 1, 
            price: 800 
          }]
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      const stats = await orderRepository.getReviewStats(testSeller._id.toString());
      
      expect(stats).toHaveLength(1);
      expect(stats[0].totalReviews).toBe(5); // 3 + 2
      expect(stats[0].averageRating).toBe(3.8); // (5+4+3+5+2)/5
    });

    it('should handle non-existent seller ID', async () => {
      const nonExistentSellerId = new mongoose.Types.ObjectId().toString();
      const stats = await orderRepository.getReviewStats(nonExistentSellerId);
      expect(stats).toHaveLength(0);
    });

    it('should handle orders with multiple items from same product', async () => {
      const order = new Order({
        buyer: new mongoose.Types.ObjectId(),
        seller: testSeller._id,
        buyerDetails: { _id: new mongoose.Types.ObjectId() },
        totalAmount: 2000,
        status: 'delivered',
        items: [
          { 
            product: testProduct._id, 
            seller: testSeller._id, 
            quantity: 1, 
            price: 1000 
          },
          { 
            product: testProduct._id, 
            seller: testSeller._id, 
            quantity: 1, 
            price: 1000 
          }
        ]
      });
      await order.save();

      const stats = await orderRepository.getReviewStats(testSeller._id.toString());
      
      expect(stats).toHaveLength(1);
      expect(stats[0].totalReviews).toBe(6); // 3 reviews * 2 items
      expect(stats[0].averageRating).toBe(4);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let testBuyer;
    let testSeller;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await testBuyer.save();

      testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        phoneNumber: '08031234567',
        storeName: 'Test Store'
      });
      await testSeller.save();
    });

    it('should handle null query in countOrders', async () => {
      const result = await orderRepository.countOrders(null);
      expect(result).toBe(0);
    });

    it('should handle undefined query in countOrders', async () => {
      const result = await orderRepository.countOrders(undefined);
      expect(result).toBe(0);
    });

    it('should handle empty query object in countOrders', async () => {
      const result = await orderRepository.countOrders({});
      expect(result).toBe(0);
    });

    it('should handle null query in findOrders', async () => {
      const options = { sort: '-createdAt', skip: 0, limit: 10 };
      const result = await orderRepository.findOrders(null, options);
      expect(result).toHaveLength(0);
    });

    it('should handle undefined options in findOrders', async () => {
      const query = { buyer: testBuyer._id };
      await expect(orderRepository.findOrders(query, undefined)).rejects.toThrow();
    });

    it('should handle invalid ObjectId in findByIdAndBuyer', async () => {
      await expect(orderRepository.findByIdAndBuyer('invalid-id', testBuyer._id.toString())).rejects.toThrow();
    });

    it('should handle invalid ObjectId in findBuyerOrders', async () => {
      await expect(orderRepository.findBuyerOrders('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid ObjectId in findRecentOrders', async () => {
      await expect(orderRepository.findRecentOrders('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid ObjectId in hasVerifiedPurchase', async () => {
      await expect(orderRepository.hasVerifiedPurchase('invalid-id', testSeller._id.toString())).rejects.toThrow();
    });

    it('should handle invalid ObjectId in findOrdersBySeller', async () => {
      await expect(orderRepository.findOrdersBySeller('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid ObjectId in getReviewStats', async () => {
      await expect(orderRepository.getReviewStats('invalid-id')).rejects.toThrow();
    });

    it('should handle negative limit in findRecentOrders', async () => {
      const result = await orderRepository.findRecentOrders(testBuyer._id.toString(), -5);
      expect(result).toHaveLength(0);
    });

    it('should handle zero limit in findRecentOrders', async () => {
      const result = await orderRepository.findRecentOrders(testBuyer._id.toString(), 0);
      expect(result).toHaveLength(0);
    });

    it('should handle very large limit in findRecentOrders', async () => {
      const result = await orderRepository.findRecentOrders(testBuyer._id.toString(), 10000);
      expect(result).toHaveLength(0);
    });

    it('should handle negative skip in findOrders', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: '-createdAt', skip: -5, limit: 10 };
      await expect(orderRepository.findOrders(query, options)).rejects.toThrow();
    });

    it('should handle negative limit in findOrders', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: '-createdAt', skip: 0, limit: -10 };
      const result = await orderRepository.findOrders(query, options);
      expect(result).toHaveLength(0);
    });

    it('should handle very large skip in findOrders', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: '-createdAt', skip: 10000, limit: 10 };
      const result = await orderRepository.findOrders(query, options);
      expect(result).toHaveLength(0);
    });

    it('should handle very large limit in findOrders', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: '-createdAt', skip: 0, limit: 10000 };
      const result = await orderRepository.findOrders(query, options);
      expect(result).toHaveLength(0);
    });
  });
});
