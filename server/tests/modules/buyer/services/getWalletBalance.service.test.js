const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const getWalletBalanceService = require('@modules/buyer/services/getWalletBalance.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('getWalletBalance Service', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Buyer.deleteMany({});
    await Product.deleteMany({});
    await Seller.deleteMany({});
    jest.clearAllMocks();
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance with formatted on-hold items', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      
      // Create a seller first
      const seller = new Seller({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'seller@example.com',
        password: 'password123',
        phoneNumber: '+2348012345678',
        businessName: 'Test Business',
        storeName: 'Test Store'
      });
      await seller.save();

      // Create a product
      const product = new Product({
        _id: productId,
        name: 'Test Product',
        description: 'Test product description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: seller._id,
        status: 'offline_auction',
        images: [{ url: 'https://example.com/image.jpg' }],
        auction: {
          minBid: 500,
          maxBid: 2000,
          startDate: new Date(Date.now() - 86400000), // Started 24 hours ago
          endDate: new Date(Date.now() + 86400000), // Ends in 24 hours
          status: 'ongoing'
        }
      });
      await product.save();

      // Create a buyer with wallet data
      const buyer = new Buyer({
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
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
      await buyer.save();

      // Mock repository methods with populated data
      const populatedBuyer = {
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [
            {
              productId: {
                _id: productId,
                name: 'Test Product',
                images: [{ url: 'https://example.com/image.jpg' }],
                auction: {
                  status: 'ongoing',
                  endDate: new Date(Date.now() + 86400000)
                }
              },
              amount: 1500,
              bidDate: new Date()
            }
          ]
        }
      };
      
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(populatedBuyer);
      buyerRepository.updateWalletOnHoldItems.mockResolvedValue({
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [populatedBuyer.wallet.onHoldItems[0]], // Only active item
          onHoldAmount: 1500
        }
      });

      // Act
      const result = await getWalletBalanceService.getWalletBalance(buyerId.toString());

      // Assert
      expect(result).toEqual({
        balance: 5000,
        onHoldAmount: 1500,
        availableBalance: 3500,
        onHoldItems: [{
          productId: productId,
          productName: 'Test Product',
          productImage: 'https://example.com/image.jpg',
          amount: 1500,
          bidDate: expect.any(Date),
          auctionStatus: 'ongoing',
          auctionEndDate: expect.any(Date)
        }],
        currency: 'NGN'
      });

      expect(buyerRepository.findByIdWithWalletOnHoldItems).toHaveBeenCalledWith(buyerId.toString());
      expect(buyerRepository.updateWalletOnHoldItems).not.toHaveBeenCalled();
    });

    it('should filter out ended auctions and update wallet', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      const activeProductId = new mongoose.Types.ObjectId();
      const endedProductId = new mongoose.Types.ObjectId();
      
      // Create sellers first
      const activeSeller = new Seller({
        firstName: 'Active',
        lastName: 'Seller',
        email: 'active@example.com',
        password: 'password123',
        phoneNumber: '+2348012345678',
        businessName: 'Active Business',
        storeName: 'Active Store'
      });
      await activeSeller.save();

      const endedSeller = new Seller({
        firstName: 'Ended',
        lastName: 'Seller',
        email: 'ended@example.com',
        password: 'password123',
        phoneNumber: '+2348012345678',
        businessName: 'Ended Business',
        storeName: 'Ended Store'
      });
      await endedSeller.save();

      // Create products
      const activeProduct = new Product({
        _id: activeProductId,
        name: 'Active Product',
        description: 'Active product description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: activeSeller._id,
        status: 'offline_auction',
        images: [{ url: 'https://example.com/active.jpg' }],
        auction: {
          minBid: 500,
          maxBid: 2000,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
          status: 'ongoing'
        }
      });
      await activeProduct.save();

      const endedProduct = new Product({
        _id: endedProductId,
        name: 'Ended Product',
        description: 'Ended product description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: endedSeller._id,
        status: 'offline_auction',
        auction: {
          minBid: 500,
          maxBid: 2000,
          startDate: new Date(Date.now() - 172800000), // 2 days ago
          endDate: new Date(Date.now() - 86400000), // 1 day ago
          status: 'ended'
        }
      });
      await endedProduct.save();

      // Create a buyer with both active and ended auction items
      const buyer = new Buyer({
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        wallet: {
          balance: 5000,
          onHoldAmount: 2500, // 1500 + 1000
          currency: 'NGN',
          onHoldItems: [
            {
              productId: activeProductId,
              amount: 1500,
              bidDate: new Date()
            },
            {
              productId: endedProductId,
              amount: 1000,
              bidDate: new Date()
            }
          ]
        }
      });
      await buyer.save();

      // Mock repository methods with populated data
      const populatedBuyer = {
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [
            {
              productId: {
                _id: activeProductId,
                name: 'Active Product',
                images: [{ url: 'https://example.com/active.jpg' }],
                auction: {
                  status: 'ongoing',
                  endDate: new Date(Date.now() + 86400000)
                }
              },
              amount: 1500,
              bidDate: new Date()
            },
            {
              productId: {
                _id: endedProductId,
                name: 'Ended Product',
                images: [{ url: 'https://example.com/ended.jpg' }],
                auction: {
                  status: 'ended',
                  endDate: new Date(Date.now() - 86400000)
                }
              },
              amount: 1000,
              bidDate: new Date()
            }
          ]
        }
      };
      
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(populatedBuyer);
      buyerRepository.updateWalletOnHoldItems.mockResolvedValue({
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [populatedBuyer.wallet.onHoldItems[0]], // Only active item
          onHoldAmount: 1500
        }
      });

      // Act
      const result = await getWalletBalanceService.getWalletBalance(buyerId.toString());

      // Assert
      expect(result).toEqual({
        balance: 5000,
        onHoldAmount: 1500,
        availableBalance: 3500,
        onHoldItems: [{
          productId: activeProductId,
          productName: 'Active Product',
          productImage: 'https://example.com/active.jpg',
          amount: 1500,
          bidDate: expect.any(Date),
          auctionStatus: 'ongoing',
          auctionEndDate: expect.any(Date)
        }],
        currency: 'NGN'
      });

      expect(buyerRepository.findByIdWithWalletOnHoldItems).toHaveBeenCalledWith(buyerId.toString());
      expect(buyerRepository.updateWalletOnHoldItems).toHaveBeenCalledWith(
        buyerId.toString(),
        [populatedBuyer.wallet.onHoldItems[0]], // Only active item
        1500 // Recalculated amount
      );
    });

    it('should handle buyer with no on-hold items', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      
      const buyer = new Buyer({
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        wallet: {
          balance: 5000,
          onHoldAmount: 0,
          currency: 'NGN',
          onHoldItems: []
        }
      });
      await buyer.save();

      // Mock repository methods
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(buyer);
      buyerRepository.updateWalletOnHoldItems.mockResolvedValue(buyer);

      // Act
      const result = await getWalletBalanceService.getWalletBalance(buyerId.toString());

      // Assert
      expect(result).toEqual({
        balance: 5000,
        onHoldAmount: 0,
        availableBalance: 5000,
        onHoldItems: [],
        currency: 'NGN'
      });

      expect(buyerRepository.findByIdWithWalletOnHoldItems).toHaveBeenCalledWith(buyerId.toString());
      expect(buyerRepository.updateWalletOnHoldItems).not.toHaveBeenCalled();
    });

    it('should handle on-hold items with missing product data', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      
      const buyer = new Buyer({
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
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
      await buyer.save();

      // Mock repository methods - product doesn't exist (null productId)
      const buyerWithNullProduct = {
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [{
            productId: null, // Non-existent product
            amount: 1500,
            bidDate: new Date()
          }]
        }
      };
      
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(buyerWithNullProduct);
      buyerRepository.updateWalletOnHoldItems.mockResolvedValue(buyer);

      // Act
      const result = await getWalletBalanceService.getWalletBalance(buyerId.toString());

      // Assert - service filters out non-existent products
      expect(result).toEqual({
        balance: 5000,
        onHoldAmount: 0, // Filtered out non-existent product
        availableBalance: 5000, // Full balance available
        onHoldItems: [], // No items returned
        currency: 'NGN'
      });
    });

    it('should handle on-hold items with products that have no images', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      
      // Create a seller first
      const seller = new Seller({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'seller@example.com',
        password: 'password123',
        phoneNumber: '+2348012345678',
        businessName: 'Test Business',
        storeName: 'Test Store'
      });
      await seller.save();

      // Create a product without images
      const product = new Product({
        _id: productId,
        name: 'Product Without Images',
        description: 'Product without images description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: seller._id,
        status: 'offline_auction',
        auction: {
          minBid: 500,
          maxBid: 2000,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000),
          status: 'ongoing'
        }
      });
      await product.save();

      const buyer = new Buyer({
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
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
      await buyer.save();

      // Mock repository methods with populated data
      const populatedBuyer = {
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [{
            productId: {
              _id: productId,
              name: 'Product Without Images',
              images: [], // No images
              auction: {
                status: 'ongoing',
                endDate: new Date(Date.now() + 86400000)
              }
            },
            amount: 1500,
            bidDate: new Date()
          }]
        }
      };
      
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(populatedBuyer);
      buyerRepository.updateWalletOnHoldItems.mockResolvedValue(buyer);

      // Act
      const result = await getWalletBalanceService.getWalletBalance(buyerId.toString());

      // Assert
      expect(result).toEqual({
        balance: 5000,
        onHoldAmount: 1500,
        availableBalance: 3500,
        onHoldItems: [{
          productId: productId,
          productName: 'Product Without Images',
          productImage: null,
          amount: 1500,
          bidDate: expect.any(Date),
                      auctionStatus: 'ongoing',
          auctionEndDate: expect.any(Date)
        }],
        currency: 'NGN'
      });
    });

    it('should throw error when buyer is not found', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      
      // Mock repository method to return null
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(null);

      // Act & Assert
      await expect(getWalletBalanceService.getWalletBalance(buyerId.toString()))
        .rejects
        .toThrow('Buyer not found');

      expect(buyerRepository.findByIdWithWalletOnHoldItems).toHaveBeenCalledWith(buyerId.toString());
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      
      // Mock repository method to throw error
      buyerRepository.findByIdWithWalletOnHoldItems.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(getWalletBalanceService.getWalletBalance(buyerId.toString()))
        .rejects
        .toThrow('Database error');

      expect(buyerRepository.findByIdWithWalletOnHoldItems).toHaveBeenCalledWith(buyerId.toString());
    });

    it('should handle update wallet errors gracefully', async () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      
      // Create a seller first
      const seller = new Seller({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'seller@example.com',
        password: 'password123',
        phoneNumber: '+2348012345678',
        businessName: 'Test Business',
        storeName: 'Test Store'
      });
      await seller.save();

      // Create a product with ended auction
      const product = new Product({
        _id: productId,
        name: 'Ended Product',
        description: 'Ended product description',
        price: 1000,
        category: 'Electronics',
        stock: 10,
        seller: seller._id,
        status: 'offline_auction',
        auction: {
          minBid: 500,
          maxBid: 2000,
          startDate: new Date(Date.now() - 172800000), // 2 days ago
          endDate: new Date(Date.now() - 86400000), // 1 day ago
          status: 'ended'
        }
      });
      await product.save();

      const buyer = new Buyer({
        _id: buyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
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
      await buyer.save();

      // Mock repository methods with populated data
      const populatedBuyer = {
        ...buyer.toObject(),
        wallet: {
          ...buyer.wallet,
          onHoldItems: [{
            productId: {
              _id: productId,
              name: 'Ended Product',
              images: [{ url: 'https://example.com/ended.jpg' }],
              auction: {
                status: 'ended',
                endDate: new Date(Date.now() - 86400000)
              }
            },
            amount: 1500,
            bidDate: new Date()
          }]
        }
      };
      
      buyerRepository.findByIdWithWalletOnHoldItems.mockResolvedValue(populatedBuyer);
      buyerRepository.updateWalletOnHoldItems.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(getWalletBalanceService.getWalletBalance(buyerId.toString()))
        .rejects
        .toThrow('Update failed');

      expect(buyerRepository.findByIdWithWalletOnHoldItems).toHaveBeenCalledWith(buyerId.toString());
      expect(buyerRepository.updateWalletOnHoldItems).toHaveBeenCalledWith(
        buyerId.toString(),
        [], // Empty array after filtering ended auctions
        0 // Recalculated amount
      );
    });
  });
}); 