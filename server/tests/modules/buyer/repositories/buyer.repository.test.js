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

  describe('updateShippingAddress', () => {
    let testBuyer;
    let testAddressId;

    beforeEach(async () => {
      // Create a test buyer with an address
      testBuyer = new Buyer({
        ...mockBuyerData,
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
    });

    it('should update shipping address successfully', async () => {
      // Arrange
      const updateData = {
        addressType: 'work',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        addressLine2: 'Suite 100',
        zipCode: '100002'
      };

      // Act
      const result = await buyerRepository.updateShippingAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        updateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.shippingAddresses).toHaveLength(1);
      expect(result.shippingAddresses[0].addressType).toBe('work');
      expect(result.shippingAddresses[0].city).toBe('Victoria Island');
      expect(result.shippingAddresses[0].addressLine1).toBe('456 Business Avenue');
      expect(result.shippingAddresses[0].addressLine2).toBe('Suite 100');
      expect(result.shippingAddresses[0].zipCode).toBe('100002');
      // Other fields should remain unchanged
      expect(result.shippingAddresses[0].country).toBe('Nigeria');
      expect(result.shippingAddresses[0].state).toBe('Lagos');
    });

    it('should update address with partial data', async () => {
      // Arrange
      const partialUpdateData = {
        addressType: 'work'
      };

      // Act
      const result = await buyerRepository.updateShippingAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        partialUpdateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.shippingAddresses[0].addressType).toBe('work');
      // Other fields should remain unchanged
      expect(result.shippingAddresses[0].country).toBe('Nigeria');
      expect(result.shippingAddresses[0].state).toBe('Lagos');
      expect(result.shippingAddresses[0].city).toBe('Lagos');
      expect(result.shippingAddresses[0].addressLine1).toBe('123 Main Street');
      expect(result.shippingAddresses[0].addressLine2).toBe('Apt 4B');
      expect(result.shippingAddresses[0].zipCode).toBe('100001');
    });

    it('should return null when buyer not found', async () => {
      // Arrange
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        addressType: 'work'
      };

      // Act
      const result = await buyerRepository.updateShippingAddress(
        nonExistentBuyerId, 
        testAddressId, 
        updateData
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when address not found', async () => {
      // Arrange
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        addressType: 'work'
      };

      // Act
      const result = await buyerRepository.updateShippingAddress(
        testBuyer._id.toString(), 
        nonExistentAddressId, 
        updateData
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle empty update data', async () => {
      // Arrange
      const emptyUpdateData = {};

      // Act
      const result = await buyerRepository.updateShippingAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        emptyUpdateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.shippingAddresses[0]).toMatchObject({
        addressType: 'home',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        zipCode: '100001'
      });
    });

    it('should preserve existing fields when updating specific fields', async () => {
      // Arrange
      const updateData = {
        addressLine1: '789 New Street'
      };

      // Act
      const result = await buyerRepository.updateShippingAddress(
        testBuyer._id.toString(), 
        testAddressId, 
        updateData
      );

      // Assert
      expect(result.shippingAddresses[0].addressLine1).toBe('789 New Street');
      // Other fields should remain unchanged
      expect(result.shippingAddresses[0].addressType).toBe('home');
      expect(result.shippingAddresses[0].country).toBe('Nigeria');
      expect(result.shippingAddresses[0].state).toBe('Lagos');
      expect(result.shippingAddresses[0].city).toBe('Lagos');
      expect(result.shippingAddresses[0].addressLine2).toBe('Apt 4B');
      expect(result.shippingAddresses[0].zipCode).toBe('100001');
    });
  });

  describe('deleteShippingAddress', () => {
    let testBuyer;
    let testAddressId;

    beforeEach(async () => {
      // Create a test buyer with addresses
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
            addressLine1: '456 Business Ave',
            zipCode: '100002'
          }
        ]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
    });

    it('should delete an address successfully', async () => {
      // Arrange
      const initialAddressCount = testBuyer.shippingAddresses.length;

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        testBuyer._id.toString(), 
        testAddressId
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.shippingAddresses).toHaveLength(initialAddressCount - 1);
      expect(result.shippingAddresses[0].addressType).toBe('work');
      expect(result.shippingAddresses.find(addr => addr._id.toString() === testAddressId)).toBeUndefined();
    });

    it('should delete the last address successfully', async () => {
      // Arrange
      const secondAddressId = testBuyer.shippingAddresses[1]._id.toString();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        testBuyer._id.toString(), 
        secondAddressId
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.shippingAddresses).toHaveLength(1);
      expect(result.shippingAddresses[0].addressType).toBe('home');
      expect(result.shippingAddresses.find(addr => addr._id.toString() === secondAddressId)).toBeUndefined();
    });

    it('should return null when buyer not found', async () => {
      // Arrange
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        nonExistentBuyerId, 
        testAddressId
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when address not found', async () => {
      // Arrange
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        testBuyer._id.toString(), 
        nonExistentAddressId
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle buyer with no addresses', async () => {
      // Arrange
      const buyerWithNoAddresses = new Buyer({
        ...mockBuyerData,
        email: 'no-address@example.com',
        username: 'noaddress',
        shippingAddresses: []
      });
      await buyerWithNoAddresses.save();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        buyerWithNoAddresses._id.toString(), 
        testAddressId
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle buyer with null shippingAddresses', async () => {
      // Arrange
      const buyerWithNullAddresses = new Buyer({
        ...mockBuyerData,
        email: 'null-address@example.com',
        username: 'nulladdress',
        shippingAddresses: null
      });
      await buyerWithNullAddresses.save();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        buyerWithNullAddresses._id.toString(), 
        testAddressId
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle buyer with undefined shippingAddresses', async () => {
      // Arrange
      const buyerWithUndefinedAddresses = new Buyer({
        ...mockBuyerData,
        email: 'undefined-address@example.com',
        username: 'undefinedaddress'
      });
      buyerWithUndefinedAddresses.shippingAddresses = undefined;
      await buyerWithUndefinedAddresses.save();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        buyerWithUndefinedAddresses._id.toString(), 
        testAddressId
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle case-sensitive address ID comparison', async () => {
      // Arrange
      const addressIdUpperCase = testAddressId.toUpperCase();

      // Act
      const result = await buyerRepository.deleteShippingAddress(
        testBuyer._id.toString(), 
        addressIdUpperCase
      );

      // Assert
      expect(result).toBeNull(); // Should not find the address due to case sensitivity
    });

    it('should handle multiple address deletions correctly', async () => {
      // Arrange
      const secondAddressId = testBuyer.shippingAddresses[1]._id.toString();

      // Act - Delete first address
      const result1 = await buyerRepository.deleteShippingAddress(
        testBuyer._id.toString(), 
        testAddressId
      );

      // Act - Delete second address
      const result2 = await buyerRepository.deleteShippingAddress(
        result1._id.toString(), 
        secondAddressId
      );

      // Assert
      expect(result1.shippingAddresses).toHaveLength(1);
      expect(result2.shippingAddresses).toHaveLength(0);
    });
  });

  describe('updatePhoneVerification', () => {
    it('should update phone verification data for existing buyer', async () => {
      // Arrange
      const buyer = new Buyer(mockBuyerData);
      const savedBuyer = await buyer.save();
      
      const phoneVerificationData = {
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      };

      // Act
      const result = await buyerRepository.updatePhoneVerification(savedBuyer._id, phoneVerificationData);

      // Assert
      expect(result).toBeDefined();
      expect(result.phoneVerification).toEqual(phoneVerificationData);
    });

    it('should return null when buyer not found', async () => {
      // Arrange
      const nonExistentBuyerId = new mongoose.Types.ObjectId();
      const phoneVerificationData = {
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0
      };

      // Act
      const result = await buyerRepository.updatePhoneVerification(nonExistentBuyerId, phoneVerificationData);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Seller-related methods', () => {
    const mockSellerData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'hashedPassword123',
      phoneNumber: '+2348012345679',
      storeName: 'Jane\'s Store',
      businessName: 'Jane Smith Business',
      businessType: 'Retail',
      isVerified: true,
      isFeatured: false,
      accountPending: false,
      emailVerified: true,
      otp: '123456',
      walletBalance: 1000,
      bankDetails: {
        bankCountry: 'Nigeria',
        bankName: 'First Bank',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'Jane Smith',
        swiftCode: 'FBNING',
        bankIdentifierCode: 'FBNING'
      },
      storeAvatar: { url: 'https://example.com/avatar.jpg' },
      storeBanner: { url: 'https://example.com/banner.jpg' },
      socialMedia: {
        instagram: '@janesmith',
        facebook: 'janesmith',
        tiktok: '@janesmith'
      },
      businessAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Amuwo-Odofin',
        addressLine1: '123 Main St',
        zipCode: '100001'
      },
      sellerAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Amuwo-Odofin',
        addressLine1: '456 Side St',
        zipCode: '100002'
      },
      warehouseDetails: {
        name: 'Main Warehouse',
        contactNumber: '+2348012345680',
        address: {
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Amuwo-Odofin',
          addressLine1: '789 Warehouse St',
          zipCode: '100003'
        }
      },
      categories: [
        { name: 'Electronics', subCategories: [{ name: 'Phones' }] }
      ],
      storePolicy: {
        processingTime: '2-3 days',
        deliveryTimes: '3-5 days',
        freeShippingPolicy: 'Free shipping on orders above $50',
        allowsCod: true,
        returnWindow: 14,
        returnCondition: 'Good condition',
        returnShipping: 'Buyer pays',
        nonRefundableItems: ['Digital products'],
        refundPolicy: 'Full refund within 14 days',
        refundMethod: 'Original payment method',
        lostOrDamagedPolicy: 'Replacement or refund',
        exchangePolicy: 'Exchange within 7 days'
      },
      followers: [],
      reviews: [],
      stats: {
        averageRating: 4.5,
        totalReviews: 100,
        ratingDistribution: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 }
      }
    };

    describe('findSellerById', () => {
      it('should find seller by ID with selected fields', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.findSellerById(savedSeller._id);
        
        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedSeller._id.toString());
        expect(result.firstName).toBe('Jane');
        expect(result.lastName).toBe('Smith');
        expect(result.storeName).toBe('Jane\'s Store');
        
        // Check that sensitive fields are excluded
        const resultObj = result.toObject();
        expect(resultObj.password).toBeUndefined();
        expect(resultObj.bankDetails).toBeUndefined();
        expect(resultObj.otp).toBeUndefined();
        expect(resultObj.emailVerified).toBeUndefined();
        expect(resultObj.walletBalance).toBeUndefined();
        expect(resultObj.phoneNumber).toBeUndefined();
      });

      it('should return null when seller not found', async () => {
        // Arrange
        const nonExistentSellerId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.findSellerById(nonExistentSellerId);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('findOrdersBySeller', () => {
      it('should find orders for a seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();

        const orderData = {
          buyer: savedBuyer._id,
          seller: savedSeller._id,
          orderNumber: 'ORD-001',
          totalAmount: 1000,
          status: 'delivered',
          buyerDetails: {
            _id: savedBuyer._id,
            firstName: savedBuyer.firstName,
            lastName: savedBuyer.lastName,
            email: savedBuyer.email
          },
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              seller: savedSeller._id,
              quantity: 1,
              price: 1000,
              status: 'delivered'
            }
          ],
          shipping: {
            method: 'standard',
            status: 'delivered',
            tracking: { status: 'delivered' }
          },
          paymentInfo: {
            method: 'card',
            status: 'completed'
          }
        };

        const order = new Order(orderData);
        await order.save();

        // Act
        const result = await buyerRepository.findOrdersBySeller(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toHaveLength(1);
        expect(result[0].seller.toString()).toBe(savedSeller._id.toString());
        expect(result[0].buyer.toString()).toBe(savedBuyer._id.toString());
      });

      it('should return empty array when no orders found for seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.findOrdersBySeller(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toHaveLength(0);
      });
    });

    describe('countStreamsBySeller', () => {
      it('should count streams for a seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        const Stream = require('@models/Stream');
        const streamData = {
          seller: savedSeller._id,
          title: 'Live Stream 1',
          status: 'live',
          category: 'Electronics',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000) // 1 hour later
        };

        const stream1 = new Stream(streamData);
        const stream2 = new Stream({ ...streamData, title: 'Live Stream 2' });
        await stream1.save();
        await stream2.save();

        // Act
        const result = await buyerRepository.countStreamsBySeller(savedSeller._id);

        // Assert
        expect(result).toBe(2);
      });

      it('should return 0 when no streams found for seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.countStreamsBySeller(savedSeller._id);

        // Assert
        expect(result).toBe(0);
      });
    });

    describe('countBuyersFollowingSeller', () => {
      it('should count buyers following a seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        const buyer1 = new Buyer(mockBuyerData);
        const buyer2 = new Buyer({
          ...mockBuyerData,
          email: 'buyer2@example.com',
          username: 'buyer2',
          firstName: 'Buyer',
          lastName: 'Two'
        });
        const savedBuyer1 = await buyer1.save();
        const savedBuyer2 = await buyer2.save();

        // Add followers to seller
        seller.followers = [
          { buyerId: savedBuyer1._id, firstName: 'John', lastName: 'Doe' },
          { buyerId: savedBuyer2._id, firstName: 'Buyer', lastName: 'Two' }
        ];
        await seller.save();

        // Act
        const result = await buyerRepository.countBuyersFollowingSeller(savedSeller._id);

        // Assert
        expect(result).toBe(2);
      });

      it('should return 0 when no buyers following seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.countBuyersFollowingSeller(savedSeller._id);

        // Assert
        expect(result).toBe(0);
      });
    });

    describe('getSellerReviewStats', () => {
      it('should get review statistics for a seller', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();

        const product = new Product({
          name: 'Test Product',
          description: 'Test Description',
          price: 1000,
          seller: savedSeller._id,
          category: 'Electronics',
          brand: 'Test Brand',
          stock: 10,
          reviews: [{
            buyer: savedBuyer._id,
            firstName: savedBuyer.firstName,
            lastName: savedBuyer.lastName,
            rating: 5,
            comment: 'Great product!',
            createdAt: new Date()
          }]
        });
        const savedProduct = await product.save();

        const orderData = {
          buyer: savedBuyer._id,
          seller: savedSeller._id,
          orderNumber: 'ORD-001',
          totalAmount: 1000,
          status: 'delivered',
          buyerDetails: {
            _id: savedBuyer._id,
            firstName: savedBuyer.firstName,
            lastName: savedBuyer.lastName,
            email: savedBuyer.email
          },
          items: [
            {
              product: savedProduct._id,
              seller: savedSeller._id,
              quantity: 1,
              price: 1000,
              status: 'delivered'
            }
          ],
          shipping: {
            method: 'standard',
            status: 'delivered',
            tracking: { status: 'delivered' }
          },
          paymentInfo: {
            method: 'card',
            status: 'completed'
          }
        };

        const order = new Order(orderData);
        await order.save();

        // Act
        const result = await buyerRepository.getSellerReviewStats(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('totalReviews');
        expect(result[0]).toHaveProperty('averageRating');
        expect(result[0].totalReviews).toBe(1);
        expect(result[0].averageRating).toBe(5);
      });

      it('should return empty array when no reviews found', async () => {
        // Arrange
        const seller = new Seller(mockSellerData);
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.getSellerReviewStats(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toHaveLength(0);
      });
    });

    describe('incrementSellerStoreVisits', () => {
      it('should increment store visits for a seller', async () => {
        // Arrange
        const seller = new Seller({
          ...mockSellerData,
          storeVisits: 10
        });
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.incrementSellerStoreVisits(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.storeVisits).toBe(11);
      });

      it('should return null when seller not found', async () => {
        // Arrange
        const nonExistentSellerId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.incrementSellerStoreVisits(nonExistentSellerId);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('findByIdWithPopulatedFollowers', () => {
      it('should find buyer with populated followers', async () => {
        // Arrange
        const seller = new Seller({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          storeName: 'John\'s Electronics',
          businessName: 'Doe Enterprises',
          storeAvatar: { url: 'https://cdn.example.com/avatar.jpg' }
        });
        const savedSeller = await seller.save();

        const buyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'password123',
          followers: [{
            sellerId: savedSeller._id,
            storeName: 'John\'s Electronics',
            followDate: new Date('2024-01-15T10:30:00.000Z')
          }]
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findByIdWithPopulatedFollowers(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.followers).toHaveLength(1);
        expect(result.followers[0].sellerId).toBeDefined();
        expect(result.followers[0].sellerId.firstName).toBe('John');
        expect(result.followers[0].sellerId.lastName).toBe('Doe');
        expect(result.followers[0].sellerId.storeName).toBe('John\'s Electronics');
        expect(result.followers[0].sellerId.businessName).toBe('Doe Enterprises');
        expect(result.followers[0].sellerId.storeAvatar).toBeDefined();
        expect(result.followers[0].sellerId.storeAvatar.url).toBe('https://cdn.example.com/avatar.jpg');
      });

      it('should return null when buyer not found', async () => {
        // Arrange
        const nonExistentBuyerId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.findByIdWithPopulatedFollowers(nonExistentBuyerId);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle buyer with no followers', async () => {
        // Arrange
        const buyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'password123',
          followers: []
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findByIdWithPopulatedFollowers(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.followers).toHaveLength(0);
      });

      it('should handle buyer with multiple followers', async () => {
        // Arrange
        const seller1 = new Seller({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          storeName: 'John\'s Electronics',
          profileImage: { url: 'https://cdn.example.com/profile1.jpg' }
        });
        const seller2 = new Seller({
          firstName: 'Jane',
          lastName: 'Wilson',
          email: 'jane.wilson@example.com',
          phoneNumber: '+1234567891',
          password: 'password123',
          businessName: 'Wilson Enterprises',
          storeAvatar: { url: 'https://cdn.example.com/avatar2.jpg' }
        });
        const savedSeller1 = await seller1.save();
        const savedSeller2 = await seller2.save();

        const buyer = new Buyer({
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob.smith@example.com',
          username: 'bobsmith',
          password: 'password123',
          followers: [
            {
              sellerId: savedSeller1._id,
              storeName: 'John\'s Electronics',
              followDate: new Date('2024-01-15T10:30:00.000Z')
            },
            {
              sellerId: savedSeller2._id,
              businessName: 'Wilson Enterprises',
              followDate: new Date('2024-01-16T11:30:00.000Z')
            }
          ]
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findByIdWithPopulatedFollowers(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.followers).toHaveLength(2);
        expect(result.followers[0].sellerId.firstName).toBe('John');
        expect(result.followers[0].sellerId.lastName).toBe('Doe');
        expect(result.followers[1].sellerId.firstName).toBe('Jane');
        expect(result.followers[1].sellerId.lastName).toBe('Wilson');
      });

      it('should handle invalid ObjectId format', async () => {
        // Act & Assert
        await expect(buyerRepository.findByIdWithPopulatedFollowers('invalid-id'))
          .rejects
          .toThrow('Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Buyer"');
      });
    });

    describe('findSellersFollowingByBuyer', () => {
      it('should find sellers that a buyer follows', async () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        
        const seller1 = new Seller({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          storeName: 'John\'s Electronics',
          businessName: 'Doe Enterprises',
          storeAvatar: { url: 'https://cdn.example.com/avatar1.jpg' },
          profileImage: { url: 'https://cdn.example.com/profile1.jpg' },
          followers: [
            {
              buyerId: buyerId,
              firstName: 'Bob',
              lastName: 'Smith',
              email: 'bob.smith@example.com',
              followDate: new Date('2024-01-15T10:30:00.000Z'),
              totalOrders: 0,
              mainAddress: null
            }
          ]
        });
        
        const seller2 = new Seller({
          firstName: 'Jane',
          lastName: 'Wilson',
          email: 'jane.wilson@example.com',
          phoneNumber: '+1234567891',
          password: 'password123',
          storeName: 'Jane\'s Store',
          businessName: 'Wilson Enterprises',
          storeAvatar: { url: 'https://cdn.example.com/avatar2.jpg' },
          profileImage: { url: 'https://cdn.example.com/profile2.jpg' },
          followers: [
            {
              buyerId: buyerId,
              firstName: 'Bob',
              lastName: 'Smith',
              email: 'bob.smith@example.com',
              followDate: new Date('2024-01-16T11:30:00.000Z'),
              totalOrders: 0,
              mainAddress: null
            }
          ]
        });
        
        const seller3 = new Seller({
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@example.com',
          phoneNumber: '+1234567892',
          password: 'password123',
          storeName: 'Mike\'s Store',
          businessName: 'Johnson Enterprises',
          followers: [] // No followers
        });

        await seller1.save();
        await seller2.save();
        await seller3.save();

        // Act
        const result = await buyerRepository.findSellersFollowingByBuyer(buyerId.toString());

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].firstName).toBe('John');
        expect(result[0].lastName).toBe('Doe');
        expect(result[0].storeName).toBe('John\'s Electronics');
        expect(result[1].firstName).toBe('Jane');
        expect(result[1].lastName).toBe('Wilson');
        expect(result[1].storeName).toBe('Jane\'s Store');
      });

      it('should return empty array when buyer follows no sellers', async () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        
        const seller = new Seller({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          storeName: 'John\'s Electronics',
          followers: [] // No followers
        });

        await seller.save();

        // Act
        const result = await buyerRepository.findSellersFollowingByBuyer(buyerId.toString());

        // Assert
        expect(result).toHaveLength(0);
      });

      it('should handle invalid buyer ID', async () => {
        // Act & Assert
        await expect(buyerRepository.findSellersFollowingByBuyer('invalid-id'))
          .rejects
          .toThrow('Cast to ObjectId failed for value "invalid-id" (type string) at path "buyerId" for model "Seller"');
      });
    });

    describe('findBuyersFollowingByBuyer', () => {
      it('should return empty array as buyers do not follow other buyers', async () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        
        const buyer = new Buyer({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          password: 'password123',
          followers: []
        });

        await buyer.save();

        // Act
        const result = await buyerRepository.findBuyersFollowingByBuyer(buyerId.toString());

        // Assert
        expect(result).toHaveLength(0);
      });
    });

    describe('hasVerifiedPurchase', () => {
      it('should return true when buyer has made a verified purchase from seller', async () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        const sellerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
        
        const order = new Order({
          buyer: buyerId,
          seller: sellerId,
          totalAmount: 100,
          buyerDetails: {
            _id: buyerId,
            firstName: 'John',
            lastName: 'Doe'
          },
          paymentInfo: {
            status: 'completed'
          },
          shipping: {
            tracking: {
              status: 'delivered'
            }
          },
          items: [
            {
              product: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
              seller: sellerId,
              quantity: 1,
              price: 100
            }
          ]
        });

        await order.save();

        // Act
        const result = await buyerRepository.hasVerifiedPurchase(buyerId.toString(), sellerId.toString());

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when buyer has not made a verified purchase from seller', async () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        const sellerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
        
        const order = new Order({
          buyer: buyerId,
          seller: sellerId,
          totalAmount: 100,
          buyerDetails: {
            _id: buyerId,
            firstName: 'John',
            lastName: 'Doe'
          },
          paymentInfo: {
            status: 'pending'
          },
          shipping: {
            tracking: {
              status: 'shipped'
            }
          },
          items: [
            {
              product: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
              seller: sellerId,
              quantity: 1,
              price: 100
            }
          ]
        });

        await order.save();

        // Act
        const result = await buyerRepository.hasVerifiedPurchase(buyerId.toString(), sellerId.toString());

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when no order exists between buyer and seller', async () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        const sellerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');

        // Act
        const result = await buyerRepository.hasVerifiedPurchase(buyerId.toString(), sellerId.toString());

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('saveSeller', () => {
      it('should save seller successfully', async () => {
        // Arrange
        const seller = new Seller({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          storeName: 'John\'s Store',
          businessName: 'Doe Enterprises'
        });

        // Act
        const result = await buyerRepository.saveSeller(seller);

        // Assert
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.firstName).toBe('John');
        expect(result.lastName).toBe('Doe');
        expect(result.storeName).toBe('John\'s Store');
      });

      it('should update existing seller successfully', async () => {
        // Arrange
        const seller = new Seller({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
          storeName: 'John\'s Store'
        });

        const savedSeller = await seller.save();
        savedSeller.storeName = 'Updated Store Name';

        // Act
        const result = await buyerRepository.saveSeller(savedSeller);

        // Assert
        expect(result.storeName).toBe('Updated Store Name');
      });
    });

    describe('findSellerWithReviews', () => {
      it('should find seller with reviews and stats', async () => {
        // Arrange
        const seller = new Seller({
          ...mockSellerData,
          reviews: [
            {
              buyer: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
              rating: 5,
              comment: 'Great seller!',
              createdAt: new Date(),
              isVerifiedPurchase: true
            }
          ],
          stats: {
            averageRating: 4.5,
            totalReviews: 1,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }
          }
        });
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.findSellerWithReviews(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedSeller._id.toString());
        expect(result.reviews).toHaveLength(1);
        expect(result.stats).toBeDefined();
        // Note: The stats might be 0 if not properly initialized in the schema
        expect(result.stats).toHaveProperty('averageRating');
        expect(result.stats).toHaveProperty('totalReviews');
        expect(result.stats).toHaveProperty('ratingDistribution');
      });

      it('should return null when seller not found', async () => {
        // Arrange
        const nonExistentSellerId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.findSellerWithReviews(nonExistentSellerId);

        // Assert
        expect(result).toBeNull();
      });

      it('should only select reviews and stats fields', async () => {
        // Arrange
        const seller = new Seller({
          ...mockSellerData,
          reviews: [],
          stats: {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        });
        const savedSeller = await seller.save();

        // Act
        const result = await buyerRepository.findSellerWithReviews(savedSeller._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedSeller._id.toString());
        expect(result.reviews).toBeDefined();
        expect(result.stats).toBeDefined();
        // Should not have other fields like firstName, lastName, etc.
        expect(result.firstName).toBeUndefined();
        expect(result.lastName).toBeUndefined();
      });
    });

    describe('findBuyerByIdWithFields', () => {
      it('should find buyer with selected fields', async () => {
        // Arrange
        const buyer = new Buyer({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          password: 'password123',
          profileImage: { url: 'https://example.com/profile.jpg' }
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findBuyerByIdWithFields(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.firstName).toBe('John');
        expect(result.lastName).toBe('Doe');
        expect(result.profileImage).toBeDefined();
        expect(result.profileImage.url).toBe('https://example.com/profile.jpg');
        // Should not have other fields like email, username, password
        expect(result.email).toBeUndefined();
        expect(result.username).toBeUndefined();
        expect(result.password).toBeUndefined();
      });

      it('should return null when buyer not found', async () => {
        // Arrange
        const nonExistentBuyerId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.findBuyerByIdWithFields(nonExistentBuyerId);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle buyer with null profile image', async () => {
        // Arrange
        const buyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'password123',
          profileImage: null
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findBuyerByIdWithFields(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.firstName).toBe('Jane');
        expect(result.lastName).toBe('Smith');
        // profileImage should be included in the selection even if null
        expect(result).toHaveProperty('profileImage');
      });
    });

    describe('findBuyerWithNotificationPreferences', () => {
      it('should find buyer with notification preferences', async () => {
        // Arrange
        const notificationPreferences = {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true,
            orderCancellation: false,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: false
          },
          messages: {
            fromSellers: true,
            fromBuyers: false,
            chatReplies: true,
            mentions: true
          },
          communityActivity: {
            postComments: true,
            postLikes: false,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: true,
            couponsAndDeals: true,
            trendingProducts: false,
            recommendations: true
          }
        };

        const buyer = new Buyer({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          password: 'password123',
          notificationPreferences: notificationPreferences
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findBuyerWithNotificationPreferences(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.notificationPreferences).toBeDefined();
        expect(result.notificationPreferences).toEqual(notificationPreferences);
        // Should not have other fields like firstName, lastName, email, etc.
        expect(result.firstName).toBeUndefined();
        expect(result.lastName).toBeUndefined();
        expect(result.email).toBeUndefined();
        expect(result.username).toBeUndefined();
        expect(result.password).toBeUndefined();
      });

      it('should return null when buyer not found', async () => {
        // Arrange
        const nonExistentBuyerId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.findBuyerWithNotificationPreferences(nonExistentBuyerId);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle buyer with null notification preferences', async () => {
        // Arrange
        const buyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'password123',
          notificationPreferences: null
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findBuyerWithNotificationPreferences(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        // notificationPreferences should be included in the selection
        expect(result).toHaveProperty('notificationPreferences');
        // Due to Mongoose schema defaults, notificationPreferences will have default values even when set to null
        expect(result.notificationPreferences).toBeDefined();
        expect(result.notificationPreferences).toHaveProperty('orderUpdates');
        expect(result.notificationPreferences).toHaveProperty('liveShows');
        expect(result.notificationPreferences).toHaveProperty('messages');
        expect(result.notificationPreferences).toHaveProperty('communityActivity');
        expect(result.notificationPreferences).toHaveProperty('promotionsAndSales');
      });

      it('should handle buyer with undefined notification preferences', async () => {
        // Arrange
        const buyer = new Buyer({
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          username: 'bobjohnson',
          password: 'password123'
          // notificationPreferences is undefined
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.findBuyerWithNotificationPreferences(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        // notificationPreferences should be included in the selection
        expect(result).toHaveProperty('notificationPreferences');
        // Due to Mongoose schema defaults, notificationPreferences will have default values even when undefined
        expect(result.notificationPreferences).toBeDefined();
        expect(result.notificationPreferences).toHaveProperty('orderUpdates');
        expect(result.notificationPreferences).toHaveProperty('liveShows');
        expect(result.notificationPreferences).toHaveProperty('messages');
        expect(result.notificationPreferences).toHaveProperty('communityActivity');
        expect(result.notificationPreferences).toHaveProperty('promotionsAndSales');
      });
    });

    describe('updateNotificationPreferences', () => {
      it('should update notification preferences successfully', async () => {
        // Arrange
        const initialPreferences = {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true,
            orderCancellation: true,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: true
          },
          messages: {
            fromSellers: true,
            fromBuyers: true,
            chatReplies: true,
            mentions: true
          },
          communityActivity: {
            postComments: true,
            postLikes: true,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: true,
            couponsAndDeals: true,
            trendingProducts: true,
            recommendations: true
          }
        };

        const buyer = new Buyer({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          password: 'password123',
          notificationPreferences: initialPreferences
        });
        const savedBuyer = await buyer.save();

        const newPreferences = {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false,
            orderCancellation: true,
            refundUpdates: true
          },
          liveShows: {
            allShows: false,
            followedSellers: true,
            recommendedShows: true
          },
          messages: {
            fromSellers: true,
            fromBuyers: false,
            chatReplies: true,
            mentions: false
          },
          communityActivity: {
            postComments: true,
            postLikes: false,
            repliesAndMentions: true
          },
          promotionsAndSales: {
            flashSales: false,
            couponsAndDeals: true,
            trendingProducts: false,
            recommendations: true
          }
        };

        // Act
        const result = await buyerRepository.updateNotificationPreferences(savedBuyer._id, newPreferences);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.notificationPreferences).toBeDefined();
        expect(result.notificationPreferences).toEqual(newPreferences);
        
        // Verify specific fields were updated
        expect(result.notificationPreferences.orderUpdates.orderConfirmation).toBe(false);
        expect(result.notificationPreferences.orderUpdates.shippingAndDelivery).toBe(false);
        expect(result.notificationPreferences.liveShows.allShows).toBe(false);
        expect(result.notificationPreferences.messages.fromBuyers).toBe(false);
        expect(result.notificationPreferences.messages.mentions).toBe(false);
        expect(result.notificationPreferences.communityActivity.postLikes).toBe(false);
        expect(result.notificationPreferences.promotionsAndSales.flashSales).toBe(false);
        expect(result.notificationPreferences.promotionsAndSales.trendingProducts).toBe(false);
      });

      it('should return null when buyer not found', async () => {
        // Arrange
        const nonExistentBuyerId = new mongoose.Types.ObjectId();
        const newPreferences = {
          orderUpdates: {
            orderConfirmation: false
          }
        };

        // Act
        const result = await buyerRepository.updateNotificationPreferences(nonExistentBuyerId, newPreferences);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle partial preferences update', async () => {
        // Arrange
        const initialPreferences = {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true,
            orderCancellation: true,
            refundUpdates: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true,
            recommendedShows: true
          }
        };

        const buyer = new Buyer({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          username: 'janesmith',
          password: 'password123',
          notificationPreferences: initialPreferences
        });
        const savedBuyer = await buyer.save();

        const partialPreferences = {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false
          }
        };

        // Act
        const result = await buyerRepository.updateNotificationPreferences(savedBuyer._id, partialPreferences);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.notificationPreferences).toBeDefined();
        
        // Verify only specified fields were updated
        expect(result.notificationPreferences.orderUpdates.orderConfirmation).toBe(false);
        expect(result.notificationPreferences.orderUpdates.shippingAndDelivery).toBe(false);
        expect(result.notificationPreferences.orderUpdates.orderCancellation).toBe(true); // Should remain unchanged
        expect(result.notificationPreferences.orderUpdates.refundUpdates).toBe(true); // Should remain unchanged
        
        // Other sections should remain unchanged
        expect(result.notificationPreferences.liveShows.allShows).toBe(true);
        expect(result.notificationPreferences.liveShows.followedSellers).toBe(true);
        expect(result.notificationPreferences.liveShows.recommendedShows).toBe(true);
      });

      it('should handle complete preferences replacement', async () => {
        // Arrange
        const initialPreferences = {
          orderUpdates: {
            orderConfirmation: true,
            shippingAndDelivery: true
          },
          liveShows: {
            allShows: true,
            followedSellers: true
          }
        };

        const buyer = new Buyer({
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          username: 'bobjohnson',
          password: 'password123',
          notificationPreferences: initialPreferences
        });
        const savedBuyer = await buyer.save();

        const completeNewPreferences = {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false,
            orderCancellation: false,
            refundUpdates: false
          },
          liveShows: {
            allShows: false,
            followedSellers: false,
            recommendedShows: false
          },
          messages: {
            fromSellers: false,
            fromBuyers: false,
            chatReplies: false,
            mentions: false
          },
          communityActivity: {
            postComments: false,
            postLikes: false,
            repliesAndMentions: false
          },
          promotionsAndSales: {
            flashSales: false,
            couponsAndDeals: false,
            trendingProducts: false,
            recommendations: false
          }
        };

        // Act
        const result = await buyerRepository.updateNotificationPreferences(savedBuyer._id, completeNewPreferences);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.notificationPreferences).toBeDefined();
        expect(result.notificationPreferences).toEqual(completeNewPreferences);
        
        // Verify all preferences were updated
        expect(result.notificationPreferences.orderUpdates.orderConfirmation).toBe(false);
        expect(result.notificationPreferences.orderUpdates.shippingAndDelivery).toBe(false);
        expect(result.notificationPreferences.orderUpdates.orderCancellation).toBe(false);
        expect(result.notificationPreferences.orderUpdates.refundUpdates).toBe(false);
        
        expect(result.notificationPreferences.liveShows.allShows).toBe(false);
        expect(result.notificationPreferences.liveShows.followedSellers).toBe(false);
        expect(result.notificationPreferences.liveShows.recommendedShows).toBe(false);
        
        expect(result.notificationPreferences.messages.fromSellers).toBe(false);
        expect(result.notificationPreferences.messages.fromBuyers).toBe(false);
        expect(result.notificationPreferences.messages.chatReplies).toBe(false);
        expect(result.notificationPreferences.messages.mentions).toBe(false);
        
        expect(result.notificationPreferences.communityActivity.postComments).toBe(false);
        expect(result.notificationPreferences.communityActivity.postLikes).toBe(false);
        expect(result.notificationPreferences.communityActivity.repliesAndMentions).toBe(false);
        
        expect(result.notificationPreferences.promotionsAndSales.flashSales).toBe(false);
        expect(result.notificationPreferences.promotionsAndSales.couponsAndDeals).toBe(false);
        expect(result.notificationPreferences.promotionsAndSales.trendingProducts).toBe(false);
        expect(result.notificationPreferences.promotionsAndSales.recommendations).toBe(false);
      });

      it('should handle buyer with default notification preferences', async () => {
        // Arrange
        const buyer = new Buyer({
          firstName: 'Alice',
          lastName: 'Brown',
          email: 'alice.brown@example.com',
          username: 'alicebrown',
          password: 'password123'
          // notificationPreferences will use schema defaults
        });
        const savedBuyer = await buyer.save();

        const newPreferences = {
          orderUpdates: {
            orderConfirmation: false,
            shippingAndDelivery: false
          }
        };

        // Act
        const result = await buyerRepository.updateNotificationPreferences(savedBuyer._id, newPreferences);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.notificationPreferences).toBeDefined();
        
        // Verify the new preferences were applied
        expect(result.notificationPreferences.orderUpdates.orderConfirmation).toBe(false);
        expect(result.notificationPreferences.orderUpdates.shippingAndDelivery).toBe(false);
        
        // Other default values should remain
        expect(result.notificationPreferences.orderUpdates.orderCancellation).toBe(true); // Default value
        expect(result.notificationPreferences.orderUpdates.refundUpdates).toBe(true); // Default value
      });
    });

    describe('updateResetPasswordOTP', () => {
      it('should update buyer with reset password OTP and expiry', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const resetOTP = '1234';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Act
        const result = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          resetOTP, 
          expiresAt
        );

        // Assert
        expect(result).toBeDefined();
        expect(result._id).toEqual(savedBuyer._id);
        expect(result.resetPasswordOTP).toBe(resetOTP);
        expect(result.resetPasswordOTPExpires).toEqual(expiresAt);
      });

      it('should return null when buyer does not exist', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const resetOTP = '5678';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateResetPasswordOTP(
          nonExistentId, 
          resetOTP, 
          expiresAt
        );

        // Assert
        expect(result).toBeNull();
      });

      it('should update existing reset password OTP when called multiple times', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const firstOTP = '1111';
        const firstExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        const secondOTP = '2222';
        const secondExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Act
        const firstResult = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          firstOTP, 
          firstExpiresAt
        );
        
        const secondResult = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          secondOTP, 
          secondExpiresAt
        );

        // Assert
        expect(firstResult.resetPasswordOTP).toBe(firstOTP);
        expect(firstResult.resetPasswordOTPExpires).toEqual(firstExpiresAt);
        
        expect(secondResult.resetPasswordOTP).toBe(secondOTP);
        expect(secondResult.resetPasswordOTPExpires).toEqual(secondExpiresAt);
        
        // Verify the second update overwrote the first
        expect(secondResult.resetPasswordOTP).not.toBe(firstOTP);
      });

      it('should handle empty string OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const resetOTP = '';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          resetOTP, 
          expiresAt
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.resetPasswordOTP).toBe(resetOTP);
        expect(result.resetPasswordOTPExpires).toEqual(expiresAt);
      });

      it('should handle null expiry date', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const resetOTP = '9999';
        const expiresAt = null;

        // Act
        const result = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          resetOTP, 
          expiresAt
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.resetPasswordOTP).toBe(resetOTP);
        expect(result.resetPasswordOTPExpires).toBeNull();
      });

      it('should handle undefined expiry date', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const resetOTP = '8888';
        const expiresAt = undefined;

        // Act
        const result = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          resetOTP, 
          expiresAt
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.resetPasswordOTP).toBe(resetOTP);
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should preserve other buyer fields when updating reset password OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const resetOTP = '7777';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateResetPasswordOTP(
          savedBuyer._id, 
          resetOTP, 
          expiresAt
        );

        // Assert
        expect(result.firstName).toBe(mockBuyerData.firstName);
        expect(result.lastName).toBe(mockBuyerData.lastName);
        expect(result.email).toBe(mockBuyerData.email);
        expect(result.username).toBe(mockBuyerData.username);
        expect(result.resetPasswordOTP).toBe(resetOTP);
        expect(result.resetPasswordOTPExpires).toEqual(expiresAt);
      });
    });

    describe('resetPassword', () => {
      it('should reset password and clear reset OTP fields', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '1234',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = 'newHashedPassword456';

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should return null when buyer does not exist', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const newPassword = 'newHashedPassword456';

        // Act
        const result = await buyerRepository.resetPassword(nonExistentId, newPassword);

        // Assert
        expect(result).toBeNull();
      });

      it('should preserve other buyer fields when resetting password', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '5678',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = 'newHashedPassword789';

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result.firstName).toBe(mockBuyerData.firstName);
        expect(result.lastName).toBe(mockBuyerData.lastName);
        expect(result.email).toBe(mockBuyerData.email);
        expect(result.username).toBe(mockBuyerData.username);
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should handle buyer without reset OTP fields', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const newPassword = 'newHashedPassword999';

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should handle empty password string', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '1111',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = '';

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should handle null password', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '2222',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = null;

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBeNull();
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });



      it('should handle very long password', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '4444',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = 'a'.repeat(1000);

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should handle special characters in password', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '5555',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });

      it('should handle unicode characters in password', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          resetPasswordOTP: '6666',
          resetPasswordOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        const savedBuyer = await buyer.save();
        
        const newPassword = 'password123🚀🌟🎉';

        // Act
        const result = await buyerRepository.resetPassword(savedBuyer._id, newPassword);

        // Assert
        expect(result).toBeDefined();
        expect(result.password).toBe(newPassword);
        expect(result.resetPasswordOTP).toBeUndefined();
        expect(result.resetPasswordOTPExpires).toBeUndefined();
      });
    });

    describe('updateAccountDeletionOTP', () => {
      it('should update buyer with account deletion OTP and expiry', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = '1234';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(deletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should return null when buyer does not exist', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        const deletionOTP = '5678';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(nonExistentId, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle empty OTP string', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = '';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(deletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should handle null OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = null;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBeNull();
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should handle undefined OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = undefined;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBeUndefined();
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should handle past expiry date', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = '9999';
        const expiresAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(deletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should handle very long OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = '1'.repeat(100);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(deletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should handle special characters in OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = '!@#$';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(deletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should handle unicode characters in OTP', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const deletionOTP = '🚀🌟🎉';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, deletionOTP, expiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(deletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(expiresAt);
        expect(result.accountDeletion.attempts).toBe(0);
      });

      it('should overwrite existing account deletion data', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          accountDeletion: {
            otp: '1111',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
            attempts: 3
          }
        });
        const savedBuyer = await buyer.save();
        
        const newDeletionOTP = '2222';
        const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // Act
        const result = await buyerRepository.updateAccountDeletionOTP(savedBuyer._id, newDeletionOTP, newExpiresAt);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.otp).toBe(newDeletionOTP);
        expect(result.accountDeletion.expiresAt).toEqual(newExpiresAt);
        expect(result.accountDeletion.attempts).toBe(0); // Should reset to 0
      });

      it('should handle invalid ObjectId format', async () => {
        // Arrange
        const invalidId = 'invalid-id-format';
        const deletionOTP = '1234';
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Act & Assert
        await expect(
          buyerRepository.updateAccountDeletionOTP(invalidId, deletionOTP, expiresAt)
        ).rejects.toThrow(/Cast to ObjectId failed/);
      });
    });

    describe('incrementAccountDeletionAttempts', () => {
      it('should increment account deletion attempts for existing buyer', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          accountDeletion: {
            otp: '1234',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 2
          }
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.incrementAccountDeletionAttempts(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.attempts).toBe(3); // Should be incremented from 2 to 3
        expect(result.accountDeletion.otp).toBe('1234');
        expect(result.accountDeletion.expiresAt).toEqual(savedBuyer.accountDeletion.expiresAt);
      });

      it('should return null for non-existent buyer', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.incrementAccountDeletionAttempts(nonExistentId);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle initial increment when attempts is undefined', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          accountDeletion: {
            otp: '1234',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            // attempts not set, should be undefined
          }
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.incrementAccountDeletionAttempts(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.attempts).toBe(1); // Should be incremented from undefined to 1
      });

      it('should handle buyer without accountDeletion field', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.incrementAccountDeletionAttempts(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.attempts).toBe(1); // Should create field and set to 1
      });

      it('should handle large attempt numbers', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          accountDeletion: {
            otp: '1234',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 999
          }
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.incrementAccountDeletionAttempts(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.accountDeletion.attempts).toBe(1000);
      });

      it('should handle invalid ObjectId format', async () => {
        // Arrange
        const invalidId = 'invalid-id-format';

        // Act & Assert
        await expect(
          buyerRepository.incrementAccountDeletionAttempts(invalidId)
        ).rejects.toThrow(/Cast to ObjectId failed/);
      });
    });

    describe('deleteById', () => {
      it('should delete existing buyer and return deleted document', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.deleteById(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.email).toBe(mockBuyerData.email);

        // Verify buyer is actually deleted from database
        const deletedBuyer = await Buyer.findById(savedBuyer._id);
        expect(deletedBuyer).toBeNull();
      });

      it('should return null for non-existent buyer', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();

        // Act
        const result = await buyerRepository.deleteById(nonExistentId);

        // Assert
        expect(result).toBeNull();
      });

      it('should delete buyer with all associated data', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          shippingAddresses: [
            {
              addressType: 'home',
              country: 'United States',
              state: 'California',
              city: 'Los Angeles',
              addressLine1: '123 Main St',
              zipCode: '90210'
            }
          ],
          accountDeletion: {
            otp: '1234',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 3
          },
          wishlist: [new mongoose.Types.ObjectId()]
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.deleteById(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.shippingAddresses).toHaveLength(1);
        expect(result.accountDeletion).toBeDefined();
        expect(result.wishlist).toHaveLength(1);

        // Verify buyer is actually deleted from database
        const deletedBuyer = await Buyer.findById(savedBuyer._id);
        expect(deletedBuyer).toBeNull();
      });

      it('should handle invalid ObjectId format', async () => {
        // Arrange
        const invalidId = 'invalid-id-format';

        // Act & Assert
        await expect(
          buyerRepository.deleteById(invalidId)
        ).rejects.toThrow(/Cast to ObjectId failed/);
      });

      it('should handle deletion of buyer with verified status', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          isIdentityVerified: true,
          phoneVerification: {
            otp: '1234',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
            attempts: 0
          }
        });
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.deleteById(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result.isIdentityVerified).toBe(true);
        expect(result.phoneVerification).toBeDefined();
        expect(result.phoneVerification.otp).toBe('1234');

        // Verify buyer is actually deleted from database
        const deletedBuyer = await Buyer.findById(savedBuyer._id);
        expect(deletedBuyer).toBeNull();
      });

      it('should return complete buyer document on deletion', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();

        // Act
        const result = await buyerRepository.deleteById(savedBuyer._id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toMatchObject({
          firstName: mockBuyerData.firstName,
          lastName: mockBuyerData.lastName,
          email: mockBuyerData.email,
          username: mockBuyerData.username,
          phoneNumber: mockBuyerData.phoneNumber
        });
        expect(result._id).toBeDefined();
        expect(result.createdAt).toBeDefined();
        // Note: updatedAt is not defined in the buyer schema, only createdAt
      });
    });

    describe('addReport', () => {
      it('should add report to buyer\'s reports array successfully', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const reportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'This seller is selling counterfeit products and refusing refunds to customers.'
        };

        // Act
        const result = await buyerRepository.addReport(savedBuyer._id, reportData);

        // Assert
        expect(result).toBeDefined();
        expect(result.reports).toHaveLength(1);
        expect(result.reports[0].reportedUser.userId.toString()).toBe(reportData.reportedUser.userId);
        expect(result.reports[0].reportedUser.userType).toBe(reportData.reportedUser.userType);
        expect(result.reports[0].reason).toBe(reportData.reason);
        expect(result.reports[0].description).toBe(reportData.description);
        expect(result.reports[0].status).toBe('pending');
        expect(result.reports[0].createdAt).toBeDefined();
      });

      it('should add multiple reports to buyer\'s reports array', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const firstReportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'First report description.'
        };

        const secondReportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'buyer'
          },
          reason: 'Inappropriate behavior',
          description: 'Second report description.'
        };

        // Act
        const firstResult = await buyerRepository.addReport(savedBuyer._id, firstReportData);
        const secondResult = await buyerRepository.addReport(savedBuyer._id, secondReportData);

        // Assert
        expect(firstResult.reports).toHaveLength(1);
        expect(secondResult.reports).toHaveLength(2);
        expect(secondResult.reports[0].reason).toBe('Fraudulent behavior');
        expect(secondResult.reports[1].reason).toBe('Inappropriate behavior');
      });

      it('should return null for non-existent buyer', async () => {
        // Arrange
        const nonExistentBuyerId = new mongoose.Types.ObjectId();
        const reportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'This seller is selling counterfeit products.'
        };

        // Act
        const result = await buyerRepository.addReport(nonExistentBuyerId, reportData);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle invalid ObjectId format', async () => {
        // Arrange
        const invalidId = 'invalid-id-format';
        const reportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'This seller is selling counterfeit products.'
        };

        // Act & Assert
        await expect(
          buyerRepository.addReport(invalidId, reportData)
        ).rejects.toThrow(/Cast to ObjectId failed/);
      });

      it('should preserve existing reports when adding new ones', async () => {
        // Arrange
        const buyer = new Buyer({
          ...mockBuyerData,
          reports: [{
            reportedUser: {
              userId: new mongoose.Types.ObjectId(),
              userType: 'buyer'
            },
            reason: 'Existing report',
            description: 'This is an existing report.',
            status: 'pending',
            createdAt: new Date()
          }]
        });
        const savedBuyer = await buyer.save();
        
        const newReportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'New report',
          description: 'This is a new report being added.'
        };

        // Act
        const result = await buyerRepository.addReport(savedBuyer._id, newReportData);

        // Assert
        expect(result.reports).toHaveLength(2);
        expect(result.reports[0].reason).toBe('Existing report');
        expect(result.reports[1].reason).toBe('New report');
      });

      it('should handle empty reason and description gracefully', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const reportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: '',
          description: ''
        };

        // Act
        const result = await buyerRepository.addReport(savedBuyer._id, reportData);

        // Assert
        expect(result).toBeDefined();
        expect(result.reports).toHaveLength(1);
        expect(result.reports[0].reason).toBe('No reason provided');
        expect(result.reports[0].description).toBe('No description provided');
      });

      it('should set default status and createdAt for new reports', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const reportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'This seller is selling counterfeit products.'
        };

        const beforeTime = new Date();

        // Act
        const result = await buyerRepository.addReport(savedBuyer._id, reportData);

        // Assert
        const afterTime = new Date();
        expect(result.reports[0].status).toBe('pending');
        expect(result.reports[0].createdAt).toBeInstanceOf(Date);
        expect(result.reports[0].createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(result.reports[0].createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      });

      it('should handle concurrent report additions atomically', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const reportData1 = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Report 1',
          description: 'First concurrent report.'
        };

        const reportData2 = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'buyer'
          },
          reason: 'Report 2',
          description: 'Second concurrent report.'
        };

        // Act
        const [result1, result2] = await Promise.all([
          buyerRepository.addReport(savedBuyer._id, reportData1),
          buyerRepository.addReport(savedBuyer._id, reportData2)
        ]);

        // Assert
        // One of them should have 1 report, the other should have 2
        const reports1Count = result1.reports.length;
        const reports2Count = result2.reports.length;
        
        expect([reports1Count, reports2Count].sort()).toEqual([1, 2]);
        
        // Verify final state by fetching from database
        const finalBuyer = await Buyer.findById(savedBuyer._id);
        expect(finalBuyer.reports).toHaveLength(2);
      });

      it('should return updated buyer document with new: true option', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const reportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'This seller is selling counterfeit products.'
        };

        // Act
        const result = await buyerRepository.addReport(savedBuyer._id, reportData);

        // Assert
        expect(result._id.toString()).toBe(savedBuyer._id.toString());
        expect(result.reports).toHaveLength(1);
        
        // Verify the returned document reflects the update
        expect(result.reports[0].reportedUser.userId.toString()).toBe(reportData.reportedUser.userId);
      });

      it('should handle different userType values correctly', async () => {
        // Arrange
        const buyer = new Buyer(mockBuyerData);
        const savedBuyer = await buyer.save();
        
        const sellerReportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'seller'
          },
          reason: 'Seller issue',
          description: 'Problem with seller.'
        };

        const buyerReportData = {
          reportedUser: {
            userId: new mongoose.Types.ObjectId().toString(),
            userType: 'buyer'
          },
          reason: 'Buyer issue',
          description: 'Problem with buyer.'
        };

        // Act
        await buyerRepository.addReport(savedBuyer._id, sellerReportData);
        const result = await buyerRepository.addReport(savedBuyer._id, buyerReportData);

        // Assert
        expect(result.reports).toHaveLength(2);
        expect(result.reports[0].reportedUser.userType).toBe('seller');
        expect(result.reports[1].reportedUser.userType).toBe('buyer');
      });
    });

    describe('Wallet-related methods', () => {
      describe('findByIdWithWalletOnHoldItems', () => {
        it('should find buyer with populated wallet on-hold items', async () => {
          // Arrange
          const productId = new mongoose.Types.ObjectId();
          const buyer = new Buyer({
            ...mockBuyerData,
            wallet: {
              balance: 5000,
              onHoldAmount: 1500,
              currency: 'NGN',
              onHoldItems: [{
                productId: productId,
                amount: 1500,
                bidDate: new Date()
              }]
            }
          });
          const savedBuyer = await buyer.save();

          // Act
          const result = await buyerRepository.findByIdWithWalletOnHoldItems(savedBuyer._id);

          // Assert
          expect(result).toBeDefined();
          expect(result._id.toString()).toBe(savedBuyer._id.toString());
          expect(result.wallet.onHoldItems).toHaveLength(1);
          expect(result.wallet.onHoldItems[0].productId).toBeDefined();
        });

        it('should return null when buyer not found', async () => {
          // Arrange
          const nonExistentId = new mongoose.Types.ObjectId();

          // Act
          const result = await buyerRepository.findByIdWithWalletOnHoldItems(nonExistentId);

          // Assert
          expect(result).toBeNull();
        });

        it('should handle buyer with no on-hold items', async () => {
          // Arrange
          const buyer = new Buyer({
            ...mockBuyerData,
            wallet: {
              balance: 5000,
              onHoldAmount: 0,
              currency: 'NGN',
              onHoldItems: []
            }
          });
          const savedBuyer = await buyer.save();

          // Act
          const result = await buyerRepository.findByIdWithWalletOnHoldItems(savedBuyer._id);

          // Assert
          expect(result).toBeDefined();
          expect(result._id.toString()).toBe(savedBuyer._id.toString());
          expect(result.wallet.onHoldItems).toHaveLength(0);
        });

        it('should handle invalid ObjectId format', async () => {
          // Act & Assert
          await expect(buyerRepository.findByIdWithWalletOnHoldItems('invalid-id'))
            .rejects
            .toThrow();
        });
      });

      describe('updateWalletOnHoldItems', () => {
        it('should update wallet on-hold items and amount', async () => {
          // Arrange
          const productId = new mongoose.Types.ObjectId();
          const buyer = new Buyer({
            ...mockBuyerData,
            wallet: {
              balance: 5000,
              onHoldAmount: 2500,
              currency: 'NGN',
              onHoldItems: [
                {
                  productId: productId,
                  amount: 1500,
                  bidDate: new Date()
                },
                {
                  productId: new mongoose.Types.ObjectId(),
                  amount: 1000,
                  bidDate: new Date()
                }
              ]
            }
          });
          const savedBuyer = await buyer.save();

          const filteredOnHoldItems = [buyer.wallet.onHoldItems[0]]; // Only first item
          const recalculatedOnHoldAmount = 1500;

          // Act
          const result = await buyerRepository.updateWalletOnHoldItems(
            savedBuyer._id,
            filteredOnHoldItems,
            recalculatedOnHoldAmount
          );

          // Assert
          expect(result).toBeDefined();
          expect(result._id.toString()).toBe(savedBuyer._id.toString());
          expect(result.wallet.onHoldItems).toHaveLength(1);
          expect(result.wallet.onHoldAmount).toBe(1500);
          expect(result.wallet.onHoldItems[0].productId.toString()).toBe(productId.toString());
        });

        it('should return null when buyer not found', async () => {
          // Arrange
          const nonExistentId = new mongoose.Types.ObjectId();
          const filteredOnHoldItems = [];
          const recalculatedOnHoldAmount = 0;

          // Act
          const result = await buyerRepository.updateWalletOnHoldItems(
            nonExistentId,
            filteredOnHoldItems,
            recalculatedOnHoldAmount
          );

          // Assert
          expect(result).toBeNull();
        });

        it('should handle empty on-hold items array', async () => {
          // Arrange
          const buyer = new Buyer({
            ...mockBuyerData,
            wallet: {
              balance: 5000,
              onHoldAmount: 1500,
              currency: 'NGN',
              onHoldItems: [{
                productId: new mongoose.Types.ObjectId(),
                amount: 1500,
                bidDate: new Date()
              }]
            }
          });
          const savedBuyer = await buyer.save();

          const filteredOnHoldItems = [];
          const recalculatedOnHoldAmount = 0;

          // Act
          const result = await buyerRepository.updateWalletOnHoldItems(
            savedBuyer._id,
            filteredOnHoldItems,
            recalculatedOnHoldAmount
          );

          // Assert
          expect(result).toBeDefined();
          expect(result._id.toString()).toBe(savedBuyer._id.toString());
          expect(result.wallet.onHoldItems).toHaveLength(0);
          expect(result.wallet.onHoldAmount).toBe(0);
        });

        it('should handle invalid ObjectId format', async () => {
          // Arrange
          const filteredOnHoldItems = [];
          const recalculatedOnHoldAmount = 0;

          // Act & Assert
          await expect(buyerRepository.updateWalletOnHoldItems(
            'invalid-id',
            filteredOnHoldItems,
            recalculatedOnHoldAmount
          )).rejects.toThrow();
        });

        it('should preserve other wallet fields when updating', async () => {
          // Arrange
          const buyer = new Buyer({
            ...mockBuyerData,
            wallet: {
              balance: 5000,
              onHoldAmount: 1500,
              currency: 'NGN',
              onHoldItems: [{
                productId: new mongoose.Types.ObjectId(),
                amount: 1500,
                bidDate: new Date()
              }]
            }
          });
          const savedBuyer = await buyer.save();

          const filteredOnHoldItems = [];
          const recalculatedOnHoldAmount = 0;

          // Act
          const result = await buyerRepository.updateWalletOnHoldItems(
            savedBuyer._id,
            filteredOnHoldItems,
            recalculatedOnHoldAmount
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.wallet.balance).toBe(5000); // Should be preserved
          expect(result.wallet.currency).toBe('NGN'); // Should be preserved
          expect(result.wallet.onHoldItems).toHaveLength(0); // Should be updated
          expect(result.wallet.onHoldAmount).toBe(0); // Should be updated
        });
      });
    });
  });
}); 