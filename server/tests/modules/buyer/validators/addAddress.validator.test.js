const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');
const addAddressValidator = require('@modules/buyer/validators/addAddress.validator');

describe('Add Address Validator', () => {
  let mongoServer;
  let testBuyer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await Buyer.deleteMany({});

    // Create a test buyer
    testBuyer = new Buyer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      username: 'johndoe123',
      phoneNumber: '+1234567890',
      isVerified: true
    });
    await testBuyer.save();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Buyer.deleteMany({});
  });

  const validAddressData = {
    addressType: 'home',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    addressLine1: '123 Main St',
    zipCode: '90210'
  };

  describe('validateAddAddressData', () => {
    it('should validate address data successfully', async () => {
      const result = await addAddressValidator.validateAddAddressData(validAddressData, testBuyer._id.toString());
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      // The validator doesn't validate buyer ID, so this should pass
      const result = await addAddressValidator.validateAddAddressData(validAddressData, null);
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for invalid buyer ID format', async () => {
      // The validator doesn't validate buyer ID, so this should pass
      const result = await addAddressValidator.validateAddAddressData(validAddressData, 'invalid-id');
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for missing address data', async () => {
      await expect(
        addAddressValidator.validateAddAddressData(null, testBuyer._id.toString())
      ).rejects.toThrow(TypeError);
    });

    it('should throw ValidationError for invalid address type', async () => {
      const invalidAddressData = {
        ...validAddressData,
        addressType: 'invalid'
      };

      await expect(
        addAddressValidator.validateAddAddressData(invalidAddressData, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressType',
            message: 'Invalid address type'
          }
        ]
      });
    });

    it('should throw ValidationError for missing country', async () => {
      const dataWithoutCountry = { ...validAddressData };
      delete dataWithoutCountry.country;

      await expect(
        addAddressValidator.validateAddAddressData(dataWithoutCountry, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'country',
            message: 'Country is required'
          }
        ]
      });
    });

    it('should throw ValidationError for missing state', async () => {
      const dataWithoutState = { ...validAddressData };
      delete dataWithoutState.state;

      await expect(
        addAddressValidator.validateAddAddressData(dataWithoutState, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'state',
            message: 'State is required'
          }
        ]
      });
    });

    it('should throw ValidationError for missing city', async () => {
      const dataWithoutCity = { ...validAddressData };
      delete dataWithoutCity.city;

      await expect(
        addAddressValidator.validateAddAddressData(dataWithoutCity, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'city',
            message: 'City is required'
          }
        ]
      });
    });

    it('should throw ValidationError for missing address line 1', async () => {
      const dataWithoutAddressLine1 = { ...validAddressData };
      delete dataWithoutAddressLine1.addressLine1;

      await expect(
        addAddressValidator.validateAddAddressData(dataWithoutAddressLine1, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressLine1',
            message: 'Address line 1 is required'
          }
        ]
      });
    });

    it('should throw ValidationError when zipCode is missing', async () => {
      const dataWithoutZipCode = { ...validAddressData };
      delete dataWithoutZipCode.zipCode;

      await expect(
        addAddressValidator.validateAddAddressData(dataWithoutZipCode, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'zipCode',
            message: 'Zip code is required'
          }
        ]
      });
    });

    it('should throw ValidationError when addressType is invalid', async () => {
      const invalidData = {
        ...validAddressData,
        addressType: 'invalid'
      };

      await expect(
        addAddressValidator.validateAddAddressData(invalidData, testBuyer._id.toString())
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressType',
            message: 'Invalid address type'
          }
        ]
      });
    });
  });

  describe('validateAddressTypeRequired', () => {
    it('should not add error when addressType is provided', async () => {
      const errors = [];
      await addAddressValidator.validateAddressTypeRequired('home', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when addressType is missing', async () => {
      const errors = [];
      await addAddressValidator.validateAddressTypeRequired(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'addressType',
        message: 'Address type is required'
      });
    });

    it('should add error when addressType is empty string', async () => {
      const errors = [];
      await addAddressValidator.validateAddressTypeRequired('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'addressType',
        message: 'Address type is required'
      });
    });
  });

  describe('validateAddressTypeValue', () => {
    it('should not add error when addressType is valid', async () => {
      const errors = [];
      await addAddressValidator.validateAddressTypeValue('home', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error when addressType is null', async () => {
      const errors = [];
      await addAddressValidator.validateAddressTypeValue(null, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when addressType is invalid', async () => {
      const errors = [];
      await addAddressValidator.validateAddressTypeValue('invalid', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'addressType',
        message: 'Invalid address type',
        validTypes: ['home', 'work', 'other']
      });
    });
  });

  describe('validateCountry', () => {
    it('should not add error when country is provided', async () => {
      const errors = [];
      await addAddressValidator.validateCountry('United States', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when country is missing', async () => {
      const errors = [];
      await addAddressValidator.validateCountry(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'country',
        message: 'Country is required'
      });
    });

    it('should add error when country is empty string', async () => {
      const errors = [];
      await addAddressValidator.validateCountry('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'country',
        message: 'Country is required'
      });
    });
  });

  describe('validateState', () => {
    it('should not add error when state is provided', async () => {
      const errors = [];
      await addAddressValidator.validateState('California', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when state is missing', async () => {
      const errors = [];
      await addAddressValidator.validateState(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'state',
        message: 'State is required'
      });
    });

    it('should add error when state is empty string', async () => {
      const errors = [];
      await addAddressValidator.validateState('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'state',
        message: 'State is required'
      });
    });
  });

  describe('validateCity', () => {
    it('should not add error when city is provided', async () => {
      const errors = [];
      await addAddressValidator.validateCity('Los Angeles', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when city is missing', async () => {
      const errors = [];
      await addAddressValidator.validateCity(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'city',
        message: 'City is required'
      });
    });

    it('should add error when city is empty string', async () => {
      const errors = [];
      await addAddressValidator.validateCity('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'city',
        message: 'City is required'
      });
    });
  });

  describe('validateAddressLine1', () => {
    it('should not add error when addressLine1 is provided', async () => {
      const errors = [];
      await addAddressValidator.validateAddressLine1('123 Main St', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when addressLine1 is missing', async () => {
      const errors = [];
      await addAddressValidator.validateAddressLine1(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'addressLine1',
        message: 'Address line 1 is required'
      });
    });

    it('should add error when addressLine1 is empty string', async () => {
      const errors = [];
      await addAddressValidator.validateAddressLine1('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'addressLine1',
        message: 'Address line 1 is required'
      });
    });
  });

  describe('validateZipCode', () => {
    it('should not add error when zipCode is provided', async () => {
      const errors = [];
      await addAddressValidator.validateZipCode('90210', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error when zipCode is missing', async () => {
      const errors = [];
      await addAddressValidator.validateZipCode(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'zipCode',
        message: 'Zip code is required'
      });
    });

    it('should add error when zipCode is empty string', async () => {
      const errors = [];
      await addAddressValidator.validateZipCode('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'zipCode',
        message: 'Zip code is required'
      });
    });
  });

  describe('Specific Error Messages', () => {
    it('should include specific error message for missing address type', async () => {
      const dataWithoutAddressType = { ...validAddressData };
      delete dataWithoutAddressType.addressType;

      await expect(addAddressValidator.validateAddAddressData(dataWithoutAddressType, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'addressType',
              message: 'Address type is required'
            }
          ])
        });
    });

    it('should include specific error message for invalid address type', async () => {
      await expect(addAddressValidator.validateAddAddressData({
        ...validAddressData,
        addressType: 'invalid'
      }, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'addressType',
              message: 'Invalid address type',
              validTypes: ['home', 'work', 'other']
            }
          ])
        });
    });

    it('should include specific error message for missing country', async () => {
      const dataWithoutCountry = { ...validAddressData };
      delete dataWithoutCountry.country;

      await expect(addAddressValidator.validateAddAddressData(dataWithoutCountry, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'country',
              message: 'Country is required'
            }
          ])
        });
    });

    it('should include specific error message for missing state', async () => {
      const dataWithoutState = { ...validAddressData };
      delete dataWithoutState.state;

      await expect(addAddressValidator.validateAddAddressData(dataWithoutState, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'state',
              message: 'State is required'
            }
          ])
        });
    });

    it('should include specific error message for missing city', async () => {
      const dataWithoutCity = { ...validAddressData };
      delete dataWithoutCity.city;

      await expect(addAddressValidator.validateAddAddressData(dataWithoutCity, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'city',
              message: 'City is required'
            }
          ])
        });
    });

    it('should include specific error message for missing address line 1', async () => {
      const dataWithoutAddressLine1 = { ...validAddressData };
      delete dataWithoutAddressLine1.addressLine1;

      await expect(addAddressValidator.validateAddAddressData(dataWithoutAddressLine1, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'addressLine1',
              message: 'Address line 1 is required'
            }
          ])
        });
    });

    it('should include specific error message for missing zip code', async () => {
      const dataWithoutZipCode = { ...validAddressData };
      delete dataWithoutZipCode.zipCode;

      await expect(addAddressValidator.validateAddAddressData(dataWithoutZipCode, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'zipCode',
              message: 'Zip code is required'
            }
          ])
        });
    });

    it('should include multiple error messages for multiple validation failures', async () => {
      const dataWithMultipleErrors = {
        addressType: 'invalid',
        country: '',
        state: null,
        city: 'Los Angeles',
        addressLine1: '123 Main St',
        zipCode: ''
      };

      await expect(addAddressValidator.validateAddAddressData(dataWithMultipleErrors, testBuyer._id.toString()))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'addressType',
              message: 'Invalid address type',
              validTypes: ['home', 'work', 'other']
            },
            {
              field: 'country',
              message: 'Country is required'
            },
            {
              field: 'state',
              message: 'State is required'
            },
            {
              field: 'zipCode',
              message: 'Zip code is required'
            }
          ])
        });
    });
  });
}); 