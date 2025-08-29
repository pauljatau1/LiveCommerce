const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const majorCategoryRepository = require('@modules/buyer/repositories/majorCategory.repository');
const MajorCategory = require('@models/MajorCategory');

describe('Major Category Repository', () => {
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
    await MajorCategory.deleteMany({});
  });

  describe('findActiveMajorCategories', () => {
    it('should return empty array when no active major categories exist', async () => {
      await MajorCategory.create([
        { name: 'Category 1', isActive: false },
        { name: 'Category 2', isActive: false }
      ]);

      const categoryIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      const categories = await majorCategoryRepository.findActiveMajorCategories(categoryIds);
      expect(categories).toEqual([]);
    });

    it('should return only active major categories for given IDs', async () => {
      const activeCategory1 = await MajorCategory.create({ name: 'Active Category 1', isActive: true });
      const activeCategory2 = await MajorCategory.create({ name: 'Active Category 2', isActive: true });
      await MajorCategory.create({ name: 'Inactive Category', isActive: false });

      const categoryIds = [
        activeCategory1._id.toString(),
        activeCategory2._id.toString()
      ];

      const categories = await majorCategoryRepository.findActiveMajorCategories(categoryIds);
      expect(categories).toHaveLength(2);
      expect(categories.every(cat => cat.isActive)).toBe(true);
      expect(categories.map(cat => cat.name)).toContain('Active Category 1');
      expect(categories.map(cat => cat.name)).toContain('Active Category 2');
    });

    it('should handle non-existent IDs gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([nonExistentId.toString()]);
      expect(categories).toEqual([]);
    });

    it('should handle empty IDs array', async () => {
      const categories = await majorCategoryRepository.findActiveMajorCategories([]);
      expect(categories).toEqual([]);
    });

    it('should handle null IDs array', async () => {
      const categories = await majorCategoryRepository.findActiveMajorCategories(null);
      expect(categories).toEqual([]);
    });

    it('should handle undefined IDs array', async () => {
      const categories = await majorCategoryRepository.findActiveMajorCategories(undefined);
      expect(categories).toEqual([]);
    });

    it('should handle mixed active and inactive categories', async () => {
      const activeCategory = await MajorCategory.create({ name: 'Active Category', isActive: true });
      const inactiveCategory = await MajorCategory.create({ name: 'Inactive Category', isActive: false });

      const categoryIds = [
        activeCategory._id.toString(),
        inactiveCategory._id.toString()
      ];

      const categories = await majorCategoryRepository.findActiveMajorCategories(categoryIds);
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Active Category');
      expect(categories[0].isActive).toBe(true);
    });

    it('should handle duplicate IDs in array', async () => {
      const activeCategory = await MajorCategory.create({ name: 'Active Category', isActive: true });

      const categoryIds = [
        activeCategory._id.toString(),
        activeCategory._id.toString()
      ];

      const categories = await majorCategoryRepository.findActiveMajorCategories(categoryIds);
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Active Category');
    });

    it('should handle invalid ObjectId format', async () => {
      // Mongoose throws an error for invalid ObjectId format, so we expect it to throw
      await expect(majorCategoryRepository.findActiveMajorCategories(['invalid-id-format'])).rejects.toThrow();
    });

    it('should handle large array of IDs', async () => {
      const categories = [];
      const categoryIds = [];
      
      // Create 50 active major categories
      for (let i = 0; i < 50; i++) {
        const category = await MajorCategory.create({ 
          name: `Major Category ${i + 1}`, 
          isActive: true 
        });
        categories.push(category);
        categoryIds.push(category._id.toString());
      }

      const result = await majorCategoryRepository.findActiveMajorCategories(categoryIds);
      expect(result).toHaveLength(50);
      expect(result.every(cat => cat.isActive)).toBe(true);
      expect(result.every(cat => cat.name.startsWith('Major Category'))).toBe(true);
    });

    it('should return major categories with all expected fields', async () => {
      const categoryData = {
        name: 'Test Major Category',
        image: {
          url: 'https://example.com/image.jpg',
          public_id: 'test_public_id'
        },
        categories: [],
        isActive: true
      };

      const majorCategory = await MajorCategory.create(categoryData);
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe(categoryData.name);
      expect(categories[0].image).toEqual(categoryData.image);
      expect(categories[0].categories).toEqual([]);
      expect(categories[0].isActive).toBe(true);
      expect(categories[0]).toHaveProperty('createdAt');
      expect(categories[0]).toHaveProperty('updatedAt');
    });

    it('should handle major categories with minimal data', async () => {
      const majorCategory = await MajorCategory.create({ name: 'Minimal Major Category' });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Minimal Major Category');
      expect(categories[0].isActive).toBe(true);
      expect(categories[0].categories).toEqual([]);
      expect(categories[0].image).toEqual({});
    });

    it('should handle major categories with special characters in names', async () => {
      const majorCategory = await MajorCategory.create({ 
        name: 'Major Category with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?' 
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Major Category with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle major categories with very long names', async () => {
      const longName = 'A'.repeat(1000);
      const majorCategory = await MajorCategory.create({ name: longName });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe(longName);
    });

    it('should handle major categories with unicode characters', async () => {
      const majorCategory = await MajorCategory.create({ 
        name: 'Major Category with unicode: 中文, Español, Français, العربية' 
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Major Category with unicode: 中文, Español, Français, العربية');
    });

    it('should handle major categories with numeric names', async () => {
      const majorCategory = await MajorCategory.create({ name: '12345' });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('12345');
    });

    it('should handle major categories with empty string names', async () => {
      // MajorCategory model requires name field, so empty string should throw validation error
      await expect(MajorCategory.create({ name: '' })).rejects.toThrow();
    });

    it('should handle major categories with null image fields', async () => {
      const majorCategory = await MajorCategory.create({ 
        name: 'Major Category with null image',
        image: {
          url: null,
          public_id: null
        }
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].image.url).toBeNull();
      expect(categories[0].image.public_id).toBeNull();
    });

    it('should handle major categories with category references', async () => {
      const categoryId1 = new mongoose.Types.ObjectId();
      const categoryId2 = new mongoose.Types.ObjectId();
      
      const majorCategory = await MajorCategory.create({
        name: 'Major Category with categories',
        categories: [categoryId1, categoryId2]
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].categories).toHaveLength(2);
      expect(categories[0].categories[0].toString()).toBe(categoryId1.toString());
      expect(categories[0].categories[1].toString()).toBe(categoryId2.toString());
    });

    it('should handle major categories with empty categories array', async () => {
      const majorCategory = await MajorCategory.create({
        name: 'Major Category with empty categories',
        categories: []
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].categories).toEqual([]);
    });

    it('should handle major categories with explicit isActive false', async () => {
      const majorCategory = await MajorCategory.create({
        name: 'Inactive Major Category',
        isActive: false
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(0);
    });

    it('should handle major categories with explicit isActive true', async () => {
      const majorCategory = await MajorCategory.create({
        name: 'Active Major Category',
        isActive: true
      });
      
      const categories = await majorCategoryRepository.findActiveMajorCategories([majorCategory._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].isActive).toBe(true);
    });

    it('should handle major categories with mixed active status in same query', async () => {
      const activeCategory = await MajorCategory.create({
        name: 'Active Category',
        isActive: true
      });
      
      const inactiveCategory = await MajorCategory.create({
        name: 'Inactive Category',
        isActive: false
      });
      
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const categoryIds = [
        activeCategory._id.toString(),
        inactiveCategory._id.toString(),
        nonExistentId.toString()
      ];

      const categories = await majorCategoryRepository.findActiveMajorCategories(categoryIds);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Active Category');
      expect(categories[0].isActive).toBe(true);
    });
  });

  describe('findAllActiveMajorCategories', () => {
    it('should return empty array when no active major categories exist', async () => {
      await MajorCategory.create([
        { name: 'Category 1', isActive: false },
        { name: 'Category 2', isActive: false }
      ]);

      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toEqual([]);
    });

    it('should return only active major categories', async () => {
      await MajorCategory.create([
        { name: 'Active Category 1', isActive: true },
        { name: 'Inactive Category', isActive: false },
        { name: 'Active Category 2', isActive: true }
      ]);

      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toHaveLength(2);
      expect(categories.every(cat => cat.isActive)).toBe(true);
      expect(categories.map(cat => cat.name)).toContain('Active Category 1');
      expect(categories.map(cat => cat.name)).toContain('Active Category 2');
    });

    it('should return all active major categories when all are active', async () => {
      await MajorCategory.create([
        { name: 'Active Category 1', isActive: true },
        { name: 'Active Category 2', isActive: true },
        { name: 'Active Category 3', isActive: true }
      ]);

      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toHaveLength(3);
      expect(categories.every(cat => cat.isActive)).toBe(true);
    });

    it('should return empty array when no major categories exist', async () => {
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toEqual([]);
    });

    it('should return major categories with all expected fields', async () => {
      const categoryData = {
        name: 'Test Major Category',
        image: {
          url: 'https://example.com/image.jpg',
          public_id: 'test_public_id'
        },
        categories: [],
        isActive: true
      };

      await MajorCategory.create(categoryData);
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe(categoryData.name);
      expect(categories[0].image).toEqual(categoryData.image);
      expect(categories[0].categories).toEqual([]);
      expect(categories[0].isActive).toBe(true);
      expect(categories[0]).toHaveProperty('createdAt');
      expect(categories[0]).toHaveProperty('updatedAt');
    });

    it('should handle major categories with minimal data', async () => {
      await MajorCategory.create({ name: 'Minimal Major Category' });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Minimal Major Category');
      expect(categories[0].isActive).toBe(true);
      expect(categories[0].categories).toEqual([]);
      expect(categories[0].image).toEqual({});
    });

    it('should handle major categories with special characters in names', async () => {
      await MajorCategory.create({ 
        name: 'Major Category with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?' 
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Major Category with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle major categories with very long names', async () => {
      const longName = 'A'.repeat(1000);
      await MajorCategory.create({ name: longName });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe(longName);
    });

    it('should handle major categories with unicode characters', async () => {
      await MajorCategory.create({ 
        name: 'Major Category with unicode: 中文, Español, Français, العربية' 
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Major Category with unicode: 中文, Español, Français, العربية');
    });

    it('should handle major categories with numeric names', async () => {
      await MajorCategory.create({ name: '12345' });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('12345');
    });

    it('should handle major categories with null image fields', async () => {
      await MajorCategory.create({ 
        name: 'Major Category with null image',
        image: {
          url: null,
          public_id: null
        }
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].image.url).toBeNull();
      expect(categories[0].image.public_id).toBeNull();
    });

    it('should handle major categories with category references', async () => {
      const categoryId1 = new mongoose.Types.ObjectId();
      const categoryId2 = new mongoose.Types.ObjectId();
      
      await MajorCategory.create({
        name: 'Major Category with categories',
        categories: [categoryId1, categoryId2]
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].categories).toHaveLength(2);
      expect(categories[0].categories[0].toString()).toBe(categoryId1.toString());
      expect(categories[0].categories[1].toString()).toBe(categoryId2.toString());
    });

    it('should handle major categories with empty categories array', async () => {
      await MajorCategory.create({
        name: 'Major Category with empty categories',
        categories: []
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      
      expect(categories).toHaveLength(1);
      expect(categories[0].categories).toEqual([]);
    });

    it('should handle large number of active major categories', async () => {
      const categories = [];
      
      // Create 100 active major categories
      for (let i = 0; i < 100; i++) {
        categories.push({
          name: `Major Category ${i + 1}`,
          isActive: true
        });
      }

      await MajorCategory.create(categories);

      const result = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(result).toHaveLength(100);
      expect(result.every(cat => cat.isActive)).toBe(true);
      expect(result.every(cat => cat.name.startsWith('Major Category'))).toBe(true);
    });

    it('should handle major categories with mixed active status', async () => {
      await MajorCategory.create([
        { name: 'Active Category 1', isActive: true },
        { name: 'Inactive Category 1', isActive: false },
        { name: 'Active Category 2', isActive: true },
        { name: 'Inactive Category 2', isActive: false },
        { name: 'Active Category 3', isActive: true }
      ]);

      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toHaveLength(3);
      expect(categories.every(cat => cat.isActive)).toBe(true);
      expect(categories.map(cat => cat.name)).toContain('Active Category 1');
      expect(categories.map(cat => cat.name)).toContain('Active Category 2');
      expect(categories.map(cat => cat.name)).toContain('Active Category 3');
    });

    it('should handle major categories with explicit isActive false', async () => {
      await MajorCategory.create({
        name: 'Inactive Major Category',
        isActive: false
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toHaveLength(0);
    });

    it('should handle major categories with explicit isActive true', async () => {
      await MajorCategory.create({
        name: 'Active Major Category',
        isActive: true
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].isActive).toBe(true);
    });

    it('should handle major categories with default isActive value', async () => {
      await MajorCategory.create({
        name: 'Default Active Major Category'
        // isActive defaults to true
      });
      
      const categories = await majorCategoryRepository.findAllActiveMajorCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].isActive).toBe(true);
    });
  });
});
