const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const deleteAddressService = require('@modules/buyer/services/deleteAddress.service');
const Buyer = require('@models/Buyer');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('deleteAddress.service', () => {
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

  describe('Success cases', () => {
    it('should delete an address successfully', async () => {
      const result = await deleteAddressService.deleteAddress(buyer._id.toString(), addressId);

      expect(result).toEqual({
        message: 'Address deleted successfully'
      });

      // Verify address was actually deleted
      const updatedBuyer = await Buyer.findById(buyer._id);
      expect(updatedBuyer.shippingAddresses).toHaveLength(1);
      expect(updatedBuyer.shippingAddresses[0].addressType).toBe('work');
    });

    it('should delete the last address successfully', async () => {
      // Delete the second address first
      const secondAddressId = buyer.shippingAddresses[1]._id.toString();
      await deleteAddressService.deleteAddress(buyer._id.toString(), secondAddressId);

      // Now delete the first address
      const result = await deleteAddressService.deleteAddress(buyer._id.toString(), addressId);

      expect(result).toEqual({
        message: 'Address deleted successfully'
      });

      // Verify all addresses were deleted
      const updatedBuyer = await Buyer.findById(buyer._id);
      expect(updatedBuyer.shippingAddresses).toHaveLength(0);
    });
  });

  describe('Validation errors', () => {
    it('should throw ValidationError when addressId is missing', async () => {
      await expect(
        deleteAddressService.deleteAddress(buyer._id.toString(), null)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is empty string', async () => {
      await expect(
        deleteAddressService.deleteAddress(buyer._id.toString(), '')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is invalid format', async () => {
      await expect(
        deleteAddressService.deleteAddress(buyer._id.toString(), 'invalid-id')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Not found errors', () => {
    it('should throw NotFoundException when buyer does not exist', async () => {
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressService.deleteAddress(nonExistentBuyerId, addressId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when address does not exist', async () => {
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();

      await expect(
        deleteAddressService.deleteAddress(buyer._id.toString(), nonExistentAddressId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when buyer has no addresses', async () => {
      // Create buyer with no addresses
      const buyerWithNoAddresses = new Buyer({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
      phoneNumber: '+2348012345678',
        email: 'jane.smith@example.com',
        password: 'password123',
        shippingAddresses: []
      });
      await buyerWithNoAddresses.save();

      await expect(
        deleteAddressService.deleteAddress(buyerWithNoAddresses._id.toString(), addressId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge cases', () => {
    it('should handle buyer with null shippingAddresses', async () => {
      // Create buyer with null shippingAddresses
      const buyerWithNullAddresses = new Buyer({
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bobjohnson',
      phoneNumber: '+2348012345678',
        email: 'bob.johnson@example.com',
        password: 'password123',
        shippingAddresses: null
      });
      await buyerWithNullAddresses.save();

      await expect(
        deleteAddressService.deleteAddress(buyerWithNullAddresses._id.toString(), addressId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle buyer with undefined shippingAddresses', async () => {
      // Create buyer with undefined shippingAddresses
      const buyerWithUndefinedAddresses = new Buyer({
        firstName: 'Alice',
        lastName: 'Brown',
        username: 'alicebrown',
      phoneNumber: '+2348012345678',
        email: 'alice.brown@example.com',
        password: 'password123'
      });
      buyerWithUndefinedAddresses.shippingAddresses = undefined;
      await buyerWithUndefinedAddresses.save();

      await expect(
        deleteAddressService.deleteAddress(buyerWithUndefinedAddresses._id.toString(), addressId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Database errors', () => {
    it('should handle database save errors', async () => {
      // Mock the repository to simulate save failure
      const originalDeleteShippingAddress = require('@modules/buyer/repositories/buyer.repository').deleteShippingAddress;
      
              require('@modules/buyer/repositories/buyer.repository').deleteShippingAddress = jest.fn().mockResolvedValue(null);

      await expect(
        deleteAddressService.deleteAddress(buyer._id.toString(), addressId)
      ).rejects.toThrow('Failed to delete address');

      // Restore original function
              require('@modules/buyer/repositories/buyer.repository').deleteShippingAddress = originalDeleteShippingAddress;
    });
  });
}); 