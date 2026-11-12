const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const returnRepository = require('@modules/buyer/repositories/return.repository');
const Return = require('@models/Return');
const Order = require('@models/Order');
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');

describe('Return Repository', () => {
  let mongoServer;
  let testBuyer;
  let testSeller;
  let testOrder;

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
    await Return.deleteMany({});
    await Order.deleteMany({});
    await Buyer.deleteMany({});
    await Seller.deleteMany({});

    // Create test buyer
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      phoneNumber: '+2348012345678',
      password: 'password123'
    });
    await testBuyer.save();

    // Create test seller
    testSeller = new Seller({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phoneNumber: '08031234567',
      password: 'password123',
      storeName: 'Jane\'s Store'
    });
    await testSeller.save();

    // Create test order
    testOrder = new Order({
      buyer: testBuyer._id,
      seller: testSeller._id,
      buyerDetails: {
        _id: testBuyer._id
      },
      order_id: 'OR12345',
      totalAmount: 1000,
      status: 'delivered',
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          productName: 'Test Product',
          seller: testSeller._id,
          quantity: 1,
          price: 1000
        }
      ]
    });
    await testOrder.save();
  });

  describe('findReturnRequests', () => {
    it('should return empty array when no return requests exist for orders', async () => {
      const orderIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];
      
      const returns = await returnRepository.findReturnRequests(orderIds);
      expect(returns).toEqual([]);
    });

    it('should return return requests for specified order IDs', async () => {
      const orderId1 = new mongoose.Types.ObjectId();
      const orderId2 = new mongoose.Types.ObjectId();
      const orderId3 = new mongoose.Types.ObjectId();
      
      // Create return requests
      await Return.create([
        { 
          order: orderId1, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW', 
          description: 'Defective product',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Defective product'
          }]
        },
        { 
          order: orderId1, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'APPROVED', 
          description: 'Wrong size',
          preferredResolution: 'replacement',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Wrong size'
          }]
        },
        { 
          order: orderId2, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'REJECTED', 
          description: 'No longer needed',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'No longer needed'
          }]
        }
      ]);

      // Create return request for different order
      await Return.create([
        { 
          order: orderId3, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW', 
          description: 'Other reason',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Other reason'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([
        orderId1.toString(),
        orderId2.toString()
      ]);

      expect(returns).toHaveLength(3);
      expect(returns.map(r => r.order.toString())).toContain(orderId1.toString());
      expect(returns.map(r => r.order.toString())).toContain(orderId2.toString());
      expect(returns.map(r => r.order.toString())).not.toContain(orderId3.toString());
    });

    it('should return only specified fields (_id, order, status)', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        { 
          order: orderId, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW', 
          description: 'Defective product',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Defective product'
          }],
          evidence: [{
            type: 'image',
            url: 'https://example.com/image.jpg',
            public_id: 'test_public_id'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      
      expect(returns).toHaveLength(1);
      expect(returns[0]).toHaveProperty('_id');
      expect(returns[0]).toHaveProperty('order');
      expect(returns[0]).toHaveProperty('status');
      expect(returns[0].description).toBeUndefined();
      expect(returns[0].evidence).toBeUndefined();
      expect(returns[0].preferredResolution).toBeUndefined();
    });

    it('should handle empty order IDs array', async () => {
      const returns = await returnRepository.findReturnRequests([]);
      expect(returns).toEqual([]);
    });

    it('should handle single order ID', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        { 
          order: orderId, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW', 
          description: 'Test reason',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Test reason'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].order.toString()).toBe(orderId.toString());
    });

    // Edge cases and error handling
    it('should handle null order IDs array', async () => {
      const returns = await returnRepository.findReturnRequests(null);
      expect(returns).toEqual([]);
    });

    it('should handle undefined order IDs array', async () => {
      const returns = await returnRepository.findReturnRequests(undefined);
      expect(returns).toEqual([]);
    });

    it('should handle mixed valid and invalid order IDs', async () => {
      const validOrderId = new mongoose.Types.ObjectId();
      const invalidOrderId = 'invalid-id-format';
      
      await Return.create([
        { 
          order: validOrderId, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW', 
          description: 'Valid order return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Valid order return'
          }]
        }
      ]);

      await expect(returnRepository.findReturnRequests([
        validOrderId.toString(),
        invalidOrderId
      ])).rejects.toThrow();
    });

    it('should handle duplicate order IDs in array', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        { 
          order: orderId, 
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW', 
          description: 'Test return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Test return'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([
        orderId.toString(),
        orderId.toString()
      ]);

      expect(returns).toHaveLength(1);
      expect(returns[0].order.toString()).toBe(orderId.toString());
    });

    it('should handle large array of order IDs', async () => {
      const orderIds = Array.from({ length: 100 }, () => new mongoose.Types.ObjectId());
      
      // Create returns for first 5 orders
      const returnData = orderIds.slice(0, 5).map(orderId => ({
        order: orderId,
        buyer: testBuyer._id,
        seller: testSeller._id,
        status: 'PENDING_SELLER_REVIEW',
        description: 'Test return',
        preferredResolution: 'refund',
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 1,
          reason: 'Test return'
        }]
      }));

      await Return.create(returnData);

      const returns = await returnRepository.findReturnRequests(orderIds.map(id => id.toString()));
      expect(returns).toHaveLength(5);
    });

    it('should handle invalid ObjectId format', async () => {
      const invalidOrderId = 'invalid-id-format';
      
      await expect(returnRepository.findReturnRequests([invalidOrderId])).rejects.toThrow();
    });

    it('should handle non-existent order IDs', async () => {
      const nonExistentOrderId = new mongoose.Types.ObjectId();
      
      const returns = await returnRepository.findReturnRequests([nonExistentOrderId.toString()]);
      expect(returns).toEqual([]);
    });

    it('should handle returns with different statuses', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      const returnData = [
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Pending review',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Pending review'
          }]
        },
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'APPROVED',
          description: 'Approved return',
          preferredResolution: 'replacement',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Approved return'
          }]
        },
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'REJECTED',
          description: 'Rejected return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Rejected return'
          }]
        }
      ];

      await Return.create(returnData);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(3);
      expect(returns.map(r => r.status)).toContain('PENDING_SELLER_REVIEW');
      expect(returns.map(r => r.status)).toContain('APPROVED');
      expect(returns.map(r => r.status)).toContain('REJECTED');
    });

    it('should handle returns with complex data structures', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Complex return with evidence',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 2,
            reason: 'Defective product with multiple issues'
          }],
          evidence: [
            {
              type: 'image',
              url: 'https://example.com/image1.jpg',
              public_id: 'evidence_1',
              uploadedAt: new Date()
            },
            {
              type: 'video',
              url: 'https://example.com/video1.mp4',
              public_id: 'evidence_2',
              uploadedAt: new Date()
            }
          ],
          sellerResponse: {
            status: 'under_review',
            message: 'We are reviewing your return request',
            date: new Date(),
            partialRefundAmount: 500
          },
          adminNotes: [
            {
              note: 'Initial review completed',
              date: new Date(),
              adminId: new mongoose.Types.ObjectId()
            }
          ],
          timeline: [
            {
              status: 'PENDING_SELLER_REVIEW',
              date: new Date(),
              note: 'Return request submitted',
              updatedBy: 'buyer'
            }
          ]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should handle returns with refund details', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'REFUNDED',
          description: 'Refunded return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Refunded return'
          }],
          refundDetails: {
            amount: 1000,
            processedAt: new Date(),
            method: 'bank_transfer',
            transactionId: 'TXN123456',
            processedBy: new mongoose.Types.ObjectId(),
            notes: 'Refund processed successfully'
          }
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('REFUNDED');
    });

    it('should handle returns with dispute information', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'DISPUTED',
          description: 'Disputed return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Disputed return'
          }],
          dispute: {
            status: 'UNDER_REVIEW',
            resolution: 'BUYER_FAVORED',
            resolutionDetails: {
              decidedBy: new mongoose.Types.ObjectId(),
              decidedAt: new Date(),
              action: 'FULL_REFUND',
              refundAmount: 1000,
              note: 'Dispute resolved in buyer favor'
            }
          }
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('DISPUTED');
    });

    it('should handle returns with shipping information', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'IN_TRANSIT',
          description: 'Return in transit',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Return in transit'
          }],
          returnShippingLabel: {
            url: 'https://example.com/label.pdf',
            carrier: 'FedEx',
            trackingNumber: '123456789',
            generatedAt: new Date()
          },
          returnShipment: {
            shipment_id: 'SHIP123',
            status: 'IN_TRANSIT',
            tracking: {
              number: '123456789',
              url: 'https://fedex.com/track/123456789',
              status: 'In Transit',
              lastUpdate: new Date()
            }
          }
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('IN_TRANSIT');
    });

    it('should handle returns with replacement information', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'APPROVED',
          description: 'Replacement approved',
          preferredResolution: 'replacement',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Replacement approved'
          }],
          replacementProduct: {
            product: new mongoose.Types.ObjectId(),
            variant: { color: 'blue', size: 'M' },
            specifications: { material: 'cotton' }
          },
          replacementShipment: {
            shipment_id: 'REPLACE123',
            status: 'PENDING',
            tracking: {
              number: '987654321',
              url: 'https://ups.com/track/987654321'
            }
          }
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('APPROVED');
    });

    it('should handle returns with eligibility information', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Eligible return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Eligible return'
          }],
          isEligible: true,
          eligibilityCheckedAt: new Date()
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should handle returns with closure information', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'CLOSED',
          description: 'Closed return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Closed return'
          }],
          closedAt: new Date(),
          closedBy: 'buyer'
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('CLOSED');
    });

    it('should handle returns with rejection details', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'REJECTED',
          description: 'Rejected return',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Rejected return'
          }],
          rejectionDetails: {
            reason: 'Product used beyond return period',
            description: 'Return request rejected due to extended use',
            evidence: [{
              type: 'image',
              url: 'https://example.com/evidence.jpg',
              public_id: 'rejection_evidence'
            }],
            rejectedAt: new Date(),
            rejectedBy: testSeller._id
          }
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('REJECTED');
    });

    it('should handle returns with special characters in description', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should handle returns with very long description', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const longDescription = 'A'.repeat(1000);
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: longDescription,
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Very long description'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should handle returns with multiple items', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Multiple items return',
          preferredResolution: 'refund',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 2,
              reason: 'Defective product'
            },
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 1,
              reason: 'Wrong size'
            },
            {
              product: new mongoose.Types.ObjectId(),
              quantity: 3,
              reason: 'Not as described'
            }
          ]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should handle returns with all status enum values', async () => {
      const orderIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const statuses = [
        'PENDING_SELLER_REVIEW',
        'NEED_MORE_INFO',
        'PENDING_ADMIN_REVIEW',
        'APPROVED',
        'REJECTED',
        'IN_TRANSIT',
        'RECEIVED',
        'REFUNDED',
        'CLOSED',
        'DISPUTED',
        'RESOLVED'
      ];

      const returnData = orderIds.map((orderId, index) => ({
        order: orderId,
        buyer: testBuyer._id,
        seller: testSeller._id,
        status: statuses[index],
        description: `Return with status ${statuses[index]}`,
        preferredResolution: 'refund',
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 1,
          reason: `Return with status ${statuses[index]}`
        }]
      }));

      await Return.create(returnData);

      const returns = await returnRepository.findReturnRequests(orderIds.map(id => id.toString()));
      expect(returns).toHaveLength(11);
      expect(returns.map(r => r.status)).toEqual(expect.arrayContaining(statuses));
    });

    it('should handle returns with all preferred resolution enum values', async () => {
      const orderId1 = new mongoose.Types.ObjectId();
      const orderId2 = new mongoose.Types.ObjectId();
      
      await Return.create([
        {
          order: orderId1,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Refund preferred',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Refund preferred'
          }]
        },
        {
          order: orderId2,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Replacement preferred',
          preferredResolution: 'replacement',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Replacement preferred'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([
        orderId1.toString(),
        orderId2.toString()
      ]);
      expect(returns).toHaveLength(2);
    });

    it('should handle returns with different buyers and sellers', async () => {
      const orderId1 = new mongoose.Types.ObjectId();
      const orderId2 = new mongoose.Types.ObjectId();
      
      const otherBuyer = new Buyer({
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        username: 'alicej',
      phoneNumber: '+2348012345678',
        password: 'password123'
      });
      await otherBuyer.save();

      const otherSeller = new Seller({
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        phoneNumber: '08031234568',
        password: 'password123',
        storeName: 'Bob\'s Store'
      });
      await otherSeller.save();

      await Return.create([
        {
          order: orderId1,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'First buyer and seller',
          preferredResolution: 'refund',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'First buyer and seller'
          }]
        },
        {
          order: orderId2,
          buyer: otherBuyer._id,
          seller: otherSeller._id,
          status: 'APPROVED',
          description: 'Second buyer and seller',
          preferredResolution: 'replacement',
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Second buyer and seller'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([
        orderId1.toString(),
        orderId2.toString()
      ]);
      expect(returns).toHaveLength(2);
    });

    it('should handle returns with different request dates', async () => {
      const orderId = new mongoose.Types.ObjectId();
      
      const pastDate = new Date('2023-01-01');
      const futureDate = new Date('2025-01-01');
      
      await Return.create([
        {
          order: orderId,
          buyer: testBuyer._id,
          seller: testSeller._id,
          status: 'PENDING_SELLER_REVIEW',
          description: 'Past date return',
          preferredResolution: 'refund',
          requestDate: pastDate,
          items: [{
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Past date return'
          }]
        }
      ]);

      const returns = await returnRepository.findReturnRequests([orderId.toString()]);
      expect(returns).toHaveLength(1);
      expect(returns[0].status).toBe('PENDING_SELLER_REVIEW');
    });
  });

  // Additional comprehensive return tests moved from buyer.repository.test.js
  describe('findReturnRequestsComprehensive', () => {
    let testReturn;

    beforeEach(async () => {
      // Create a test return request
      testReturn = new Return({
        order: testOrder._id,
        buyer: testBuyer._id,
        seller: testSeller._id,
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Defective product'
          }
        ],
        status: 'PENDING_SELLER_REVIEW',
        description: 'Product is defective',
        preferredResolution: 'refund'
      });

      await testReturn.save();
    });

    it('should find return requests for orders', async () => {
      const orderIds = [testOrder._id];
      const result = await returnRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(1);
      expect(result[0].order.toString()).toBe(testOrder._id.toString());
      expect(result[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should return empty array for orders without returns', async () => {
      const orderIds = [new mongoose.Types.ObjectId()];
      const result = await returnRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(0);
    });

    it('should handle multiple order IDs', async () => {
      // Create another order and return
      const order2 = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: testBuyer._id
        },
        order_id: 'OR67890',
        totalAmount: 500,
        status: 'draft',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            productName: 'Test Product 2',
            seller: testSeller._id,
            quantity: 1,
            price: 500
          }
        ]
      });

      await order2.save();

      const return2 = new Return({
        order: order2._id,
        buyer: testBuyer._id,
        seller: testSeller._id,
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 1,
            reason: 'Wrong size'
          }
        ],
        status: 'APPROVED',
        description: 'Wrong size received',
        preferredResolution: 'replacement'
      });

      await return2.save();

      const orderIds = [testOrder._id, order2._id];
      const result = await returnRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(2);
    });

    it('should handle empty order IDs array', async () => {
      const orderIds = [];
      const result = await returnRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(0);
    });
  });
});
