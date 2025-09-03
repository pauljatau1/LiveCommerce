/**
 * Product Repository Tests
 *
 * This test suite covers all functionality of the product repository
 * for seller-specific operations.
 *
 * @module productRepositoryTests
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productRepository = require('@modules/seller/repositories/product.repository');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

let mongoServer;

describe('Product Repository', () => {
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
    await Product.deleteMany({});
  });

  const mockProductData = {
    name: 'Test Product',
    description: 'A test product for testing purposes',
    price: 1000,
    seller: '507f1f77bcf86cd799439011',
    category: '507f1f77bcf86cd799439012',
    stock: 10,
    blips: [
      {
        content: 'First blip content',
        author: '507f1f77bcf86cd799439011',
        authorType: 'Seller',
        key: 'blip1',
        createdAt: new Date()
      },
      {
        content: 'Second blip content',
        author: '507f1f77bcf86cd799439011',
        authorType: 'Seller',
        key: 'blip2',
        createdAt: new Date()
      }
    ]
  };

  describe('findProductsBySeller', () => {
    it('should return products with blips for a seller', async () => {
      const product = new Product(mockProductData);
      await product.save();

      const result = await productRepository.findProductsBySeller(mockProductData.seller);
      
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBeDefined();
      expect(result[0].seller).toBeUndefined(); // Should not include seller
      expect(result[0].blips).toHaveLength(2);
      expect(result[0].blips[0].key).toBe('blip1');
      expect(result[0].blips[1].key).toBe('blip2');
    });

    it('should return empty array when seller has no products', async () => {
      const sellerWithNoProducts = '507f1f77bcf86cd799439013';
      const result = await productRepository.findProductsBySeller(sellerWithNoProducts);
      expect(result).toHaveLength(0);
    });

    it('should return multiple products for the same seller', async () => {
      const product1 = new Product(mockProductData);
      const product2 = new Product({
        ...mockProductData,
        name: 'Second Test Product',
        description: 'Another test product for testing purposes',
        price: 500,
        stock: 5,
        blips: [
          {
            content: 'Third blip content',
            author: '507f1f77bcf86cd799439011',
            authorType: 'Seller',
            key: 'blip3',
            createdAt: new Date()
          }
        ]
      });
      
      await product1.save();
      await product2.save();

      const result = await productRepository.findProductsBySeller(mockProductData.seller);
      expect(result).toHaveLength(2);
      expect(result[0]._id).toBeDefined();
      expect(result[1]._id).toBeDefined();
      expect(result[0].name).toBeUndefined(); // Should not include name
      expect(result[1].name).toBeUndefined(); // Should not include name
    });

    it('should not return products from other sellers', async () => {
      const product1 = new Product(mockProductData);
      const otherSellerProduct = new Product({
        ...mockProductData,
        name: 'Other Seller Product',
        description: 'A product from another seller',
        price: 750,
        seller: '507f1f77bcf86cd799439014',
        stock: 8,
        blips: [
          {
            content: 'Other seller blip',
            author: '507f1f77bcf86cd799439014',
            authorType: 'Seller',
            key: 'blip4',
            createdAt: new Date()
          }
        ]
      });
      
      await product1.save();
      await otherSellerProduct.save();

      const result = await productRepository.findProductsBySeller(mockProductData.seller);
      expect(result).toHaveLength(1); // Should still be 1 for the original seller
      expect(result[0]._id).toBeDefined();
      expect(result[0].name).toBeUndefined(); // Should not include name
    });

    it('should return products with no blips', async () => {
      const product1 = new Product(mockProductData);
      const productWithoutBlips = new Product({
        ...mockProductData,
        name: 'Product Without Blips',
        description: 'A product with no blips',
        price: 300,
        stock: 15,
        blips: []
      });
      
      await product1.save();
      await productWithoutBlips.save();

      const result = await productRepository.findProductsBySeller(mockProductData.seller);
      expect(result).toHaveLength(2);
      const productWithBlips = result.find(p => p._id.toString() === product1._id.toString());
      const productWithoutBlipsResult = result.find(p => p._id.toString() === productWithoutBlips._id.toString());
      
      expect(productWithBlips.blips).toHaveLength(2);
      expect(productWithoutBlipsResult.blips).toHaveLength(0);
    });

    it('should only return blips field from products', async () => {
      const product = new Product(mockProductData);
      await product.save();

      const result = await productRepository.findProductsBySeller(mockProductData.seller);
      
      expect(result[0].name).toBeUndefined(); // Should not include name
      expect(result[0].description).toBeUndefined(); // Should not include description
      expect(result[0].price).toBeUndefined(); // Should not include price
      expect(result[0].seller).toBeUndefined(); // Should not include seller
      expect(result[0].category).toBeUndefined(); // Should not include category
      expect(result[0].blips).toBeDefined(); // Should only include blips
      expect(result[0]._id).toBeDefined(); // _id is always included
    });

    it('should handle products with undefined blips', async () => {
      const product1 = new Product(mockProductData);
      const { blips, ...productDataWithoutBlips } = mockProductData;
      const productWithUndefinedBlips = new Product({
        ...productDataWithoutBlips,
        name: 'Product With Undefined Blips',
        description: 'A product with undefined blips',
        price: 400,
        stock: 20
        // blips field intentionally omitted
      });
      
      await product1.save();
      await productWithUndefinedBlips.save();

      const result = await productRepository.findProductsBySeller(mockProductData.seller);
      expect(result).toHaveLength(2);
      const productWithUndefinedBlipsResult = result.find(p => p._id.toString() === productWithUndefinedBlips._id.toString());
      expect(productWithUndefinedBlipsResult.blips).toEqual([]); // Mongoose select returns empty array for missing field
    });
  });
});
