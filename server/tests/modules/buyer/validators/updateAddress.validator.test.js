const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const updateAddressValidator = require('@modules/buyer/validators/updateAddress.validator');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('Update Address Validator', () => {
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
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('validateUpdateAddressData', () => {
    let testBuyer;
    let testAddressId;

    beforeEach(async () => {
      // Create a test buyer with an address
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          zipCode: '100001'
        }]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
    });

    it('should validate valid address update data', async () => {
      // Arrange
      const validUpdateData = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        addressLine2: 'Suite 100',
        zipCode: '100002'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        validUpdateData, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should throw ValidationError when buyer not found', async () => {
      // Arrange
      const updateData = { addressType: 'work' };
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        updateData, 
        nonExistentBuyerId, 
        testAddressId
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when address not found', async () => {
      // Arrange
      const updateData = { addressType: 'work' };
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        updateData, 
        testBuyer._id.toString(), 
        nonExistentAddressId
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when address type is invalid', async () => {
      // Arrange
      const invalidUpdateData = {
        addressType: 'invalid_type'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        invalidUpdateData, 
        testBuyer._id.toString(), 
        testAddressId
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when address type conflicts with existing address', async () => {
      // Arrange - Add another address with 'work' type
      testBuyer.shippingAddresses.push({
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      });
      await testBuyer.save();

      const conflictingUpdateData = {
        addressType: 'work' // This conflicts with the existing work address
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        conflictingUpdateData, 
        testBuyer._id.toString(), 
        testAddressId
      )).rejects.toThrow(ValidationError);
    });

    it('should allow updating address type when no conflict exists', async () => {
      // Arrange
      const updateData = {
        addressType: 'other'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        updateData, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should allow updating the same address type for the same address', async () => {
      // Arrange
      const updateData = {
        addressType: 'home' // Same as current
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        updateData, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });
  });

  describe('validateAddressExists', () => {
    let testBuyer;
    let testAddressId;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          zipCode: '100001'
        }]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
    });

    it('should not throw when buyer and address exist', async () => {
      // Act & Assert
      await expect(updateAddressValidator.validateAddressExists(
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should throw ValidationError when buyer not found', async () => {
      // Arrange
      const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(updateAddressValidator.validateAddressExists(
        nonExistentBuyerId, 
        testAddressId
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when address not found', async () => {
      // Arrange
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();

      // Act & Assert
      await expect(updateAddressValidator.validateAddressExists(
        testBuyer._id.toString(), 
        nonExistentAddressId
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('validateAddressTypeUpdate', () => {
    let testBuyer;
    let testAddressId;

    beforeEach(async () => {
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          zipCode: '100001'
        }]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
    });

    it('should not throw when address type is not being changed', async () => {
      // Act & Assert
      await expect(updateAddressValidator.validateAddressTypeUpdate(
        'home', 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should not throw when address type is not provided', async () => {
      // Act & Assert
      await expect(updateAddressValidator.validateAddressTypeUpdate(
        undefined, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should not throw when new address type is unique', async () => {
      // Act & Assert
      await expect(updateAddressValidator.validateAddressTypeUpdate(
        'work', 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should throw ValidationError when address type conflicts with existing address', async () => {
      // Arrange - Add another address with 'work' type
      testBuyer.shippingAddresses.push({
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      });
      await testBuyer.save();

      // Act & Assert
      await expect(updateAddressValidator.validateAddressTypeUpdate(
        'work', 
        testBuyer._id.toString(), 
        testAddressId
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('validateAddressTypeValue', () => {
    it('should not throw for valid address types', async () => {
      const validTypes = ['home', 'work', 'other'];
      
      for (const type of validTypes) {
        await expect(updateAddressValidator.validateAddressTypeValue(type))
          .resolves.not.toThrow();
      }
    });

    it('should not throw when address type is not provided', async () => {
      await expect(updateAddressValidator.validateAddressTypeValue(undefined))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid address type', async () => {
      await expect(updateAddressValidator.validateAddressTypeValue('invalid'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('validateCountry', () => {
    it('should not throw for valid country', async () => {
      await expect(updateAddressValidator.validateCountry('Nigeria'))
        .resolves.not.toThrow();
    });

    it('should not throw when country is not provided', async () => {
      await expect(updateAddressValidator.validateCountry(undefined))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for empty string', async () => {
      await expect(updateAddressValidator.validateCountry(''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace only', async () => {
      await expect(updateAddressValidator.validateCountry('   '))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string value', async () => {
      await expect(updateAddressValidator.validateCountry(123))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('validateState', () => {
    it('should not throw for valid state', async () => {
      await expect(updateAddressValidator.validateState('Lagos'))
        .resolves.not.toThrow();
    });

    it('should not throw when state is not provided', async () => {
      await expect(updateAddressValidator.validateState(undefined))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for empty string', async () => {
      await expect(updateAddressValidator.validateState(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('validateCity', () => {
    it('should not throw for valid city', async () => {
      await expect(updateAddressValidator.validateCity('Lagos'))
        .resolves.not.toThrow();
    });

    it('should not throw when city is not provided', async () => {
      await expect(updateAddressValidator.validateCity(undefined))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for empty string', async () => {
      await expect(updateAddressValidator.validateCity(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('validateAddressLine1', () => {
    it('should not throw for valid address line 1', async () => {
      await expect(updateAddressValidator.validateAddressLine1('123 Main Street'))
        .resolves.not.toThrow();
    });

    it('should not throw when address line 1 is not provided', async () => {
      await expect(updateAddressValidator.validateAddressLine1(undefined))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for empty string', async () => {
      await expect(updateAddressValidator.validateAddressLine1(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('validateZipCode', () => {
    it('should not throw for valid zip code', async () => {
      await expect(updateAddressValidator.validateZipCode('100001'))
        .resolves.not.toThrow();
    });

    it('should not throw when zip code is not provided', async () => {
      await expect(updateAddressValidator.validateZipCode(undefined))
        .resolves.not.toThrow();
    });

    it('should throw ValidationError for empty string', async () => {
      await expect(updateAddressValidator.validateZipCode(''))
        .rejects.toThrow(ValidationError);
    });
  });
}); 