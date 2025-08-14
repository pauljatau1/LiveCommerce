const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { app } = require('@/app');
const Buyer = require('@modules/buyer/models/buyer.model');
const MajorCategory = require('@models/MajorCategory');
const Category = require('@models/Category');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;
let token;
let buyer;
let majorCategory1;
let majorCategory2;
let category1;
let category2;

describe('PUT /api/v2/buyers/update-major-categories', () => {
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
    // Clear database
    await Buyer.deleteMany({});
    await MajorCategory.deleteMany({});
    await Category.deleteMany({});

    // Create test buyer
    buyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
      selectedCategories: [
        {
          name: 'Custom Category',
          subCategories: [
            { name: 'Custom Subcategory' }
          ]
        }
      ]
    });
    await buyer.save();

    // Create test categories
    category1 = new Category({
      name: 'Electronics',
      subCategories: [
        { name: 'Smartphones' },
        { name: 'Laptops' }
      ]
    });
    await category1.save();

    category2 = new Category({
      name: 'Clothing',
      subCategories: [
        { name: 'Men' },
        { name: 'Women' }
      ]
    });
    await category2.save();

    // Create test major categories
    majorCategory1 = new MajorCategory({
      name: 'Tech',
      image: { url: 'tech.jpg', public_id: 'tech' },
      categories: [category1._id],
      isActive: true
    });
    await majorCategory1.save();

    majorCategory2 = new MajorCategory({
      name: 'Fashion',
      image: { url: 'fashion.jpg', public_id: 'fashion' },
      categories: [category2._id],
      isActive: true
    });
    await majorCategory2.save();

    // Generate JWT token for authentication
    const jwt = require('jsonwebtoken');
    token = jwt.sign(
      { id: buyer._id.toString(), role: 'buyer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  describe('Success cases', () => {
    it('should successfully update major categories selection', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [majorCategory1._id.toString(), majorCategory2._id.toString()]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Major categories selection updated successfully');
      expect(response.body.data).toHaveProperty('selectedCategories');
      expect(response.body.data).toHaveProperty('majorCategorySelections');
      expect(response.body.data).toHaveProperty('manualSelections');

      // Verify the response structure
      expect(Array.isArray(response.body.data.selectedCategories)).toBe(true);
      expect(Array.isArray(response.body.data.majorCategorySelections)).toBe(true);
      expect(Array.isArray(response.body.data.manualSelections)).toBe(true);

      // Verify that manual selections are preserved
      const manualSelection = response.body.data.manualSelections.find(
        cat => cat.name === 'Custom Category'
      );
      expect(manualSelection).toBeDefined();
      expect(manualSelection.subCategories).toHaveLength(1);
      expect(manualSelection.subCategories[0].name).toBe('Custom Subcategory');

      // Verify that major category selections are included
      const electronicsSelection = response.body.data.majorCategorySelections.find(
        cat => cat.name === 'Electronics'
      );
      expect(electronicsSelection).toBeDefined();
      expect(electronicsSelection.subCategories).toHaveLength(2);

      const clothingSelection = response.body.data.majorCategorySelections.find(
        cat => cat.name === 'Clothing'
      );
      expect(clothingSelection).toBeDefined();
      expect(clothingSelection.subCategories).toHaveLength(2);
    });

    it('should update selection with only one major category', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.majorCategorySelections).toHaveLength(1);
      expect(response.body.data.majorCategorySelections[0].name).toBe('Electronics');
      expect(response.body.data.manualSelections).toHaveLength(1);
      expect(response.body.data.manualSelections[0].name).toBe('Custom Category');
    });

    it('should preserve manual selections when updating major categories', async () => {
      // Add more manual selections to the buyer
      buyer.selectedCategories.push({
        name: 'Another Custom Category',
        subCategories: [
          { name: 'Another Custom Subcategory' }
        ]
      });
      await buyer.save();

      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(200);

      expect(response.body.data.manualSelections).toHaveLength(2);
      const customCategories = response.body.data.manualSelections.map(cat => cat.name);
      expect(customCategories).toContain('Custom Category');
      expect(customCategories).toContain('Another Custom Category');
    });
  });

  describe('Validation errors', () => {
    it('should return 422 when majorCategoryIds is missing', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'majorCategoryIds',
          message: 'majorCategoryIds array is required'
        })
      );
    });

    it('should return 422 when majorCategoryIds is null', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: null
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'majorCategoryIds',
          message: 'majorCategoryIds array is required'
        })
      );
    });

    it('should return 422 when majorCategoryIds is not an array', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: 'not-an-array'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'majorCategoryIds',
          message: 'majorCategoryIds must be an array'
        })
      );
    });

    it('should return 422 when majorCategoryIds array is empty', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: []
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'majorCategoryIds',
          message: 'majorCategoryIds array cannot be empty'
        })
      );
    });

    it('should return 422 when majorCategoryIds contains invalid ObjectIds', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: ['invalid-id', new mongoose.Types.ObjectId().toString()]
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'majorCategoryIds[0]',
          message: 'must be a valid ObjectId'
        })
      );
    });

    it('should return 422 when majorCategoryIds contains non-string values', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [123, new mongoose.Types.ObjectId().toString()]
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'majorCategoryIds[0]',
          message: 'must be a string'
        })
      );
    });
  });

  describe('Authentication errors', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Not found errors', () => {
    it('should return 404 when buyer does not exist', async () => {
      // Create a token for a non-existent buyer
      const jwt = require('jsonwebtoken');
      const nonExistentToken = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString(), role: 'buyer' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Buyer not found');
    });

    it('should return 404 when no active major categories found', async () => {
      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No active major categories found with the provided IDs');
    });

    it('should return 404 when major category is inactive', async () => {
      // Make major category inactive
      majorCategory1.isActive = false;
      await majorCategory1.save();

      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No active major categories found with the provided IDs');
    });
  });

  describe('Edge cases', () => {
    it('should handle buyer with no existing selected categories', async () => {
      // Remove all selected categories from buyer
      buyer.selectedCategories = [];
      await buyer.save();

      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [majorCategory1._id.toString()]
        })
        .expect(200);

      expect(response.body.data.manualSelections).toHaveLength(0);
      expect(response.body.data.majorCategorySelections).toHaveLength(1);
      expect(response.body.data.selectedCategories).toHaveLength(1);
    });

    it('should handle major category with no categories', async () => {
      // Create a major category with no categories
      const emptyMajorCategory = new MajorCategory({
        name: 'Empty Category',
        image: { url: 'empty.jpg', public_id: 'empty' },
        categories: [],
        isActive: true
      });
      await emptyMajorCategory.save();

      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [emptyMajorCategory._id.toString()]
        })
        .expect(200);

      expect(response.body.data.majorCategorySelections).toHaveLength(0);
      expect(response.body.data.manualSelections).toHaveLength(1);
      expect(response.body.data.selectedCategories).toHaveLength(1);
    });

    it('should handle category with no subcategories', async () => {
      // Create a category with no subcategories
      const categoryWithoutSubs = new Category({
        name: 'Category Without Subs',
        subCategories: []
      });
      await categoryWithoutSubs.save();

      // Create a major category with this category
      const majorCategoryWithoutSubs = new MajorCategory({
        name: 'Major Without Subs',
        image: { url: 'nosubs.jpg', public_id: 'nosubs' },
        categories: [categoryWithoutSubs._id],
        isActive: true
      });
      await majorCategoryWithoutSubs.save();

      const response = await request(app)
        .put('/api/v2/buyers/update-major-categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          majorCategoryIds: [majorCategoryWithoutSubs._id.toString()]
        })
        .expect(200);

      const categorySelection = response.body.data.majorCategorySelections.find(
        cat => cat.name === 'Category Without Subs'
      );
      expect(categorySelection).toBeDefined();
      expect(categorySelection.subCategories).toHaveLength(0);
    });
  });
});
