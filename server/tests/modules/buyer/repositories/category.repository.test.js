const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const categoryRepository = require('@modules/buyer/repositories/category.repository');
const MajorCategory = require('@models/MajorCategory');
const Category = require('@models/Category');

describe('Category Repository', () => {
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
    await Category.deleteMany({});
  });

  describe('findCategoriesByIds', () => {
    it('should return categories for given IDs', async () => {
      const category1 = await Category.create({ name: 'Category 1', isActive: true });
      const category2 = await Category.create({ name: 'Category 2', isActive: true });
      const category3 = await Category.create({ name: 'Category 3', isActive: true });

      const categories = await categoryRepository.findCategoriesByIds([
        category1._id.toString(),
        category2._id.toString()
      ]);

      expect(categories).toHaveLength(2);
      expect(categories.map(cat => cat.name)).toContain('Category 1');
      expect(categories.map(cat => cat.name)).toContain('Category 2');
      expect(categories.map(cat => cat.name)).not.toContain('Category 3');
    });

    it('should return empty array for non-existent IDs', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const categories = await categoryRepository.findCategoriesByIds([nonExistentId.toString()]);
      expect(categories).toEqual([]);
    });

    it('should handle empty IDs array', async () => {
      const categories = await categoryRepository.findCategoriesByIds([]);
      expect(categories).toEqual([]);
    });

    it('should handle null IDs array', async () => {
      const categories = await categoryRepository.findCategoriesByIds(null);
      expect(categories).toEqual([]);
    });

    it('should handle undefined IDs array', async () => {
      const categories = await categoryRepository.findCategoriesByIds(undefined);
      expect(categories).toEqual([]);
    });

    it('should handle mixed valid and invalid IDs', async () => {
      const category1 = await Category.create({ name: 'Category 1', isActive: true });
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const categories = await categoryRepository.findCategoriesByIds([
        category1._id.toString(),
        nonExistentId.toString()
      ]);

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Category 1');
    });

    it('should handle duplicate IDs in array', async () => {
      const category1 = await Category.create({ name: 'Category 1', isActive: true });
      
      const categories = await categoryRepository.findCategoriesByIds([
        category1._id.toString(),
        category1._id.toString()
      ]);

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Category 1');
    });

    it('should handle invalid ObjectId format', async () => {
      // Mongoose throws an error for invalid ObjectId format, so we expect it to throw
      await expect(categoryRepository.findCategoriesByIds(['invalid-id-format'])).rejects.toThrow();
    });

    it('should handle large array of IDs', async () => {
      const categories = [];
      const categoryIds = [];
      
      // Create 50 categories
      for (let i = 0; i < 50; i++) {
        const category = await Category.create({ 
          name: `Category ${i + 1}`, 
          isActive: true 
        });
        categories.push(category);
        categoryIds.push(category._id.toString());
      }

      const result = await categoryRepository.findCategoriesByIds(categoryIds);
      expect(result).toHaveLength(50);
      expect(result.every(cat => cat.name.startsWith('Category'))).toBe(true);
    });

    it('should return categories with all expected fields', async () => {
      const categoryData = {
        name: 'Test Category',
        image: {
          url: 'https://example.com/image.jpg',
          public_id: 'test_public_id'
        },
        platformFee: 5.5,
        subCategories: [
          {
            name: 'Sub Category 1',
            subSubCategories: [
              { name: 'Sub Sub Category 1' }
            ]
          }
        ],
        statistics: {
          orders: {
            pending: 10,
            completed: 20
          },
          items: {
            pending: 5,
            sold: 15
          },
          totalProducts: 30,
          streams: {
            active: 2,
            scheduled: 3,
            ended: 1
          }
        }
      };

      const category = await Category.create(categoryData);
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe(categoryData.name);
      expect(categories[0].image).toEqual(categoryData.image);
      expect(categories[0].platformFee).toBe(categoryData.platformFee);
      expect(categories[0].subCategories).toHaveLength(1);
      expect(categories[0].subCategories[0].name).toBe('Sub Category 1');
      expect(categories[0].subCategories[0].subSubCategories).toHaveLength(1);
      expect(categories[0].subCategories[0].subSubCategories[0].name).toBe('Sub Sub Category 1');
      expect(categories[0].statistics).toEqual(categoryData.statistics);
      expect(categories[0]).toHaveProperty('createdAt');
      expect(categories[0]).toHaveProperty('updatedAt');
    });

    it('should handle categories with minimal data', async () => {
      const category = await Category.create({ name: 'Minimal Category' });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Minimal Category');
      expect(categories[0].platformFee).toBe(0);
      expect(categories[0].subCategories).toEqual([]);
      expect(categories[0].statistics).toEqual({
        orders: { pending: 0, completed: 0 },
        items: { pending: 0, sold: 0 },
        totalProducts: 0,
        streams: { active: 0, scheduled: 0, ended: 0 }
      });
    });

    it('should handle categories with special characters in names', async () => {
      const category = await Category.create({ 
        name: 'Category with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?' 
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Category with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle categories with very long names', async () => {
      const longName = 'A'.repeat(1000);
      const category = await Category.create({ name: longName });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe(longName);
    });

    it('should handle categories with unicode characters', async () => {
      const category = await Category.create({ 
        name: 'Category with unicode: 中文, Español, Français, العربية' 
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Category with unicode: 中文, Español, Français, العربية');
    });

    it('should handle categories with numeric names', async () => {
      const category = await Category.create({ name: '12345' });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('12345');
    });

    it('should handle categories with empty string names', async () => {
      // Category model requires name field, so empty string should throw validation error
      await expect(Category.create({ name: '' })).rejects.toThrow();
    });

    it('should handle categories with null image fields', async () => {
      const category = await Category.create({ 
        name: 'Category with null image',
        image: {
          url: null,
          public_id: null
        }
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].image.url).toBeNull();
      expect(categories[0].image.public_id).toBeNull();
    });

    it('should handle categories with negative platform fee', async () => {
      const category = await Category.create({ 
        name: 'Category with negative fee',
        platformFee: -5.5
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].platformFee).toBe(-5.5);
    });

    it('should handle categories with very large platform fee', async () => {
      const category = await Category.create({ 
        name: 'Category with large fee',
        platformFee: 999999.99
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].platformFee).toBe(999999.99);
    });

    it('should handle categories with complex nested subcategories', async () => {
      const category = await Category.create({
        name: 'Complex Category',
        subCategories: [
          {
            name: 'Sub Category 1',
            subSubCategories: [
              { name: 'Sub Sub 1' },
              { name: 'Sub Sub 2' }
            ]
          },
          {
            name: 'Sub Category 2',
            subSubCategories: [
              { name: 'Sub Sub 3' },
              { name: 'Sub Sub 4' },
              { name: 'Sub Sub 5' }
            ]
          }
        ]
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].subCategories).toHaveLength(2);
      expect(categories[0].subCategories[0].subSubCategories).toHaveLength(2);
      expect(categories[0].subCategories[1].subSubCategories).toHaveLength(3);
    });

    it('should handle categories with empty subcategories', async () => {
      const category = await Category.create({
        name: 'Category with empty subs',
        subCategories: []
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].subCategories).toEqual([]);
    });

    it('should handle categories with subcategories having empty subSubCategories', async () => {
      const category = await Category.create({
        name: 'Category with empty subSubs',
        subCategories: [
          {
            name: 'Sub Category',
            subSubCategories: []
          }
        ]
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].subCategories[0].subSubCategories).toEqual([]);
    });

    it('should handle categories with large statistics values', async () => {
      const category = await Category.create({
        name: 'Category with large stats',
        statistics: {
          orders: {
            pending: 999999,
            completed: 999999
          },
          items: {
            pending: 999999,
            sold: 999999
          },
          totalProducts: 999999,
          streams: {
            active: 999999,
            scheduled: 999999,
            ended: 999999
          }
        }
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].statistics.orders.pending).toBe(999999);
      expect(categories[0].statistics.orders.completed).toBe(999999);
      expect(categories[0].statistics.items.pending).toBe(999999);
      expect(categories[0].statistics.items.sold).toBe(999999);
      expect(categories[0].statistics.totalProducts).toBe(999999);
      expect(categories[0].statistics.streams.active).toBe(999999);
      expect(categories[0].statistics.streams.scheduled).toBe(999999);
      expect(categories[0].statistics.streams.ended).toBe(999999);
    });

    it('should handle categories with negative statistics values', async () => {
      const category = await Category.create({
        name: 'Category with negative stats',
        statistics: {
          orders: {
            pending: -10,
            completed: -20
          },
          items: {
            pending: -5,
            sold: -15
          },
          totalProducts: -30,
          streams: {
            active: -2,
            scheduled: -3,
            ended: -1
          }
        }
      });
      
      const categories = await categoryRepository.findCategoriesByIds([category._id.toString()]);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].statistics.orders.pending).toBe(-10);
      expect(categories[0].statistics.orders.completed).toBe(-20);
      expect(categories[0].statistics.items.pending).toBe(-5);
      expect(categories[0].statistics.items.sold).toBe(-15);
      expect(categories[0].statistics.totalProducts).toBe(-30);
      expect(categories[0].statistics.streams.active).toBe(-2);
      expect(categories[0].statistics.streams.scheduled).toBe(-3);
      expect(categories[0].statistics.streams.ended).toBe(-1);
    });
  });
});
