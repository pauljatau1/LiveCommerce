const verifyWalletTopUpValidator = require('@modules/buyer/validators/verifyWalletTopUp.validator');

describe('Verify Wallet Top Up Validator', () => {
  describe('validatePaymentReference', () => {
    it('should not throw for valid payment reference', () => {
      const errors = [];
      const validReference = 'PAY_REF_123456';

      verifyWalletTopUpValidator.validatePaymentReference(validReference, errors);

      expect(errors).toHaveLength(0);
    });

    it('should add error for null reference', () => {
      const errors = [];
      const nullReference = null;

      verifyWalletTopUpValidator.validatePaymentReference(nullReference, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'reference',
        message: 'Payment reference is required'
      });
    });

    it('should add error for undefined reference', () => {
      const errors = [];
      const undefinedReference = undefined;

      verifyWalletTopUpValidator.validatePaymentReference(undefinedReference, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'reference',
        message: 'Payment reference is required'
      });
    });

    it('should add error for non-string reference', () => {
      const errors = [];
      const nonStringReference = 123;

      verifyWalletTopUpValidator.validatePaymentReference(nonStringReference, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'reference',
        message: 'Payment reference is required'
      });
    });

    it('should add error for empty string reference', () => {
      const errors = [];
      const emptyReference = '';

      verifyWalletTopUpValidator.validatePaymentReference(emptyReference, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'reference',
        message: 'Payment reference cannot be empty'
      });
    });

    it('should add error for whitespace-only reference', () => {
      const errors = [];
      const whitespaceReference = '   ';

      verifyWalletTopUpValidator.validatePaymentReference(whitespaceReference, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'reference',
        message: 'Payment reference cannot be empty'
      });
    });

    it('should add error for invalid reference format', () => {
      const errors = [];
      const invalidReference = 'invalid@reference#';

      verifyWalletTopUpValidator.validatePaymentReference(invalidReference, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'reference',
        message: 'Invalid payment reference format'
      });
    });
  });

  describe('validateBuyerId', () => {
    it('should not throw for valid buyer ID', () => {
      const errors = [];
      const validBuyerId = '507f1f77bcf86cd799439011';

      verifyWalletTopUpValidator.validateBuyerId(validBuyerId, errors);

      expect(errors).toHaveLength(0);
    });

    it('should add error for null buyer ID', () => {
      const errors = [];
      const nullBuyerId = null;

      verifyWalletTopUpValidator.validateBuyerId(nullBuyerId, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID is required'
      });
    });

    it('should add error for undefined buyer ID', () => {
      const errors = [];
      const undefinedBuyerId = undefined;

      verifyWalletTopUpValidator.validateBuyerId(undefinedBuyerId, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID is required'
      });
    });

    it('should add error for non-string buyer ID', () => {
      const errors = [];
      const nonStringBuyerId = 123;

      verifyWalletTopUpValidator.validateBuyerId(nonStringBuyerId, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID is required'
      });
    });

    it('should add error for empty string buyer ID', () => {
      const errors = [];
      const emptyBuyerId = '';

      verifyWalletTopUpValidator.validateBuyerId(emptyBuyerId, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Buyer ID cannot be empty'
      });
    });

    it('should add error for invalid buyer ID format', () => {
      const errors = [];
      const invalidBuyerId = 'invalid-id';

      verifyWalletTopUpValidator.validateBuyerId(invalidBuyerId, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'buyerId',
        message: 'Invalid buyer ID format'
      });
    });
  });

  describe('validatePaystackResponse', () => {
    it('should not throw for valid Paystack response', () => {
      const errors = [];
      const validResponse = {
        data: {
          status: true,
          data: {
            reference: 'PAY_REF_123456',
            amount: 1000,
            status: 'success'
          }
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(validResponse, errors);

      expect(errors).toHaveLength(0);
    });

    it('should add error for null response', () => {
      const errors = [];
      const nullResponse = null;

      verifyWalletTopUpValidator.validatePaystackResponse(nullResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'verificationResponse',
        message: 'Invalid verification response'
      });
    });

    it('should add error for missing data property', () => {
      const errors = [];
      const invalidResponse = {};

      verifyWalletTopUpValidator.validatePaystackResponse(invalidResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'verificationResponse',
        message: 'Missing response data'
      });
    });

    it('should add error for failed status', () => {
      const errors = [];
      const failedResponse = {
        data: {
          status: false,
          data: {
            reference: 'PAY_REF_123456',
            amount: 1000,
            status: 'success'
          }
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(failedResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'verificationResponse',
        message: 'Payment verification failed'
      });
    });

    it('should add error for missing payment data', () => {
      const errors = [];
      const invalidResponse = {
        data: {
          status: true
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(invalidResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'verificationResponse',
        message: 'Missing payment data in response'
      });
    });

    it('should add error for missing reference in payment data', () => {
      const errors = [];
      const invalidResponse = {
        data: {
          status: true,
          data: {
            amount: 1000,
            status: 'success'
          }
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(invalidResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'paymentData',
        message: 'Missing payment reference in response'
      });
    });

    it('should add error for invalid amount', () => {
      const errors = [];
      const invalidResponse = {
        data: {
          status: true,
          data: {
            reference: 'PAY_REF_123456',
            amount: 'invalid',
            status: 'success'
          }
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(invalidResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'paymentData',
        message: 'Invalid payment amount in response'
      });
    });

    it('should add error for zero amount', () => {
      const errors = [];
      const invalidResponse = {
        data: {
          status: true,
          data: {
            reference: 'PAY_REF_123456',
            amount: 0,
            status: 'success'
          }
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(invalidResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'paymentData',
        message: 'Payment amount must be greater than zero'
      });
    });

    it('should add error for failed payment status', () => {
      const errors = [];
      const invalidResponse = {
        data: {
          status: true,
          data: {
            reference: 'PAY_REF_123456',
            amount: 1000,
            status: 'failed'
          }
        }
      };

      verifyWalletTopUpValidator.validatePaystackResponse(invalidResponse, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'paymentData',
        message: 'Payment verification failed - payment not successful'
      });
    });
  });

  describe('validatePaymentMetadata', () => {
    it('should not throw for valid metadata', () => {
      const errors = [];
      const validMetadata = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      verifyWalletTopUpValidator.validatePaymentMetadata(validMetadata, errors);

      expect(errors).toHaveLength(0);
    });

    it('should add error for null metadata', () => {
      const errors = [];
      const nullMetadata = null;

      verifyWalletTopUpValidator.validatePaymentMetadata(nullMetadata, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'metadata',
        message: 'Payment metadata is required'
      });
    });

    it('should add error for missing buyer ID in metadata', () => {
      const errors = [];
      const invalidMetadata = {};

      verifyWalletTopUpValidator.validatePaymentMetadata(invalidMetadata, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'metadata',
        message: 'Buyer ID is required in payment metadata'
      });
    });
  });

  describe('validateVerifyWalletTopUpData', () => {
    it('should not throw for valid data', async () => {
      const validReference = 'PAY_REF_123456';
      const validResponse = {
        data: {
          status: true,
          data: {
            reference: 'PAY_REF_123456',
            amount: 1000,
            status: 'success',
            metadata: {
              buyerId: '507f1f77bcf86cd799439011'
            }
          }
        }
      };

      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(validReference, validResponse)).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid reference', async () => {
      const invalidReference = null;
      const validResponse = {
        data: {
          status: true,
          data: {
            reference: 'PAY_REF_123456',
            amount: 1000,
            status: 'success',
            metadata: {
              buyerId: '507f1f77bcf86cd799439011'
            }
          }
        }
      };

      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(invalidReference, validResponse)).rejects.toMatchObject({
        errors: [
          {
            field: 'reference',
            message: 'Payment reference is required'
          },
          {
            field: 'reference',
            message: 'Payment reference mismatch'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid response', async () => {
      const validReference = 'PAY_REF_123456';
      const invalidResponse = null;

      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(validReference, invalidResponse)).rejects.toMatchObject({
        errors: [
          {
            field: 'verificationResponse',
            message: 'Invalid verification response'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing payment reference', async () => {
        const invalidReference = null;
        const validResponse = {
          data: {
            status: true,
            data: {
              reference: 'PAY_REF_123456',
              amount: 1000,
              status: 'success',
              metadata: {
                buyerId: '507f1f77bcf86cd799439011'
              }
            }
          }
        };

        await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(invalidReference, validResponse)).rejects.toMatchObject({
          errors: [
            {
              field: 'reference',
              message: 'Payment reference is required'
            },
            {
              field: 'reference',
              message: 'Payment reference mismatch'
            }
          ]
        });
      });

      it('should include specific error message for invalid verification response', async () => {
        const validReference = 'PAY_REF_123456';
        const invalidResponse = null;

        await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(validReference, invalidResponse)).rejects.toMatchObject({
          errors: [
            {
              field: 'verificationResponse',
              message: 'Invalid verification response'
            }
          ]
        });
      });

      it('should include specific error message for reference mismatch', async () => {
        const reference = 'PAY_REF_123456';
        const responseWithDifferentReference = {
          data: {
            status: true,
            data: {
              reference: 'DIFFERENT_REFERENCE',
              amount: 1000,
              status: 'success',
              metadata: {
                buyerId: '507f1f77bcf86cd799439011'
              }
            }
          }
        };

        await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, responseWithDifferentReference)).rejects.toMatchObject({
          errors: [
            {
              field: 'reference',
              message: 'Payment reference mismatch'
            }
          ]
        });
      });
    });
  });
}); 