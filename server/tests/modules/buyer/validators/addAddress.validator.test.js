const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const addAddressValidator = require('@modules/buyer/validators/addAddress.validator');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const Buyer = require('@modules/buyer/models/buyer.model');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('Add Address Validator', () => {
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

  describe('validateAddAddressData', () => {
    let testBuyer;
    const validAddressData = {
      addressType: 'home',
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Lagos',
      addressLine1: '123 Main Street',
      addressLine2: 'Apt 4B',
      zipCode: '100001'
    };

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: []
      });
      await testBuyer.save();
    });

    it('should validate address data successfully', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(validAddressData, testBuyer._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when addressType is missing', async () => {
      // Arrange
      const invalidData = { ...validAddressData };
      delete invalidData.addressType;

      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when country is missing', async () => {
      // Arrange
      const invalidData = { ...validAddressData };
      delete invalidData.country;

      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when state is missing', async () => {
      // Arrange
      const invalidData = { ...validAddressData };
      delete invalidData.state;

      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when city is missing', async () => {
      // Arrange
      const invalidData = { ...validAddressData };
      delete invalidData.city;

      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressLine1 is missing', async () => {
      // Arrange
      const invalidData = { ...validAddressData };
      delete invalidData.addressLine1;

      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when zipCode is missing', async () => {
      // Arrange
      const invalidData = { ...validAddressData };
      delete invalidData.zipCode;

      // Act & Assert
      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateAddressType', () => {
    let testBuyer;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: []
      });
      await testBuyer.save();
    });

    it('should validate valid address types', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateAddressType('home', testBuyer._id.toString())
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateAddressType('work', testBuyer._id.toString())
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateAddressType('other', testBuyer._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when addressType is missing', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateAddressType(null, testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateAddressType('', testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when addressType is invalid', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateAddressType('invalid', testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateAddressType('office', testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when address type already exists', async () => {
      // Arrange - Add existing address with same type
      const existingAddress = {
        addressType: 'home',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '789 Old Street',
        zipCode: '100003'
      };

      testBuyer.shippingAddresses = [existingAddress];
      await testBuyer.save();

      // Act & Assert
      await expect(
        addAddressValidator.validateAddressType('home', testBuyer._id.toString())
      ).rejects.toThrow(ValidationError);
    });

    it('should allow different address types for same buyer', async () => {
      // Arrange - Add existing address with different type
      const existingAddress = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '789 Old Street',
        zipCode: '100003'
      };

      testBuyer.shippingAddresses = [existingAddress];
      await testBuyer.save();

      // Act & Assert
      await expect(
        addAddressValidator.validateAddressType('home', testBuyer._id.toString())
      ).resolves.not.toThrow();
    });
  });

  describe('validateAddressTypeRequired', () => {
    it('should not throw error when addressType is provided', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeRequired('home', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when addressType is missing', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeRequired(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('addressType');
      expect(errors[0].message).toBe('Address type is required');
    });

    it('should add error when addressType is empty string', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeRequired('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('addressType');
      expect(errors[0].message).toBe('Address type is required');
    });
  });

  describe('validateAddressTypeValue', () => {
    it('should not throw error when addressType is valid', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeValue('home', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error when addressType is null', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeValue(null, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when addressType is invalid', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeValue('invalid', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('addressType');
      expect(errors[0].message).toBe('Invalid address type');
      expect(errors[0].validTypes).toEqual(['home', 'work', 'other']);
    });
  });

  describe('validateAddressTypeUniqueness', () => {
    let testBuyer;

    beforeEach(async () => {
      // Create a test buyer
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: []
      });
      await testBuyer.save();
    });

    it('should not add error when addressType is unique', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeUniqueness('home', testBuyer._id.toString(), errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error when addressType is null', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeUniqueness(null, testBuyer._id.toString(), errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error when buyerId is null', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeUniqueness('home', null, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when addressType already exists', async () => {
      // Arrange - Add existing address with same type
      const existingAddress = {
        addressType: 'home',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Lagos',
        addressLine1: '789 Old Street',
        zipCode: '100003'
      };

      testBuyer.shippingAddresses = [existingAddress];
      await testBuyer.save();

      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeUniqueness('home', testBuyer._id.toString(), errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('addressType');
      expect(errors[0].message).toBe("Address type 'home' already exists. Please use a different type or update the existing address.");
    });

    it('should not add error when buyer has no addresses', async () => {
      // Act & Assert
      const errors = [];
      await addAddressValidator.validateAddressTypeUniqueness('home', testBuyer._id.toString(), errors);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateCountry', () => {
    it('should validate valid country', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateCountry('Nigeria')
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateCountry('United States')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when country is missing', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateCountry(null)
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateCountry('')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateState', () => {
    it('should validate valid state', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateState('Lagos')
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateState('Abuja')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when state is missing', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateState(null)
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateState('')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateCity', () => {
    it('should validate valid city', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateCity('Lagos')
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateCity('Victoria Island')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when city is missing', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateCity(null)
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateCity('')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateAddressLine1', () => {
    it('should validate valid address line 1', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateAddressLine1('123 Main Street')
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateAddressLine1('456 Business Avenue')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when addressLine1 is missing', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateAddressLine1(null)
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateAddressLine1('')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateZipCode', () => {
    it('should validate valid zip code', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateZipCode('100001')
      ).resolves.not.toThrow();

      await expect(
        addAddressValidator.validateZipCode('100002')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when zipCode is missing', async () => {
      // Act & Assert
      await expect(
        addAddressValidator.validateZipCode(null)
      ).rejects.toThrow(ValidationError);

      await expect(
        addAddressValidator.validateZipCode('')
      ).rejects.toThrow(ValidationError);
    });
  });
}); 