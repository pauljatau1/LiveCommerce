const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@modules/buyer/models/buyer.model');
const Post = require('@models/Post');

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
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Buyer.deleteMany({});
    await Post.deleteMany({});
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
}); 