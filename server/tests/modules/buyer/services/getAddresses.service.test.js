const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const getAddressesService = require('@modules/buyer/services/getAddresses.service');
const Buyer = require('@models/Buyer');
const NotFoundException = require('@utils/errors/NotFoundException');

let mongoServer;

describe('Get Addresses Service', () => {
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

  describe('getAddresses', () => {
    it('should return shipping addresses for existing buyer', async () => {
      // Arrange
      const buyer = new Buyer({
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
      await buyer.save();

      // Act
      const result = await getAddressesService.getAddresses(buyer._id.toString());

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].addressType).toBe('home');
      expect(result[0].country).toBe('Nigeria');
      expect(result[0].state).toBe('Lagos');
      expect(result[0].city).toBe('Lagos');
      expect(result[0].addressLine1).toBe('123 Main Street');
      expect(result[0].addressLine2).toBe('Apt 4B');
      expect(result[0].zipCode).toBe('100001');
      expect(result[1].addressType).toBe('work');
      expect(result[1].addressLine1).toBe('456 Business Avenue');
    });

    it('should return empty array when buyer has no shipping addresses', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        shippingAddresses: []
      });
      await buyer.save();

      // Act
      const result = await getAddressesService.getAddresses(buyer._id.toString());

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when buyer does not exist', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(
        getAddressesService.getAddresses(nonExistentId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle buyer with null shipping addresses', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        email: 'null@example.com',
        username: 'nulluser',
        shippingAddresses: null
      });
      await buyer.save();

      // Act
      const result = await getAddressesService.getAddresses(buyer._id.toString());

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle buyer with single shipping address', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        email: 'single@example.com',
        username: 'singleuser',
        shippingAddresses: [
          {
            addressType: 'home',
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Lagos',
            addressLine1: '789 Single Street',
            zipCode: '100003'
          }
        ]
      });
      await buyer.save();

      // Act
      const result = await getAddressesService.getAddresses(buyer._id.toString());

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].addressType).toBe('home');
      expect(result[0].addressLine1).toBe('789 Single Street');
      expect(result[0].addressLine2).toBeUndefined();
    });

    it('should handle complex address data', async () => {
      // Arrange
      const buyer = new Buyer({
        ...mockBuyerData,
        email: 'complex@example.com',
        username: 'complexuser',
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
          },
          {
            addressType: 'other',
            country: 'Nigeria',
            state: 'Abuja',
            city: 'Abuja',
            addressLine1: '789 Other Street',
            zipCode: '100003'
          }
        ]
      });
      await buyer.save();

      // Act
      const result = await getAddressesService.getAddresses(buyer._id.toString());

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].addressType).toBe('home');
      expect(result[1].addressType).toBe('work');
      expect(result[2].addressType).toBe('other');
      expect(result[2].state).toBe('Abuja');
      expect(result[2].city).toBe('Abuja');
    });

    it('should handle invalid ObjectId format', async () => {
      // Act & Assert
      await expect(
        getAddressesService.getAddresses('invalid-id')
      ).rejects.toThrow('Cast to ObjectId failed for value "invalid-id"');
    });
  });
}); 