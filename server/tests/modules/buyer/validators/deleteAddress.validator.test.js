const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const deleteAddressValidator = require('../../../../src/modules/buyer/validators/deleteAddress.validator');
const Buyer = require('../../../../src/modules/buyer/models/buyer.model');
const NotFoundException = require('../../../../src/utils/errors/NotFoundException');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

let mongoServer;

describe('deleteAddress.validator', () => {
  let buyer;
  let addressId;

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

    // Create a test buyer
    buyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
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

    await buyer.save();
    addressId = buyer.shippingAddresses[0]._id.toString();
  });

  describe('validateDeleteAddressData', () => {
    it('should pass validation with valid data', async () => {
      await expect(
        deleteAddressValidator.validateDeleteAddressData(addressId, buyer._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when addressId is missing', async () => {
      await expect(
        deleteAddressValidator.validateDeleteAddressData(null, buyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is empty string', async () => {
      await expect(
        deleteAddressValidator.validateDeleteAddressData('', buyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is invalid format', async () => {
      await expect(
        deleteAddressValidator.validateDeleteAddressData('invalid-id', buyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundException when buyer does not exist', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressValidator.validateDeleteAddressData(addressId, nonExistentBuyerId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when address does not exist', async () => {
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressValidator.validateDeleteAddressData(nonExistentAddressId, buyer._id.toString())
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateAddressId', () => {
    it('should pass validation with valid addressId', async () => {
      await expect(
        deleteAddressValidator.validateAddressId(addressId)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when addressId is null', async () => {
      await expect(
        deleteAddressValidator.validateAddressId(null)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is undefined', async () => {
      await expect(
        deleteAddressValidator.validateAddressId(undefined)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is empty string', async () => {
      await expect(
        deleteAddressValidator.validateAddressId('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is invalid format', async () => {
      await expect(
        deleteAddressValidator.validateAddressId('invalid-id')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is not a string', async () => {
      await expect(
        deleteAddressValidator.validateAddressId(123)
      ).rejects.toThrow(ValidationError);
    });

    it('should pass validation with valid ObjectId string', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      await expect(
        deleteAddressValidator.validateAddressId(validObjectId)
      ).resolves.not.toThrow();
    });
  });

  describe('validateBuyerExists', () => {
    it('should pass validation when buyer exists', async () => {
      await expect(
        deleteAddressValidator.validateBuyerExists(buyer._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when buyer does not exist', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressValidator.validateBuyerExists(nonExistentBuyerId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when buyerId is invalid format', async () => {
      await expect(
        deleteAddressValidator.validateBuyerExists('invalid-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateAddressExists', () => {
    it('should pass validation when address exists', async () => {
      await expect(
        deleteAddressValidator.validateAddressExists(addressId, buyer._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException when address does not exist', async () => {
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressValidator.validateAddressExists(nonExistentAddressId, buyer._id.toString())
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when buyer has no addresses', async () => {
      // Create buyer with no addresses
      const buyerWithNoAddresses = new Buyer({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane.smith@example.com',
        password: 'password123',
        shippingAddresses: []
      });
      await buyerWithNoAddresses.save();

      await expect(
        deleteAddressValidator.validateAddressExists(addressId, buyerWithNoAddresses._id.toString())
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when buyer has null shippingAddresses', async () => {
      // Create buyer with null shippingAddresses
      const buyerWithNullAddresses = new Buyer({
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bobjohnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
        shippingAddresses: null
      });
      await buyerWithNullAddresses.save();

      await expect(
        deleteAddressValidator.validateAddressExists(addressId, buyerWithNullAddresses._id.toString())
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when buyer has undefined shippingAddresses', async () => {
      // Create buyer with undefined shippingAddresses
      const buyerWithUndefinedAddresses = new Buyer({
        firstName: 'Alice',
        lastName: 'Brown',
        username: 'alicebrown',
        email: 'alice.brown@example.com',
        password: 'password123'
      });
      buyerWithUndefinedAddresses.shippingAddresses = undefined;
      await buyerWithUndefinedAddresses.save();

      await expect(
        deleteAddressValidator.validateAddressExists(addressId, buyerWithUndefinedAddresses._id.toString())
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when buyer does not exist', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressValidator.validateAddressExists(addressId, nonExistentBuyerId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge cases', () => {
    it('should handle case-sensitive addressId comparison', async () => {
      // This test ensures that the comparison is done correctly
      await expect(
        deleteAddressValidator.validateAddressExists(addressId, buyer._id.toString())
      ).resolves.not.toThrow();
    });

    it('should handle very long addressId strings', async () => {
      const longAddressId = 'a'.repeat(1000);
      await expect(
        deleteAddressValidator.validateAddressId(longAddressId)
      ).rejects.toThrow(ValidationError);
    });

    it('should handle special characters in addressId', async () => {
      const specialCharAddressId = 'address@#$%^&*()';
      await expect(
        deleteAddressValidator.validateAddressId(specialCharAddressId)
      ).rejects.toThrow(ValidationError);
    });
  });
}); 