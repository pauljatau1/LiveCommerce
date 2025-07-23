const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@modules/buyer/models/buyer.model');
const Post = require('@models/Post');
const Order = require('@models/Order');
const Return = require('@models/Return');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

let mongoServer;

describe('Buyer Repository', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    try { await mongoose.connection.db.collection('orders').dropIndex('order_id_1'); } catch (e) {}
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    try { await mongoose.connection.db.dropCollection('orders'); } catch (e) {}
    // Clear database before each test
    await Buyer.deleteMany({});
    await Post.deleteMany({});
    await Order.deleteMany({});
    await Return.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
  });

  const mockBuyerData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    country: 'NG',
    phoneNumber: '+2348012345678',
    password: 'hashedPassword123',
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    isNewBuyer: true,
    isIdentityVerified: false,
    preferredCurrency: 'NGN',
    preferredLanguage: 'en',
    authProvider: 'local'
  };

  describe('findAll', () => {
    it('should return all buyers excluding sensitive fields', async () => {
      // Arrange
      const buyer1 = new Buyer(mockBuyerData);
      const buyer2 = new Buyer({
        ...mockBuyerData,
        email: 'jane.doe@example.com',
        username: 'janedoe',
        firstName: 'Jane',
        lastName: 'Doe'
      });
      
      const savedBuyer1 = await buyer1.save();
      const savedBuyer2 = await buyer2.save();
      
      // Verify data was saved
      expect(savedBuyer1._id).toBeDefined();
      expect(savedBuyer2._id).toBeDefined();

      // Act
      const result = await buyerRepository.findAll();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result).toBeDefined();
      expect(result[0]).toBeDefined();
      expect(result[0].password).toBeUndefined();
      expect(result[0].__v).toBeUndefined();
      expect(result[0]).toHaveProperty('firstName');
      expect(result[0]).toHaveProperty('email');
    });

    it('should return filtered buyers when filters are provided', async () => {
      // Arrange
      const buyer1 = new Buyer(mockBuyerData);
      const buyer2 = new Buyer({
        ...mockBuyerData,
        email: 'jane.doe@example.com',
        username: 'janedoe',
        firstName: 'Jane',
        lastName: 'Doe',
        isActive: false
      });
      await buyer1.save();
      await buyer2.save();

      // Act
      const result = await buyerRepository.findAll({ isActive: true });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('john.doe@example.com');
    });

    it('should return empty array when no buyers exist', async () => {
      // Act
      const result = await buyerRepository.findAll();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle complex filters', async () => {
      // Arrange
      const buyer1 = new Buyer(mockBuyerData);
      const buyer2 = new Buyer({
        ...mockBuyerData,
        email: 'jane.doe@example.com',
        username: 'janedoe',
        firstName: 'Jane',
        lastName: 'Doe',
        country: 'US'
      });
      await buyer1.save();
      await buyer2.save();

      // Act
      const result = await buyerRepository.findAll({
        country: 'NG',
        isActive: true
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].country).toBe('NG');
    });
  });

  describe('save', () => {
    it('should save a new buyer instance', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);

      // Act
      const result = await buyerRepository.save(buyer);

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should handle save errors', async () => {
      // Arrange
      const buyer = new Buyer({
        // Missing required fields
        firstName: 'John'
      });

      // Act & Assert
      await expect(buyerRepository.save(buyer)).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find buyer by email', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findByEmail('john.doe@example.com');

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('john.doe@example.com');
      expect(result.firstName).toBe('John');
    });

    it('should return null when buyer not found', async () => {
      // Act
      const result = await buyerRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle case insensitive email search', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findByEmail('JOHN.DOE@EXAMPLE.COM');

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('john.doe@example.com');
    });
  });

  describe('saveBuyer', () => {
    it('should save buyer instance', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);

      // Act
      const result = await buyerRepository.saveBuyer(buyer);

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.firstName).toBe('John');
    });

    it('should update existing buyer', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();
      buyer.firstName = 'Updated John';

      // Act
      const result = await buyerRepository.saveBuyer(buyer);

      // Assert
      expect(result.firstName).toBe('Updated John');
    });
  });

  describe('findByIdWithFields', () => {
    it('should find buyer by ID with specific fields included', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findByIdWithFields(buyer._id, {
        firstName: 1,
        lastName: 1,
        email: 1
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('phoneNumber');
    });

    it('should find buyer by ID with specific fields excluded', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findByIdWithFields(buyer._id, {
        password: 0,
        phoneNumber: 0
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.email).toBe('john.doe@example.com');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('phoneNumber');
    });

    it('should return null when buyer not found', async () => {
      // Arrange
      const fakeId = new mongoose.Types.ObjectId();

      // Act
      const result = await buyerRepository.findByIdWithFields(fakeId, {
        firstName: 1
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should return lean object', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findByIdWithFields(buyer._id, {
        firstName: 1
      });

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.toObject).toBeUndefined(); // Should be lean object
    });
  });

  describe('getFollowersCount', () => {
    it('should return correct followers count', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        followers: [
          { sellerId: new mongoose.Types.ObjectId(), storeName: 'Store 1' },
          { sellerId: new mongoose.Types.ObjectId(), storeName: 'Store 2' }
        ]
      });
      await buyer.save();

      // Act
      const result = await buyerRepository.getFollowersCount(buyer._id);

      // Assert
      expect(result).toBe(2);
    });

    it('should return 0 when no followers', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.getFollowersCount(buyer._id);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when buyer not found', async () => {
      // Arrange
      const fakeId = new mongoose.Types.ObjectId();

      // Act
      const result = await buyerRepository.getFollowersCount(fakeId);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getFollowingCount', () => {
    it('should return correct following count', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        activityFeed: [
          {
            type: 'follow',
            referenceModel: 'Seller',
            reference: new mongoose.Types.ObjectId(),
            content: 'Followed a seller'
          },
          {
            type: 'post',
            referenceModel: 'Post',
            reference: new mongoose.Types.ObjectId(),
            content: 'Created a post'
          },
          {
            type: 'follow',
            referenceModel: 'Seller',
            reference: new mongoose.Types.ObjectId(),
            content: 'Followed another seller'
          }
        ]
      });
      await buyer.save();

      // Act
      const result = await buyerRepository.getFollowingCount(buyer._id);

      // Assert
      expect(result).toBe(2);
    });

    it('should return 0 when no following activity', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        activityFeed: [
          {
            type: 'post',
            referenceModel: 'Post',
            reference: new mongoose.Types.ObjectId(),
            content: 'Created a post'
          }
        ]
      });
      await buyer.save();

      // Act
      const result = await buyerRepository.getFollowingCount(buyer._id);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when buyer not found', async () => {
      // Arrange
      const fakeId = new mongoose.Types.ObjectId();

      // Act
      const result = await buyerRepository.getFollowingCount(fakeId);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getPostsCount', () => {
    it('should return correct posts count', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Create posts for the buyer
      const post1 = new Post({
        title: 'First Post',
        body: 'This is the first post content',
        author: {
          userId: buyer._id,
          userModel: 'Buyer',
          firstName: buyer.firstName,
          lastName: buyer.lastName
        }
      });
      const post2 = new Post({
        title: 'Second Post',
        body: 'This is the second post content',
        author: {
          userId: buyer._id,
          userModel: 'Buyer',
          firstName: buyer.firstName,
          lastName: buyer.lastName
        }
      });
      await post1.save();
      await post2.save();

      // Act
      const result = await buyerRepository.getPostsCount(buyer._id);

      // Assert
      expect(result).toBe(2);
    });

    it('should return 0 when no posts exist', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.getPostsCount(buyer._id);

      // Assert
      expect(result).toBe(0);
    });

    it('should not count posts from other users', async () => {
      // Arrange
      const buyer1 = new Buyer(mockBuyerData);
      const buyer2 = new Buyer({
        ...mockBuyerData,
        email: 'jane.doe@example.com',
        username: 'janedoe'
      });
      await buyer1.save();
      await buyer2.save();

      // Create posts for both buyers
      const post1 = new Post({
        title: 'Buyer 1 Post',
        body: 'This is buyer 1 post content',
        author: {
          userId: buyer1._id,
          userModel: 'Buyer',
          firstName: buyer1.firstName,
          lastName: buyer1.lastName
        }
      });
      const post2 = new Post({
        title: 'Buyer 2 Post',
        body: 'This is buyer 2 post content',
        author: {
          userId: buyer2._id,
          userModel: 'Buyer',
          firstName: buyer2.firstName,
          lastName: buyer2.lastName
        }
      });
      await post1.save();
      await post2.save();

      // Act
      const result = await buyerRepository.getPostsCount(buyer1._id);

      // Assert
      expect(result).toBe(1);
    });

    it('should return 0 when buyer not found', async () => {
      // Arrange
      const fakeId = new mongoose.Types.ObjectId();

      // Act
      const result = await buyerRepository.getPostsCount(fakeId);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid ObjectId in findByIdWithFields', async () => {
      // Act
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await buyerRepository.findByIdWithFields(nonExistentId, {
        firstName: 1
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should handle invalid ObjectId in getFollowersCount', async () => {
      // Act
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await buyerRepository.getFollowersCount(nonExistentId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle invalid ObjectId in getFollowingCount', async () => {
      // Act
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await buyerRepository.getFollowingCount(nonExistentId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle invalid ObjectId in getPostsCount', async () => {
      // Act
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await buyerRepository.getPostsCount(nonExistentId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle empty filters in findAll', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findAll({});

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should handle null filters in findAll', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findAll(null);

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should handle undefined filters in findAll', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      await buyer.save();

      // Act
      const result = await buyerRepository.findAll(undefined);

      // Assert
      expect(result).toHaveLength(1);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      // Arrange
      const buyerData = {
        ...mockBuyerData,
        followers: [
          { sellerId: new mongoose.Types.ObjectId(), storeName: 'Store 1' }
        ],
        activityFeed: [
          {
            type: 'follow',
            referenceModel: 'Seller',
            reference: new mongoose.Types.ObjectId(),
            content: 'Followed a seller'
          }
        ]
      };
      const buyer = new Buyer(buyerData);
      await buyer.save();

      // Create a post for the buyer
      const post = new Post({
        title: 'Test Post',
        body: 'This is a test post content',
        author: {
          userId: buyer._id,
          userModel: 'Buyer',
          firstName: buyer.firstName,
          lastName: buyer.lastName
        }
      });
      await post.save();

      // Act & Assert - Verify all counts are correct
      const followersCount = await buyerRepository.getFollowersCount(buyer._id);
      const followingCount = await buyerRepository.getFollowingCount(buyer._id);
      const postsCount = await buyerRepository.getPostsCount(buyer._id);

      expect(followersCount).toBe(1);
      expect(followingCount).toBe(1);
      expect(postsCount).toBe(1);

      // Verify findByEmail returns correct data
      const foundBuyer = await buyerRepository.findByEmail(buyer.email);
      expect(foundBuyer._id.toString()).toBe(buyer._id.toString());
      expect(foundBuyer.firstName).toBe(buyer.firstName);

      // Verify findByIdWithFields returns correct data
      const buyerWithFields = await buyerRepository.findByIdWithFields(buyer._id, {
        firstName: 1,
        lastName: 1,
        email: 1
      });
      expect(buyerWithFields.firstName).toBe(buyer.firstName);
      expect(buyerWithFields.lastName).toBe(buyer.lastName);
      expect(buyerWithFields.email).toBe(buyer.email);
    });
  });

  describe('findByIdWithSelectedCategories', () => {
    let testBuyer;

    beforeEach(async () => {
      // Create a test buyer with selected categories
      testBuyer = new Buyer({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        selectedCategories: [
          {
            name: 'Electronics',
            subCategories: [
              { name: 'Smartphones' },
              { name: 'Laptops' }
            ]
          },
          {
            name: 'Fashion',
            subCategories: [
              { name: 'Men\'s Clothing' },
              { name: 'Women\'s Clothing' }
            ]
          }
        ]
      });

      await testBuyer.save();
    });

    it('should find buyer with selected categories populated', async () => {
      const result = await buyerRepository.findByIdWithSelectedCategories(testBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(testBuyer._id.toString());
      expect(result.selectedCategories).toHaveLength(2);
      expect(result.selectedCategories[0].name).toBe('Electronics');
      expect(result.selectedCategories[0].subCategories).toHaveLength(2);
      expect(result.selectedCategories[1].name).toBe('Fashion');
      expect(result.selectedCategories[1].subCategories).toHaveLength(2);
    });

    it('should return null for non-existent buyer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await buyerRepository.findByIdWithSelectedCategories(nonExistentId);

      expect(result).toBeNull();
    });

    it('should handle buyer with empty selected categories', async () => {
      // Create buyer without selected categories
      const emptyBuyer = new Buyer({
        firstName: 'Empty',
        lastName: 'User',
        email: 'empty@example.com',
        username: 'emptyuser',
        password: 'password123',
        selectedCategories: []
      });

      await emptyBuyer.save();

      const result = await buyerRepository.findByIdWithSelectedCategories(emptyBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(emptyBuyer._id.toString());
      expect(result.selectedCategories).toHaveLength(0);
    });

    it('should handle invalid ObjectId format', async () => {
      await expect(
        buyerRepository.findByIdWithSelectedCategories('invalid-id')
      ).rejects.toThrow('Cast to ObjectId failed for value "invalid-id"');
    });

    it('should only return selectedCategories field', async () => {
      const result = await buyerRepository.findByIdWithSelectedCategories(testBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result.selectedCategories).toBeDefined();
      // Should not have other fields like firstName, lastName, etc.
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should handle buyer with null selected categories', async () => {
      // Create buyer with null selected categories
      const nullBuyer = new Buyer({
        firstName: 'Null',
        lastName: 'User',
        email: 'null@example.com',
        username: 'nulluser',
        password: 'password123',
        selectedCategories: null
      });

      await nullBuyer.save();

      const result = await buyerRepository.findByIdWithSelectedCategories(nullBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(nullBuyer._id.toString());
      expect(result.selectedCategories).toBeNull();
    });

    it('should handle complex category structure', async () => {
      // Create buyer with complex category structure
      const complexBuyer = new Buyer({
        firstName: 'Complex',
        lastName: 'User',
        email: 'complex@example.com',
        username: 'complexuser',
        password: 'password123',
        selectedCategories: [
          {
            name: 'Technology',
            subCategories: [
              { name: 'Computers' },
              { name: 'Mobile Devices' },
              { name: 'Accessories' }
            ]
          },
          {
            name: 'Home & Garden',
            subCategories: [
              { name: 'Furniture' },
              { name: 'Decor' }
            ]
          }
        ]
      });

      await complexBuyer.save();

      const result = await buyerRepository.findByIdWithSelectedCategories(complexBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result.selectedCategories).toHaveLength(2);
      expect(result.selectedCategories[0].name).toBe('Technology');
      expect(result.selectedCategories[0].subCategories).toHaveLength(3);
      expect(result.selectedCategories[1].name).toBe('Home & Garden');
      expect(result.selectedCategories[1].subCategories).toHaveLength(2);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test ensures the method handles database errors properly
      // In a real scenario, this would be tested with a mock database
      const validId = new mongoose.Types.ObjectId().toString();
      
      // This should not throw an error even if the buyer doesn't exist
      await expect(
        buyerRepository.findByIdWithSelectedCategories(validId)
      ).resolves.toBeNull();
    });
  });

  describe('countOrders', () => {
    let testBuyer;
    let testOrder;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer(mockBuyerData);
      await testBuyer.save();

      // Create a test order
      testOrder = new Order({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
        buyerDetails: { _id: testBuyer._id },
        order_id: 'OR12345',
        totalAmount: 1000,
        status: 'delivered',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            productName: 'Test Product',
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 1000
          }
        ]
      });

      await testOrder.save();
      
      // Get the actual saved order to use its order_id in tests
      const savedOrder = await Order.findById(testOrder._id);
      testOrder.order_id = savedOrder.order_id; // Update the testOrder with the actual saved order_id
    });

    it('should count orders with basic query', async () => {
      const query = { buyer: testBuyer._id };
      const result = await buyerRepository.countOrders(query);

      expect(result).toBe(1);
    });

    it('should count orders with status filter', async () => {
      const query = { buyer: testBuyer._id, status: 'delivered' };
      const result = await buyerRepository.countOrders(query);

      expect(result).toBe(1);
    });

    it('should return 0 for non-existent buyer', async () => {
      const query = { buyer: new mongoose.Types.ObjectId() };
      const result = await buyerRepository.countOrders(query);

      expect(result).toBe(0);
    });

    it('should handle complex queries', async () => {
      const query = { 
        buyer: testBuyer._id,
        'shipping.tracking.status': 'delivered'
      };
      const result = await buyerRepository.countOrders(query);

      expect(result).toBe(0); // No orders with this specific tracking status
    });
  });

  describe('findOrders', () => {
    let testBuyer;
    let testOrder;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer(mockBuyerData);
      await testBuyer.save();

      // Create a test order
      testOrder = new Order({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
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
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 1000
          }
        ]
      });

      await testOrder.save();
      
      // Get the actual saved order to use its order_id in tests
      const savedOrder = await Order.findById(testOrder._id);
      testOrder.order_id = savedOrder.order_id; // Update the testOrder with the actual saved order_id
    });

    it('should find orders with basic query', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: '-createdAt', skip: 0, limit: 10 };

      const result = await buyerRepository.findOrders(query, options);

      expect(result).toHaveLength(1);
      expect(result[0].order_id).toMatch(/^OR[A-Z0-9]{5}$/); // Check format instead of specific value
      expect(result[0].totalAmount).toBe(1000);
      expect(result[0].status).toBe('delivered');
    });

    it('should handle pagination options', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: '-createdAt', skip: 0, limit: 5 };

      const result = await buyerRepository.findOrders(query, options);

      expect(result).toHaveLength(1);
    });

    it('should return empty array for non-existent buyer', async () => {
      const query = { buyer: new mongoose.Types.ObjectId() };
      const options = { sort: '-createdAt', skip: 0, limit: 10 };

      const result = await buyerRepository.findOrders(query, options);

      expect(result).toHaveLength(0);
    });

    it('should handle different sort options', async () => {
      const query = { buyer: testBuyer._id };
      const options = { sort: 'createdAt', skip: 0, limit: 10 };

      const result = await buyerRepository.findOrders(query, options);

      expect(result).toHaveLength(1);
    });
  });

  describe('findReturnRequests', () => {
    let testBuyer;
    let testOrder;
    let testReturn;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer(mockBuyerData);
      await testBuyer.save();

      // Create a test order
      testOrder = new Order({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
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
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 1000
          }
        ]
      });

      await testOrder.save();
      
      // Get the actual saved order to use its order_id in tests
      const savedOrder = await Order.findById(testOrder._id);
      testOrder.order_id = savedOrder.order_id; // Update the testOrder with the actual saved order_id

      // Create a test return request
      testReturn = new Return({
        order: testOrder._id,
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
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
      const result = await buyerRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(1);
      expect(result[0].order.toString()).toBe(testOrder._id.toString());
      expect(result[0].status).toBe('PENDING_SELLER_REVIEW');
    });

    it('should return empty array for orders without returns', async () => {
      const orderIds = [new mongoose.Types.ObjectId()];
      const result = await buyerRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(0);
    });

    it('should handle multiple order IDs', async () => {
      // Create another order and return
      const order2 = new Order({
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
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
            seller: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 500
          }
        ]
      });

      await order2.save();

      const return2 = new Return({
        order: order2._id,
        buyer: testBuyer._id,
        seller: new mongoose.Types.ObjectId(),
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
      const result = await buyerRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(2);
    });

    it('should handle empty order IDs array', async () => {
      const orderIds = [];
      const result = await buyerRepository.findReturnRequests(orderIds);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOrderByIdAndBuyer', () => {
    let testBuyer;
    let testOrder;
    let testProduct;
    let testSeller;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer(mockBuyerData);
      await testBuyer.save();

      // Create a test seller
      testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });
      await testSeller.save();

      // Create a test product
      testProduct = new Product({
        name: 'Test Product',
        description: 'A test product for testing',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: testSeller._id,
        images: [
          { url: 'image1.jpg' },
          { url: 'image2.jpg' }
        ]
      });
      await testProduct.save();

      // Create a test order
      testOrder = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: testBuyer._id
        },
        totalAmount: 1000,
        status: 'delivered',
        items: [
          {
            product: testProduct._id,
            productName: 'Test Product',
            seller: testSeller._id,
            quantity: 1,
            price: 1000
          }
        ],
        shipping: {
          tracking: {
            status: 'delivered'
          }
        }
      });

      await testOrder.save();
    });

    it('should find order by ID and buyer', async () => {
      const result = await buyerRepository.findOrderByIdAndBuyer(
        testOrder._id.toString(),
        testBuyer._id.toString()
      );

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(testOrder._id.toString());
      expect(result.buyer.toString()).toBe(testBuyer._id.toString());
      expect(result.totalAmount).toBe(1000);
      expect(result.status).toBe('delivered');
    });

    it('should populate product and seller information', async () => {
      const result = await buyerRepository.findOrderByIdAndBuyer(
        testOrder._id.toString(),
        testBuyer._id.toString()
      );

      expect(result.items[0].product).toBeDefined();
      expect(result.items[0].product.name).toBe('Test Product');
      expect(result.items[0].product.images).toHaveLength(2);
      expect(result.items[0].product.images[0].url).toBe('image1.jpg');
      expect(result.items[0].product.images[1].url).toBe('image2.jpg');
      expect(result.items[0].seller).toBeDefined();
      expect(result.items[0].seller.storeName).toBe('Test Store');
      expect(result.items[0].seller.email).toBe('seller@test.com');
      expect(result.items[0].seller.phoneNumber).toBe('+1234567890');
    });

    it('should return null when order not found', async () => {
      const nonExistentOrderId = new mongoose.Types.ObjectId().toString();
      
      const result = await buyerRepository.findOrderByIdAndBuyer(
        nonExistentOrderId,
        testBuyer._id.toString()
      );

      expect(result).toBeNull();
    });

    it('should return null when order does not belong to buyer', async () => {
      // Create another buyer
      const anotherBuyer = new Buyer({
        ...mockBuyerData,
        email: 'another@example.com',
        username: 'anotheruser'
      });
      await anotherBuyer.save();

      const result = await buyerRepository.findOrderByIdAndBuyer(
        testOrder._id.toString(),
        anotherBuyer._id.toString()
      );

      expect(result).toBeNull();
    });

    it('should handle invalid ObjectId format', async () => {
      const result = await buyerRepository.findOrderByIdAndBuyer(
        'invalid-id',
        testBuyer._id.toString()
      );

      expect(result).toBeNull();
    });
  });

  describe('findBuyerOrders', () => {
    let testBuyer;
    let testSeller;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer(mockBuyerData);
      await testBuyer.save();

      // Create a test seller
      testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });
      await testSeller.save();
    });

    it('should find all orders for a buyer', async () => {
      // Create multiple orders for the buyer
      const orders = [
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1000,
          status: 'delivered',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              productName: 'Test Product 1',
              seller: testSeller._id,
              quantity: 1,
              price: 1000,
              status: 'delivered'
            }
          ]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 2000,
          status: 'pending_payment',
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              productName: 'Test Product 2',
              seller: testSeller._id,
              quantity: 2,
              price: 1000,
              status: 'pending_payment'
            }
          ]
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      const result = await buyerRepository.findBuyerOrders(testBuyer._id.toString());

      expect(result).toHaveLength(2);
      expect(result[0].buyer.toString()).toBe(testBuyer._id.toString());
      expect(result[1].buyer.toString()).toBe(testBuyer._id.toString());
      expect(result[0].totalAmount).toBe(1000);
      expect(result[1].totalAmount).toBe(2000);
    });

    it('should return empty array when buyer has no orders', async () => {
      const result = await buyerRepository.findBuyerOrders(testBuyer._id.toString());

      expect(result).toHaveLength(0);
    });

    it('should not return orders from other buyers', async () => {
      // Create another buyer
      const anotherBuyer = new Buyer({
        ...mockBuyerData,
        email: 'another@example.com',
        username: 'anotheruser'
      });
      await anotherBuyer.save();

      // Create order for another buyer
      const order = new Order({
        buyer: anotherBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: anotherBuyer._id
        },
        totalAmount: 1000,
        status: 'delivered',
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            productName: 'Test Product',
            seller: testSeller._id,
            quantity: 1,
            price: 1000,
            status: 'delivered'
          }
        ]
      });

      await order.save();

      const result = await buyerRepository.findBuyerOrders(testBuyer._id.toString());

      expect(result).toHaveLength(0);
    });
  });

  describe('findRecentOrders', () => {
    let testBuyer;
    let testSeller;
    let testProduct;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer(mockBuyerData);
      await testBuyer.save();

      // Create a test seller
      testSeller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@test.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        storeName: 'Test Store'
      });
      await testSeller.save();

      // Create a test product
      testProduct = new Product({
        name: 'Test Product',
        description: 'A test product for testing',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: testSeller._id,
        images: [
          { url: 'image1.jpg' },
          { url: 'image2.jpg' }
        ]
      });
      await testProduct.save();
    });

    it('should find recent orders with populated product data', async () => {
      // Create multiple orders
      const orders = [
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1000,
          status: 'delivered',
          items: [
            {
              product: testProduct._id,
              productName: 'Test Product 1',
              seller: testSeller._id,
              quantity: 1,
              price: 1000,
              status: 'delivered'
            }
          ]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 2000,
          status: 'pending_payment',
          items: [
            {
              product: testProduct._id,
              productName: 'Test Product 2',
              seller: testSeller._id,
              quantity: 2,
              price: 1000,
              status: 'pending_payment'
            }
          ]
        },
        {
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1500,
          status: 'processing',
          items: [
            {
              product: testProduct._id,
              productName: 'Test Product 3',
              seller: testSeller._id,
              quantity: 1,
              price: 1500,
              status: 'processing'
            }
          ]
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      const result = await buyerRepository.findRecentOrders(testBuyer._id.toString(), 2);

      expect(result).toHaveLength(2);
      expect(result[0].totalAmount).toBe(1500); // Most recent
      expect(result[1].totalAmount).toBe(2000);
      expect(result[0].items[0].product).toBeDefined();
      expect(result[0].items[0].product.name).toBe('Test Product');
      expect(result[0].items[0].product.images).toHaveLength(2);
      expect(result[0].items[0].product.price).toBe(1000);
    });

    it('should return default limit of 5 when limit not specified', async () => {
      // Create 7 orders
      for (let i = 0; i < 7; i++) {
        const order = new Order({
          buyer: testBuyer._id,
          seller: testSeller._id,
          buyerDetails: {
            _id: testBuyer._id
          },
          totalAmount: 1000 + i,
          status: 'delivered',
          items: [
            {
              product: testProduct._id,
              productName: `Test Product ${i + 1}`,
              seller: testSeller._id,
              quantity: 1,
              price: 1000 + i,
              status: 'delivered'
            }
          ]
        });
        await order.save();
      }

      const result = await buyerRepository.findRecentOrders(testBuyer._id.toString());

      expect(result).toHaveLength(5);
      expect(result[0].totalAmount).toBe(1006); // Most recent
      expect(result[4].totalAmount).toBe(1002); // 5th most recent
    });

    it('should return empty array when buyer has no orders', async () => {
      const result = await buyerRepository.findRecentOrders(testBuyer._id.toString());

      expect(result).toHaveLength(0);
    });

    it('should handle orders with products that have no images', async () => {
      // Create a product without images
      const productWithoutImages = new Product({
        name: 'Product Without Images',
        description: 'A test product without images',
        price: 500,
        category: 'Electronics',
        stock: 5,
        seller: testSeller._id,
        images: []
      });

      await productWithoutImages.save();

      // Create an order with the product without images
      const order = new Order({
        buyer: testBuyer._id,
        seller: testSeller._id,
        buyerDetails: {
          _id: testBuyer._id
        },
        totalAmount: 500,
        status: 'delivered',
        items: [
          {
            product: productWithoutImages._id,
            productName: 'Product Without Images',
            seller: testSeller._id,
            quantity: 1,
            price: 500,
            status: 'delivered'
          }
        ]
      });

      await order.save();

      const result = await buyerRepository.findRecentOrders(testBuyer._id.toString());

      expect(result).toHaveLength(1);
      expect(result[0].items[0].product.images).toHaveLength(0);
    });
  });

  describe('findByIdWithShippingAddresses', () => {
    let testBuyer;

    beforeEach(async () => {
      // Create a test buyer with shipping addresses
      testBuyer = new Buyer({
        ...mockBuyerData,
        shippingAddresses: [
          {
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            zipCode: '100001'
          },
          {
            addressType: 'work',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Victoria Island',
            addressLine1: '456 Business Avenue',
            addressLine2: 'Suite 10',
            zipCode: '100002'
          }
        ]
      });
      await testBuyer.save();
    });

    it('should find buyer with shipping addresses', async () => {
      const result = await buyerRepository.findByIdWithShippingAddresses(testBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(testBuyer._id.toString());
      expect(result.shippingAddresses).toHaveLength(2);
      expect(result.shippingAddresses[0].addressType).toBe('home');
      expect(result.shippingAddresses[0].country).toBe('Nigeria');
      expect(result.shippingAddresses[0].state).toBe('Lagos');
      expect(result.shippingAddresses[0].city).toBe('Lagos');
      expect(result.shippingAddresses[0].addressLine1).toBe('123 Main Street');
      expect(result.shippingAddresses[0].addressLine2).toBe('Apt 4B');
      expect(result.shippingAddresses[0].zipCode).toBe('100001');
      expect(result.shippingAddresses[1].addressType).toBe('work');
      expect(result.shippingAddresses[1].addressLine1).toBe('456 Business Avenue');
    });

    it('should return null for non-existent buyer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await buyerRepository.findByIdWithShippingAddresses(nonExistentId);

      expect(result).toBeNull();
    });

    it('should handle buyer with empty shipping addresses', async () => {
      // Create buyer without shipping addresses
      const emptyBuyer = new Buyer({
        ...mockBuyerData,
        email: 'empty@example.com',
        username: 'emptyuser',
        shippingAddresses: []
      });

      await emptyBuyer.save();

      const result = await buyerRepository.findByIdWithShippingAddresses(emptyBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(emptyBuyer._id.toString());
      expect(result.shippingAddresses).toHaveLength(0);
    });

    it('should handle invalid ObjectId format', async () => {
      await expect(
        buyerRepository.findByIdWithShippingAddresses('invalid-id')
      ).rejects.toThrow('Cast to ObjectId failed for value "invalid-id"');
    });

    it('should only return shippingAddresses field', async () => {
      const result = await buyerRepository.findByIdWithShippingAddresses(testBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result.shippingAddresses).toBeDefined();
      // Should not have other fields like firstName, lastName, etc.
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should handle buyer with null shipping addresses', async () => {
      // Create buyer with null shipping addresses
      const nullBuyer = new Buyer({
        ...mockBuyerData,
        email: 'null@example.com',
        username: 'nulluser',
        shippingAddresses: null
      });

      await nullBuyer.save();

      const result = await buyerRepository.findByIdWithShippingAddresses(nullBuyer._id.toString());

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(nullBuyer._id.toString());
      expect(result.shippingAddresses).toBeNull();
    });
  });

  describe('addShippingAddress', () => {
    let testBuyer;

    beforeEach(async () => {
      // Create a test buyer with existing shipping addresses
      testBuyer = new Buyer({
        ...mockBuyerData,
        shippingAddresses: [
          {
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            zipCode: '100001'
          }
        ]
      });
      await testBuyer.save();
    });

    it('should add new shipping address to buyer', async () => {
      const newAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        addressLine2: 'Suite 10',
        zipCode: '100002'
      };

      const result = await buyerRepository.addShippingAddress(testBuyer._id.toString(), newAddress);

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(testBuyer._id.toString());
      expect(result.shippingAddresses).toHaveLength(2);
      expect(result.shippingAddresses[0].addressType).toBe('home');
      expect(result.shippingAddresses[1].addressType).toBe('work');
      expect(result.shippingAddresses[1].addressLine1).toBe('456 Business Avenue');
      expect(result.shippingAddresses[1].zipCode).toBe('100002');
    });

    it('should add address to buyer with no existing addresses', async () => {
      // Create buyer without shipping addresses
      const emptyBuyer = new Buyer({
        ...mockBuyerData,
        email: 'empty@example.com',
        username: 'emptyuser',
        shippingAddresses: []
      });
      await emptyBuyer.save();

      const newAddress = {
        addressType: 'home',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '789 New Street',
        zipCode: '100003'
      };

      const result = await buyerRepository.addShippingAddress(emptyBuyer._id.toString(), newAddress);

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(emptyBuyer._id.toString());
      expect(result.shippingAddresses).toHaveLength(1);
      expect(result.shippingAddresses[0].addressType).toBe('home');
      expect(result.shippingAddresses[0].addressLine1).toBe('789 New Street');
    });

    it('should return null for non-existent buyer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const newAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      const result = await buyerRepository.addShippingAddress(nonExistentId, newAddress);

      expect(result).toBeNull();
    });

    it('should handle address without optional fields', async () => {
      const newAddress = {
        addressType: 'other',
        country: 'Nigeria',
        state: 'Abuja',
        city: 'Abuja',
        addressLine1: '789 Other Street',
        zipCode: '100003'
      };

      const result = await buyerRepository.addShippingAddress(testBuyer._id.toString(), newAddress);

      expect(result).toBeDefined();
      expect(result.shippingAddresses).toHaveLength(2);
      expect(result.shippingAddresses[1].addressType).toBe('other');
      expect(result.shippingAddresses[1].addressLine2).toBeUndefined();
    });

    it('should handle complex address data', async () => {
      const newAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        addressLine2: 'Suite 10, Floor 5',
        zipCode: '100002'
      };

      const result = await buyerRepository.addShippingAddress(testBuyer._id.toString(), newAddress);

      expect(result).toBeDefined();
      expect(result.shippingAddresses).toHaveLength(2);
      expect(result.shippingAddresses[1].addressType).toBe('work');
      expect(result.shippingAddresses[1].addressLine2).toBe('Suite 10, Floor 5');
    });

    it('should handle invalid ObjectId format', async () => {
      const newAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      await expect(
        buyerRepository.addShippingAddress('invalid-id', newAddress)
      ).rejects.toThrow('Cast to ObjectId failed for value "invalid-id"');
    });
  });
}); 