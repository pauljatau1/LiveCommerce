const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the validator
const getShippingLabelValidator = require('@modules/seller/validators/getShippingLabel.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Get Shipping Label Validator', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('validateGetShippingLabelData', () => {
    const validData = {
      orderId: new mongoose.Types.ObjectId().toString(),
      itemId: new mongoose.Types.ObjectId().toString(),
      sellerId: new mongoose.Types.ObjectId().toString()
    };

    it('should pass validation with valid data', async () => {
      // Should not throw any error
      await expect(getShippingLabelValidator.validateGetShippingLabelData(validData))
        .resolves.toBeUndefined();
    });

    it('should throw ValidationError when orderId is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.orderId;

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Order ID is required');
      }
    });

    it('should throw ValidationError when orderId is empty string', async () => {
      const invalidData = { ...validData, orderId: '' };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Order ID is required');
      }
    });

    it('should throw ValidationError when orderId is null', async () => {
      const invalidData = { ...validData, orderId: null };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Order ID is required');
      }
    });

    it('should throw ValidationError when orderId is undefined', async () => {
      const invalidData = { ...validData, orderId: undefined };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Order ID is required');
      }
    });

    it('should throw ValidationError when orderId is not a valid ObjectId', async () => {
      const invalidData = { ...validData, orderId: 'invalid-object-id' };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Order ID must be a valid ObjectId');
      }
    });

    it('should throw ValidationError when itemId is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.itemId;

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Item ID is required');
      }
    });

    it('should throw ValidationError when itemId is empty string', async () => {
      const invalidData = { ...validData, itemId: '' };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Item ID is required');
      }
    });

    it('should throw ValidationError when itemId is null', async () => {
      const invalidData = { ...validData, itemId: null };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Item ID is required');
      }
    });

    it('should throw ValidationError when itemId is undefined', async () => {
      const invalidData = { ...validData, itemId: undefined };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Item ID is required');
      }
    });

    it('should throw ValidationError when itemId is not a valid ObjectId', async () => {
      const invalidData = { ...validData, itemId: 'invalid-object-id' };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Item ID must be a valid ObjectId');
      }
    });

    it('should throw ValidationError when sellerId is missing', async () => {
      const invalidData = { ...validData };
      delete invalidData.sellerId;

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Seller ID is required');
      }
    });

    it('should throw ValidationError when sellerId is empty string', async () => {
      const invalidData = { ...validData, sellerId: '' };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Seller ID is required');
      }
    });

    it('should throw ValidationError when sellerId is null', async () => {
      const invalidData = { ...validData, sellerId: null };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Seller ID is required');
      }
    });

    it('should throw ValidationError when sellerId is undefined', async () => {
      const invalidData = { ...validData, sellerId: undefined };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Seller ID is required');
      }
    });

    it('should throw ValidationError when sellerId is not a valid ObjectId', async () => {
      const invalidData = { ...validData, sellerId: 'invalid-object-id' };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toContain('Seller ID must be a valid ObjectId');
      }
    });

    it('should throw ValidationError with multiple errors when multiple fields are invalid', async () => {
      const invalidData = {
        orderId: 'invalid-order-id',
        itemId: '',
        sellerId: null
      };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(3);
        expect(error.errors).toContain('Order ID must be a valid ObjectId');
        expect(error.errors).toContain('Item ID is required');
        expect(error.errors).toContain('Seller ID is required');
      }
    });

    it('should accept valid ObjectId strings in different formats', async () => {
      const validObjectIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toHexString(),
        new mongoose.Types.ObjectId().toString()
      ];

      for (const orderId of validObjectIds) {
        const testData = { ...validData, orderId };
        await expect(getShippingLabelValidator.validateGetShippingLabelData(testData))
          .resolves.toBeUndefined();
      }
    });

    it('should handle edge cases with whitespace', async () => {
      const invalidData = {
        orderId: '   ',
        itemId: '\t',
        sellerId: '\n'
      };

      await expect(getShippingLabelValidator.validateGetShippingLabelData(invalidData))
        .rejects.toThrow(ValidationError);

      try {
        await getShippingLabelValidator.validateGetShippingLabelData(invalidData);
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toHaveLength(3);
        expect(error.errors).toContain('Order ID must be a valid ObjectId');
        expect(error.errors).toContain('Item ID must be a valid ObjectId');
        expect(error.errors).toContain('Seller ID must be a valid ObjectId');
      }
    });
  });
});
