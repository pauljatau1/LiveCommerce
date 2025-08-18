const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const deleteAddressValidator = require('@modules/buyer/validators/deleteAddress.validator');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

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
      const validData = {
        addressId: addressId,
        buyerId: buyer._id.toString()
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(validData)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when addressId is missing', async () => {
      const data = {
        buyerId: buyer._id.toString()
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when addressId is null', async () => {
      const data = {
        addressId: null,
        buyerId: buyer._id.toString()
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when addressId is empty string', async () => {
      const data = {
        addressId: '',
        buyerId: buyer._id.toString()
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when addressId is not a string', async () => {
      const data = {
        addressId: 123,
        buyerId: buyer._id.toString()
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when addressId is invalid format', async () => {
      const data = {
        addressId: 'invalid-id',
        buyerId: buyer._id.toString()
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Invalid address ID format'
          }
        ]
      });
    });



    it('should throw ValidationError when buyerId is missing', async () => {
      const data = {
        addressId: addressId
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: expect.arrayContaining([
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ])
      });
    });

    it('should throw ValidationError when buyerId is null', async () => {
      const data = {
        addressId: addressId,
        buyerId: null
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow(ValidationError);
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toMatchObject({
        errors: expect.arrayContaining([
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ])
      });
    });

    it('should throw error when buyerId is invalid format', async () => {
      const data = {
        addressId: addressId,
        buyerId: 'invalid-buyer-id'
      };
      await expect(
        deleteAddressValidator.validateDeleteAddressData(data)
      ).rejects.toThrow();
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing addressId', async () => {
        await expect(deleteAddressValidator.validateDeleteAddressData({
          buyerId: buyer._id.toString()
        })).rejects.toMatchObject({
          errors: [{ field: 'addressId', message: 'Address ID is required' }]
        });
      });

      it('should include specific error message for non-string addressId', async () => {
        await expect(deleteAddressValidator.validateDeleteAddressData({
          addressId: 123,
          buyerId: buyer._id.toString()
        })).rejects.toMatchObject({
          errors: [{ field: 'addressId', message: 'Address ID must be a string' }]
        });
      });

      it('should include specific error message for invalid addressId format', async () => {
        await expect(deleteAddressValidator.validateDeleteAddressData({
          addressId: 'invalid-id',
          buyerId: buyer._id.toString()
        })).rejects.toMatchObject({
          errors: [{ field: 'addressId', message: 'Invalid address ID format' }]
        });
      });


    });
  });
}); 