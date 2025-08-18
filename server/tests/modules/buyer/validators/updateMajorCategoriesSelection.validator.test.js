const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const updateMajorCategoriesSelectionValidator = require('@modules/buyer/validators/updateMajorCategoriesSelection.validator');
const ValidationError = require('@utils/errors/ValidationError');

let mongoServer;

describe('updateMajorCategoriesSelection.validator', () => {
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

  describe('validateUpdateMajorCategoriesSelectionData', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        buyerId: new mongoose.Types.ObjectId().toString(),
        majorCategoryIds: [
          new mongoose.Types.ObjectId().toString(),
          new mongoose.Types.ObjectId().toString()
        ]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(validData)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when buyerId is missing', async () => {
      const data = {
        majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when buyerId is null', async () => {
      const data = {
        buyerId: null,
        majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when buyerId is not a string', async () => {
      const data = {
        buyerId: 123,
        majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when buyerId has invalid format', async () => {
      const data = {
        buyerId: 'invalid-id',
        majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError when majorCategoryIds is missing', async () => {
      const data = {
        buyerId: new mongoose.Types.ObjectId().toString()
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'majorCategoryIds',
            message: 'majorCategoryIds array is required'
          }
        ]
      });
    });

    it('should throw ValidationError when majorCategoryIds is null', async () => {
      const data = {
        buyerId: new mongoose.Types.ObjectId().toString(),
        majorCategoryIds: null
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'majorCategoryIds',
            message: 'majorCategoryIds array is required'
          }
        ]
      });
    });

    it('should throw ValidationError when majorCategoryIds is not an array', async () => {
      const data = {
        buyerId: new mongoose.Types.ObjectId().toString(),
        majorCategoryIds: 'not-an-array'
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'majorCategoryIds',
            message: 'majorCategoryIds must be an array'
          }
        ]
      });
    });

    it('should throw ValidationError when majorCategoryIds array is empty', async () => {
      const data = {
        buyerId: new mongoose.Types.ObjectId().toString(),
        majorCategoryIds: []
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'majorCategoryIds',
            message: 'majorCategoryIds array cannot be empty'
          }
        ]
      });
    });

    it('should throw ValidationError when majorCategoryIds contains non-string values', async () => {
      const data = {
        buyerId: new mongoose.Types.ObjectId().toString(),
        majorCategoryIds: [123, new mongoose.Types.ObjectId().toString()]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'majorCategoryIds[0]',
            message: 'must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError when majorCategoryIds contains invalid ObjectIds', async () => {
      const data = {
        buyerId: new mongoose.Types.ObjectId().toString(),
        majorCategoryIds: ['invalid-id', new mongoose.Types.ObjectId().toString()]
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'majorCategoryIds[0]',
            message: 'must be a valid ObjectId'
          }
        ]
      });
    });

    it('should throw ValidationError when both buyerId and majorCategoryIds are invalid', async () => {
      const data = {
        buyerId: 'invalid-id',
        majorCategoryIds: 'not-an-array'
      };

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toThrow(ValidationError);

      await expect(
        updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData(data)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyerId', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
        })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID is required' }]
        });
      });

      it('should include specific error message for non-string buyerId', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: 123,
          majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
        })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer ID must be a string' }]
        });
      });

      it('should include specific error message for invalid buyerId format', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: 'invalid-id',
          majorCategoryIds: [new mongoose.Types.ObjectId().toString()]
        })).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Invalid buyer ID format' }]
        });
      });

      it('should include specific error message for missing majorCategoryIds', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: new mongoose.Types.ObjectId().toString()
        })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array is required' }]
        });
      });

      it('should include specific error message for non-array majorCategoryIds', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: new mongoose.Types.ObjectId().toString(),
          majorCategoryIds: 'not-an-array'
        })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds must be an array' }]
        });
      });

      it('should include specific error message for empty majorCategoryIds array', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: new mongoose.Types.ObjectId().toString(),
          majorCategoryIds: []
        })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds', message: 'majorCategoryIds array cannot be empty' }]
        });
      });

      it('should include specific error message for non-string majorCategoryIds items', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: new mongoose.Types.ObjectId().toString(),
          majorCategoryIds: [123, 'valid-id']
        })).rejects.toMatchObject({
          errors: [
            { field: 'majorCategoryIds[0]', message: 'must be a string' },
            { field: 'majorCategoryIds[1]', message: 'must be a valid ObjectId' }
          ]
        });
      });

      it('should include specific error message for invalid ObjectId in majorCategoryIds', async () => {
        await expect(updateMajorCategoriesSelectionValidator.validateUpdateMajorCategoriesSelectionData({
          buyerId: new mongoose.Types.ObjectId().toString(),
          majorCategoryIds: ['invalid-id', new mongoose.Types.ObjectId().toString()]
        })).rejects.toMatchObject({
          errors: [{ field: 'majorCategoryIds[0]', message: 'must be a valid ObjectId' }]
        });
      });
    });
  });
});
