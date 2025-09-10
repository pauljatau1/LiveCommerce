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
});
