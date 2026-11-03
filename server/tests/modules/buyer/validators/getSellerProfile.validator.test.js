const getSellerProfileValidator = require('@modules/buyer/validators/getSellerProfile.validator');

describe('getSellerProfile.validator', () => {
  describe('validateGetSellerProfileData', () => {
    it('should pass validation for valid data', async () => {
      const validData = {
        sellerId: '507f1f77bcf86cd799439011'
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(validData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing seller ID', async () => {
      const invalidData = {};

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for null seller ID', async () => {
      const invalidData = { sellerId: null };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for undefined seller ID', async () => {
      const invalidData = { sellerId: undefined };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string seller ID', async () => {
      const invalidData = { sellerId: '' };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for non-string seller ID', async () => {
      const invalidData = { sellerId: 123 };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid seller ID format', async () => {
      const invalidData = { sellerId: 'invalid-id' };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Invalid seller ID format'
          }
        ]
      });
    });

    it('should throw ValidationError for empty data object', async () => {
      const invalidData = {};

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required'
          }
        ]
      });
    });

    it('should include specific error message for missing seller ID', async () => {
      const invalidData = {};

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID is required'
          }
        ]
      });
    });

    it('should include specific error message for non-string seller ID', async () => {
      const invalidData = {
        sellerId: 123
      };

      await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData)).rejects.toMatchObject({
        errors: [
          {
            field: 'sellerId',
            message: 'Seller ID must be a string'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing seller ID', async () => {
        const invalidData = {};

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID is required'
              }
            ])
          });
      });

      it('should include specific error message for null seller ID', async () => {
        const invalidData = {
          sellerId: null
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID is required'
              }
            ])
          });
      });

      it('should include specific error message for empty string seller ID', async () => {
        const invalidData = {
          sellerId: ''
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID is required'
              }
            ])
          });
      });

      it('should include specific error message for undefined seller ID', async () => {
        const invalidData = {
          sellerId: undefined
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID is required'
              }
            ])
          });
      });

      it('should include specific error message for non-string seller ID (number)', async () => {
        const invalidData = {
          sellerId: 123
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID must be a string'
              }
            ])
          });
      });

      it('should include specific error message for non-string seller ID (boolean)', async () => {
        const invalidData = {
          sellerId: true
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID must be a string'
              }
            ])
          });
      });

      it('should include specific error message for non-string seller ID (object)', async () => {
        const invalidData = {
          sellerId: {}
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID must be a string'
              }
            ])
          });
      });

      it('should include specific error message for non-string seller ID (array)', async () => {
        const invalidData = {
          sellerId: []
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(invalidData))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'sellerId',
                message: 'Seller ID must be a string'
              }
            ])
          });
      });

      it('should not throw error for valid seller ID', async () => {
        const validData = {
          sellerId: '507f1f77bcf86cd799439011'
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(validData))
          .resolves.not.toThrow();
      });

      it('should not throw error for valid seller ID with special characters', async () => {
        const validData = {
          sellerId: '507f1f77bcf86cd799439012'
        };

        await expect(getSellerProfileValidator.validateGetSellerProfileData(validData))
          .resolves.not.toThrow();
      });
    });
  });
}); 