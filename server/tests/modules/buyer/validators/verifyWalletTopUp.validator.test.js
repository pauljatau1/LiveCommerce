const verifyWalletTopUpValidator = require('../../../../src/modules/buyer/validators/verifyWalletTopUp.validator');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

describe('verifyWalletTopUp.validator', () => {
  describe('validatePaymentReference', () => {
    it('should pass validation for valid payment reference', () => {
      const reference = 'TXN_1234567890';
      
      // Should not throw any error
      expect(() => verifyWalletTopUpValidator.validatePaymentReference(reference)).not.toThrow();
    });

    it('should throw ValidationError when reference is missing', () => {
      const reference = null;
      
      expect(() => verifyWalletTopUpValidator.validatePaymentReference(reference))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when reference is undefined', () => {
      const reference = undefined;
      
      expect(() => verifyWalletTopUpValidator.validatePaymentReference(reference))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when reference is not a string', () => {
      const reference = 123;
      
      expect(() => verifyWalletTopUpValidator.validatePaymentReference(reference))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when reference is empty string', () => {
      const reference = '';
      
      expect(() => verifyWalletTopUpValidator.validatePaymentReference(reference))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when reference is whitespace only', () => {
      const reference = '   ';
      
      expect(() => verifyWalletTopUpValidator.validatePaymentReference(reference))
        .toThrow(ValidationError);
    });
  });

  describe('validateBuyerId', () => {
    it('should pass validation for valid buyer ID', () => {
      const buyerId = '507f1f77bcf86cd799439011';
      
      expect(() => verifyWalletTopUpValidator.validateBuyerId(buyerId)).not.toThrow();
    });

    it('should throw ValidationError when buyerId is missing', () => {
      const buyerId = null;
      
      expect(() => verifyWalletTopUpValidator.validateBuyerId(buyerId))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is undefined', () => {
      const buyerId = undefined;
      
      expect(() => verifyWalletTopUpValidator.validateBuyerId(buyerId))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is not a string', () => {
      const buyerId = 123;
      
      expect(() => verifyWalletTopUpValidator.validateBuyerId(buyerId))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is empty string', () => {
      const buyerId = '';
      
      expect(() => verifyWalletTopUpValidator.validateBuyerId(buyerId))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is whitespace only', () => {
      const buyerId = '   ';
      
      expect(() => verifyWalletTopUpValidator.validateBuyerId(buyerId))
        .toThrow(ValidationError);
    });
  });

  describe('validatePaystackResponse', () => {
    it('should pass validation for valid Paystack response', () => {
      const verificationResponse = {
        data: {
          status: true,
          data: {
            status: 'success',
            reference: 'TXN_1234567890',
            amount: 500000,
            metadata: {
              buyerId: '507f1f77bcf86cd799439011'
            }
          }
        }
      };
      
      expect(() => verifyWalletTopUpValidator.validatePaystackResponse(verificationResponse))
        .not.toThrow();
    });

    it('should throw ValidationError when verificationResponse is null', () => {
      const verificationResponse = null;
      
      expect(() => verifyWalletTopUpValidator.validatePaystackResponse(verificationResponse))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when verificationResponse.data is missing', () => {
      const verificationResponse = {};
      
      expect(() => verifyWalletTopUpValidator.validatePaystackResponse(verificationResponse))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when verificationResponse.data.status is false', () => {
      const verificationResponse = {
        data: {
          status: false,
          data: {
            status: 'success'
          }
        }
      };
      
      expect(() => verifyWalletTopUpValidator.validatePaystackResponse(verificationResponse))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when transaction status is not success', () => {
      const verificationResponse = {
        data: {
          status: true,
          data: {
            status: 'failed',
            reference: 'TXN_1234567890'
          }
        }
      };
      
      expect(() => verifyWalletTopUpValidator.validatePaystackResponse(verificationResponse))
        .toThrow(ValidationError);
    });
  });

  describe('validatePaymentMetadata', () => {
    it('should pass validation for valid payment metadata', () => {
      const metadata = {
        buyerId: '507f1f77bcf86cd799439011',
        description: 'Wallet top up'
      };
      
      expect(() => verifyWalletTopUpValidator.validatePaymentMetadata(metadata))
        .not.toThrow();
    });

    it('should throw ValidationError when metadata is null', () => {
      const metadata = null;
      
      expect(() => verifyWalletTopUpValidator.validatePaymentMetadata(metadata))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when metadata is not an object', () => {
      const metadata = 'not an object';
      
      expect(() => verifyWalletTopUpValidator.validatePaymentMetadata(metadata))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when metadata.buyerId is missing', () => {
      const metadata = {
        description: 'Wallet top up'
      };
      
      expect(() => verifyWalletTopUpValidator.validatePaymentMetadata(metadata))
        .toThrow(ValidationError);
    });
  });

  describe('validateVerifyWalletTopUpData', () => {
    it('should pass validation for valid data', async () => {
      const reference = 'TXN_1234567890';
      const verificationResponse = {
        data: {
          status: true,
          data: {
            status: 'success',
            reference: 'TXN_1234567890',
            amount: 500000,
            metadata: {
              buyerId: '507f1f77bcf86cd799439011',
              description: 'Wallet top up'
            }
          }
        }
      };
      
      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse))
        .resolves.toBeUndefined();
    });

    it('should throw ValidationError when reference is missing', async () => {
      const reference = null;
      const verificationResponse = {
        data: {
          status: true,
          data: {
            status: 'success',
            metadata: {
              buyerId: '507f1f77bcf86cd799439011'
            }
          }
        }
      };
      
      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when Paystack response is invalid', async () => {
      const reference = 'TXN_1234567890';
      const verificationResponse = {
        data: {
          status: false,
          data: {
            status: 'failed'
          }
        }
      };
      
      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when metadata is missing', async () => {
      const reference = 'TXN_1234567890';
      const verificationResponse = {
        data: {
          status: true,
          data: {
            status: 'success',
            reference: 'TXN_1234567890',
            amount: 500000
            // metadata is missing
          }
        }
      };
      
      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when buyerId is missing from metadata', async () => {
      const reference = 'TXN_1234567890';
      const verificationResponse = {
        data: {
          status: true,
          data: {
            status: 'success',
            reference: 'TXN_1234567890',
            amount: 500000,
            metadata: {
              description: 'Wallet top up'
              // buyerId is missing
            }
          }
        }
      };
      
      await expect(verifyWalletTopUpValidator.validateVerifyWalletTopUpData(reference, verificationResponse))
        .rejects.toThrow(ValidationError);
    });
  });
}); 