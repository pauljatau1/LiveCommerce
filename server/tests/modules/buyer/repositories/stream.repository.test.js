/**
 * Tests for Stream Repository
 *
 * This test suite covers all the stream repository functions
 * to ensure they work correctly with the database.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const streamRepository = require('@modules/buyer/repositories/stream.repository');
const Stream = require('@models/Stream');
const Seller = require('@models/Seller');
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');

let mongoServer;

describe('Stream Repository', () => {
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
    // Clear all collections before each test
    await Stream.deleteMany({});
    await Seller.deleteMany({});
    await Buyer.deleteMany({});
    await Product.deleteMany({});
  });

  describe('countStreamsBySeller', () => {
    it('should count streams created by a seller', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams for the seller
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Stream 1',
          description: 'First stream',
          category: 'Electronics',
          status: 'live',
          type: 'auction'
        },
        {
          seller: testSeller._id,
          title: 'Stream 2',
          description: 'Second stream',
          category: 'Fashion',
          status: 'ended',
          type: 'open_show'
        },
        {
          seller: testSeller._id,
          title: 'Stream 3',
          description: 'Third stream',
          category: 'Home',
          status: 'scheduled',
          type: 'auction'
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(3);
    });

    it('should return 0 for seller with no streams', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'Jane\'s Store'
      });
      await testSeller.save();

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(0);
    });

    it('should handle invalid ObjectId format', async () => {
      const invalidId = 'invalid-id-format';
      await expect(streamRepository.countStreamsBySeller(invalidId)).rejects.toThrow();
    });

    it('should handle null seller ID', async () => {
      const result = await streamRepository.countStreamsBySeller(null);
      expect(result).toBe(0);
    });

    it('should handle undefined seller ID', async () => {
      const result = await streamRepository.countStreamsBySeller(undefined);
      expect(result).toBe(0);
    });

    it('should handle non-existent seller ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await streamRepository.countStreamsBySeller(nonExistentId);
      expect(result).toBe(0);
    });

    it('should handle string seller ID', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create a stream for the seller
      await Stream.create({
        seller: testSeller._id,
        title: 'Test Stream',
        description: 'Test description',
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      });

      // Test with string ID
      const result = await streamRepository.countStreamsBySeller(testSeller._id.toString());
      expect(result).toBe(1);
    });

    it('should handle ObjectId seller ID', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create a stream for the seller
      await Stream.create({
        seller: testSeller._id,
        title: 'Test Stream',
        description: 'Test description',
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      });

      // Test with ObjectId
      const result = await streamRepository.countStreamsBySeller(testSeller._id);
      expect(result).toBe(1);
    });

    it('should count streams with different statuses', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with different statuses
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Scheduled Stream',
          description: 'Scheduled stream',
          category: 'Electronics',
          status: 'scheduled',
          type: 'auction'
        },
        {
          seller: testSeller._id,
          title: 'Live Stream',
          description: 'Live stream',
          category: 'Fashion',
          status: 'live',
          type: 'open_show'
        },
        {
          seller: testSeller._id,
          title: 'Ended Stream',
          description: 'Ended stream',
          category: 'Home',
          status: 'ended',
          type: 'auction'
        },
        {
          seller: testSeller._id,
          title: 'Expired Stream',
          description: 'Expired stream',
          category: 'Sports',
          status: 'expired',
          type: 'open_show'
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(4);
    });

    it('should count streams with different types', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with different types
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Auction Stream',
          description: 'Auction stream',
          category: 'Electronics',
          status: 'live',
          type: 'auction'
        },
        {
          seller: testSeller._id,
          title: 'Open Show Stream',
          description: 'Open show stream',
          category: 'Fashion',
          status: 'live',
          type: 'open_show'
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle seller with many streams', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create many streams for the seller
      const streams = Array.from({ length: 100 }, (_, index) => ({
        seller: testSeller._id,
        title: `Stream ${index + 1}`,
        description: `Description for stream ${index + 1}`,
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      }));

      await Stream.create(streams);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(100);
    });

    it('should handle streams with complex data structures', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create test buyer
      const testBuyer = new Buyer({
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        password: 'password123',
        phoneNumber: '+1234567890'
      });
      await testBuyer.save();

      // Create test product
      const testProduct = new Product({
        name: 'Test Product',
        description: 'Test product description',
        price: 100,
        category: 'Electronics',
        stock: 50,
        seller: testSeller._id
      });
      await testProduct.save();

      // Create stream with complex data
      await Stream.create({
        seller: testSeller._id,
        title: 'Complex Stream',
        description: 'A stream with complex data structures',
        coverImage: {
          url: 'https://example.com/cover.jpg',
          public_id: 'cover_public_id'
        },
        video: {
          url: 'https://example.com/video.mp4',
          key: 'video_key'
        },
        category: 'Electronics',
        subCategory: 'Smartphones',
        tags: ['tech', 'mobile', 'electronics'],
        products: [
          {
            product: testProduct,
            minBid: 50,
            maxBid: 200,
            currentBid: 75,
            currentBidder: testBuyer._id,
            bidStatus: 'active',
            bidWinner: {
              buyer: testBuyer._id,
              bidAmount: 150,
              winningTime: new Date()
            },
            orderCreated: false
          }
        ],
        status: 'live',
        channelName: 'johns_channel',
        agoraToken: 'agora_token_123',
        scheduledStartTime: new Date('2023-01-01T10:00:00Z'),
        actualStartTime: new Date('2023-01-01T10:05:00Z'),
        endTime: new Date('2023-01-01T12:00:00Z'),
        viewers: [testBuyer._id],
        departedViewers: [
          {
            buyer: testBuyer._id,
            timestamp: new Date(),
            notificationData: { type: 'departure' }
          }
        ],
        bids: [
          {
            buyer: testBuyer._id,
            product: testProduct._id,
            amount: 75,
            timestamp: new Date()
          }
        ],
        type: 'auction',
        cancelledStream: false,
        agoraUid: 12345,
        subscribers: [
          {
            buyer: testBuyer._id,
            subscribedAt: new Date(),
            notified: true
          }
        ],
        chatInteractions: [
          {
            id: 'chat_1',
            type: 'message',
            user: 'alice',
            avatar: 'https://example.com/avatar.jpg',
            content: 'Hello everyone!',
            data: { messageType: 'text' },
            timestamp: new Date()
          }
        ],
        liveAnnouncements: [
          {
            id: 'announcement_1',
            content: 'Welcome to our stream!',
            current: true,
            sellerId: testSeller._id,
            sellerName: 'John Doe',
            timestamp: new Date()
          }
        ],
        orders: [
          {
            orderId: 'order_123',
            buyer: testBuyer._id,
            orderDetails: { items: ['product1'] },
            product: testProduct._id,
            amount: 150,
            createdAt: new Date()
          }
        ],
        streamLink: 'https://example.com/stream/123',
        processingEndJob: false
      });

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(1);
    });

    it('should handle streams with special characters in title', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with special characters
      await Stream.create({
        seller: testSeller._id,
        title: 'Stream with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Description with special chars: áéíóúñ',
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      });

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(1);
    });

    it('should handle streams with very long title', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with very long title
      const longTitle = 'A'.repeat(1000);
      await Stream.create({
        seller: testSeller._id,
        title: longTitle,
        description: 'Description',
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      });

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(1);
    });

    it('should handle streams with empty title', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with empty title (should fail validation)
      await expect(Stream.create({
        seller: testSeller._id,
        title: '',
        description: 'Description',
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      })).rejects.toThrow();
    });

    it('should handle streams with null title', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with null title (should fail validation)
      await expect(Stream.create({
        seller: testSeller._id,
        title: null,
        description: 'Description',
        category: 'Electronics',
        status: 'live',
        type: 'auction'
      })).rejects.toThrow();
    });

    it('should handle streams with missing required fields', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with missing required fields (should fail validation)
      await expect(Stream.create({
        seller: testSeller._id,
        // Missing title, category
        description: 'Description',
        status: 'live',
        type: 'auction'
      })).rejects.toThrow();
    });

    it('should handle streams with invalid status enum values', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with invalid status (should fail validation)
      await expect(Stream.create({
        seller: testSeller._id,
        title: 'Test Stream',
        description: 'Description',
        category: 'Electronics',
        status: 'invalid_status',
        type: 'auction'
      })).rejects.toThrow();
    });

    it('should handle streams with invalid type enum values', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create stream with invalid type (should fail validation)
      await expect(Stream.create({
        seller: testSeller._id,
        title: 'Test Stream',
        description: 'Description',
        category: 'Electronics',
        status: 'live',
        type: 'invalid_type'
      })).rejects.toThrow();
    });

    it('should handle streams with all valid status enum values', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with all valid status values
      const validStatuses = ['scheduled', 'live', 'ended', 'expired'];
      
      for (const status of validStatuses) {
        await Stream.create({
          seller: testSeller._id,
          title: `Stream with status: ${status}`,
          description: 'Description',
          category: 'Electronics',
          status: status,
          type: 'auction'
        });
      }

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(4);
    });

    it('should handle streams with all valid type enum values', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with all valid type values
      const validTypes = ['auction', 'open_show'];
      
      for (const type of validTypes) {
        await Stream.create({
          seller: testSeller._id,
          title: `Stream with type: ${type}`,
          description: 'Description',
          category: 'Electronics',
          status: 'live',
          type: type
        });
      }

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle streams with different categories', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with different categories
      const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Toys'];
      
      for (const category of categories) {
        await Stream.create({
          seller: testSeller._id,
          title: `Stream in ${category}`,
          description: 'Description',
          category: category,
          status: 'live',
          type: 'auction'
        });
      }

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(6);
    });

    it('should handle streams with subcategories', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with subcategories
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Electronics - Smartphones',
          description: 'Smartphone stream',
          category: 'Electronics',
          subCategory: 'Smartphones',
          status: 'live',
          type: 'auction'
        },
        {
          seller: testSeller._id,
          title: 'Electronics - Laptops',
          description: 'Laptop stream',
          category: 'Electronics',
          subCategory: 'Laptops',
          status: 'live',
          type: 'auction'
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle streams with tags', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with tags
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Stream with tags',
          description: 'Description',
          category: 'Electronics',
          tags: ['tech', 'mobile', 'electronics'],
          status: 'live',
          type: 'auction'
        },
        {
          seller: testSeller._id,
          title: 'Another stream with tags',
          description: 'Description',
          category: 'Fashion',
          tags: ['fashion', 'style', 'trendy'],
          status: 'live',
          type: 'open_show'
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle streams with scheduled times', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with scheduled times
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Past stream',
          description: 'Past stream',
          category: 'Electronics',
          status: 'ended',
          type: 'auction',
          scheduledStartTime: new Date('2023-01-01T10:00:00Z'),
          actualStartTime: new Date('2023-01-01T10:05:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z')
        },
        {
          seller: testSeller._id,
          title: 'Future stream',
          description: 'Future stream',
          category: 'Fashion',
          status: 'scheduled',
          type: 'open_show',
          scheduledStartTime: new Date('2024-12-31T10:00:00Z')
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle cancelled streams', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create cancelled streams
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Cancelled stream 1',
          description: 'Cancelled stream',
          category: 'Electronics',
          status: 'ended',
          type: 'auction',
          cancelledStream: true
        },
        {
          seller: testSeller._id,
          title: 'Cancelled stream 2',
          description: 'Cancelled stream',
          category: 'Fashion',
          status: 'expired',
          type: 'open_show',
          cancelledStream: true
        },
        {
          seller: testSeller._id,
          title: 'Active stream',
          description: 'Active stream',
          category: 'Home',
          status: 'live',
          type: 'auction',
          cancelledStream: false
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(3); // Should count all streams regardless of cancelled status
    });

    it('should handle streams with agora data', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with agora data
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Stream with agora data',
          description: 'Description',
          category: 'Electronics',
          status: 'live',
          type: 'auction',
          channelName: 'johns_channel',
          agoraToken: 'agora_token_123',
          agoraUid: 12345
        },
        {
          seller: testSeller._id,
          title: 'Another stream with agora data',
          description: 'Description',
          category: 'Fashion',
          status: 'live',
          type: 'open_show',
          channelName: 'johns_fashion_channel',
          agoraToken: 'agora_token_456',
          agoraUid: 67890
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle streams with processing end job flag', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with processing end job flag
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Stream with processing end job',
          description: 'Description',
          category: 'Electronics',
          status: 'ended',
          type: 'auction',
          processingEndJob: true
        },
        {
          seller: testSeller._id,
          title: 'Stream without processing end job',
          description: 'Description',
          category: 'Fashion',
          status: 'live',
          type: 'open_show',
          processingEndJob: false
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle streams with stream links', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with stream links
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Stream with link',
          description: 'Description',
          category: 'Electronics',
          status: 'live',
          type: 'auction',
          streamLink: 'https://example.com/stream/123'
        },
        {
          seller: testSeller._id,
          title: 'Stream without link',
          description: 'Description',
          category: 'Fashion',
          status: 'live',
          type: 'open_show'
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });

    it('should handle multiple sellers with streams', async () => {
      // Create test sellers
      const seller1 = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      const seller2 = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        phoneNumber: '+1987654321',
        businessName: 'Jane\'s Store'
      });
      await Promise.all([seller1.save(), seller2.save()]);

      // Create streams for both sellers
      await Stream.create([
        {
          seller: seller1._id,
          title: 'John\'s Stream 1',
          description: 'Description',
          category: 'Electronics',
          status: 'live',
          type: 'auction'
        },
        {
          seller: seller1._id,
          title: 'John\'s Stream 2',
          description: 'Description',
          category: 'Fashion',
          status: 'ended',
          type: 'open_show'
        },
        {
          seller: seller2._id,
          title: 'Jane\'s Stream 1',
          description: 'Description',
          category: 'Home',
          status: 'live',
          type: 'auction'
        }
      ]);

      // Test the function for both sellers
      const result1 = await streamRepository.countStreamsBySeller(seller1._id);
      const result2 = await streamRepository.countStreamsBySeller(seller2._id);

      expect(result1).toBe(2);
      expect(result2).toBe(1);
    });

    it('should handle streams created at different times', async () => {
      // Create test seller
      const testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        businessName: 'John\'s Store'
      });
      await testSeller.save();

      // Create streams with different creation times
      await Stream.create([
        {
          seller: testSeller._id,
          title: 'Old Stream',
          description: 'Old stream',
          category: 'Electronics',
          status: 'ended',
          type: 'auction',
          createdAt: new Date('2023-01-01T10:00:00Z')
        },
        {
          seller: testSeller._id,
          title: 'Recent Stream',
          description: 'Recent stream',
          category: 'Fashion',
          status: 'live',
          type: 'open_show',
          createdAt: new Date('2023-12-01T10:00:00Z')
        }
      ]);

      // Test the function
      const result = await streamRepository.countStreamsBySeller(testSeller._id);

      expect(result).toBe(2);
    });
  });
});
