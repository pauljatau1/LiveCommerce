const topUpWalletValidator = require('@modules/buyer/validators/topUpWallet.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('topUpWallet.validator', () => {
  describe('validateAmount', () => {
    it('should not add error for valid positive amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount(1000, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for zero amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount(0, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('amount');
      expect(errors[0].message).toBe('Invalid amount. Amount must be greater than 0.');
    });

    it('should add error for negative amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount(-100, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('amount');
      expect(errors[0].message).toBe('Invalid amount. Amount must be greater than 0.');
    });

    it('should add error for null amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount(null, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('amount');
      expect(errors[0].message).toBe('Invalid amount. Amount must be greater than 0.');
    });

    it('should add error for undefined amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount(undefined, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('amount');
      expect(errors[0].message).toBe('Invalid amount. Amount must be greater than 0.');
    });

    it('should add error for non-number amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount('1000', errors);
      expect(errors).toHaveLength(2); // Both amount and type validation
      expect(errors[0].field).toBe('amount');
      expect(errors[0].message).toBe('Invalid amount. Amount must be greater than 0.');
      expect(errors[1].field).toBe('amount');
      expect(errors[1].message).toBe('Amount must be a number');
    });

    it('should add error for empty string amount', () => {
      const errors = [];
      topUpWalletValidator.validateAmount('', errors);
      expect(errors).toHaveLength(2); // Both amount and type validation
      expect(errors[0].field).toBe('amount');
      expect(errors[0].message).toBe('Invalid amount. Amount must be greater than 0.');
      expect(errors[1].field).toBe('amount');
      expect(errors[1].message).toBe('Amount must be a number');
    });
  });

  describe('validateDescription', () => {
    it('should not add error for valid string description', () => {
      const errors = [];
      topUpWalletValidator.validateDescription('Wallet top up', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for undefined description', () => {
      const errors = [];
      topUpWalletValidator.validateDescription(undefined, errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for null description', () => {
      const errors = [];
      topUpWalletValidator.validateDescription(null, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for non-string description', () => {
      const errors = [];
      topUpWalletValidator.validateDescription(123, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('description');
      expect(errors[0].message).toBe('Description must be a string');
    });

    it('should add error for empty string description', () => {
      const errors = [];
      topUpWalletValidator.validateDescription('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('description');
      expect(errors[0].message).toBe('Description cannot be empty');
    });

    it('should add error for whitespace-only description', () => {
      const errors = [];
      topUpWalletValidator.validateDescription('   ', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('description');
      expect(errors[0].message).toBe('Description cannot be empty');
    });
  });

  describe('validateBypassPaystack', () => {
    it('should not add error for admin user with bypass', () => {
      const errors = [];
      topUpWalletValidator.validateBypassPaystack(true, true, 'production', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for non-admin user without bypass', () => {
      const errors = [];
      topUpWalletValidator.validateBypassPaystack(false, false, 'production', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for development environment with bypass', () => {
      const errors = [];
      topUpWalletValidator.validateBypassPaystack(true, false, 'development', errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for non-admin user with bypass in production', () => {
      const errors = [];
      topUpWalletValidator.validateBypassPaystack(true, false, 'production', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('bypassPaystack');
      expect(errors[0].message).toBe('Direct wallet top-up is not allowed');
    });

    it('should add error for non-admin user with bypass in test environment', () => {
      const errors = [];
      topUpWalletValidator.validateBypassPaystack(true, false, 'test', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('bypassPaystack');
      expect(errors[0].message).toBe('Direct wallet top-up is not allowed');
    });
  });

  describe('validatePaymentReference', () => {
    it('should not add error for valid string payment reference', () => {
      const errors = [];
      topUpWalletValidator.validatePaymentReference('PAY-1234567890-ABC123', errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for undefined payment reference', () => {
      const errors = [];
      topUpWalletValidator.validatePaymentReference(undefined, errors);
      expect(errors).toHaveLength(0);
    });

    it('should not add error for null payment reference', () => {
      const errors = [];
      topUpWalletValidator.validatePaymentReference(null, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for non-string payment reference', () => {
      const errors = [];
      topUpWalletValidator.validatePaymentReference(123, errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('paymentReference');
      expect(errors[0].message).toBe('Payment reference must be a string');
    });

    it('should add error for empty string payment reference', () => {
      const errors = [];
      topUpWalletValidator.validatePaymentReference('', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('paymentReference');
      expect(errors[0].message).toBe('Payment reference cannot be empty');
    });

    it('should add error for whitespace-only payment reference', () => {
      const errors = [];
      topUpWalletValidator.validatePaymentReference('   ', errors);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('paymentReference');
      expect(errors[0].message).toBe('Payment reference cannot be empty');
    });
  });

  describe('validateTopUpWalletData', () => {
    const validData = {
      amount: 1000,
      description: 'Wallet top up',
      bypassPaystack: false,
      paymentReference: 'PAY-1234567890-ABC123'
    };

    const validUser = {
      isAdmin: false
    };

    it('should pass for valid data', async () => {
      await expect(
        topUpWalletValidator.validateTopUpWalletData(validData, validUser, 'production')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid amount', async () => {
      const invalidData = { ...validData, amount: -100 };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'amount',
            message: 'Invalid amount. Amount must be greater than 0.'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid description', async () => {
      const invalidData = { ...validData, description: 123 };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'description',
            message: 'Description must be a string'
          }
        ]
      });
    });

    it('should throw ValidationError for unauthorized bypass', async () => {
      const invalidData = { ...validData, bypassPaystack: true };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'bypassPaystack',
            message: 'Direct wallet top-up is not allowed'
          }
        ]
      });
    });

    it('should pass for admin user with bypass', async () => {
      const adminData = { ...validData, bypassPaystack: true };
      const adminUser = { isAdmin: true };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(adminData, adminUser, 'production')
      ).resolves.not.toThrow();
    });

    it('should pass for development environment with bypass', async () => {
      const bypassData = { ...validData, bypassPaystack: true };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(bypassData, validUser, 'development')
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid payment reference', async () => {
      const invalidData = { ...validData, paymentReference: 123 };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'paymentReference',
            message: 'Payment reference must be a string'
          }
        ]
      });
    });

    it('should pass for minimal valid data', async () => {
      const minimalData = { amount: 1000 };
      
      await expect(
        topUpWalletValidator.validateTopUpWalletData(minimalData, validUser, 'production')
      ).resolves.not.toThrow();
    });
  });

  describe('Specific Error Messages', () => {
    const validUser = { isAdmin: false };

    it('should include specific error message for null amount', async () => {
      const invalidData = { amount: null };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'amount',
              message: 'Invalid amount. Amount must be greater than 0.'
            }
          ]
        });
    });

    it('should include specific error message for undefined amount', async () => {
      const invalidData = { amount: undefined };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'amount',
              message: 'Invalid amount. Amount must be greater than 0.'
            }
          ]
        });
    });

    it('should include specific error message for non-number amount', async () => {
      const invalidData = { amount: 'invalid' };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'amount',
              message: 'Invalid amount. Amount must be greater than 0.'
            },
            {
              field: 'amount',
              message: 'Amount must be a number'
            }
          ]
        });
    });

    it('should include specific error message for zero amount', async () => {
      const invalidData = { amount: 0 };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'amount',
              message: 'Invalid amount. Amount must be greater than 0.'
            }
          ]
        });
    });

    it('should include specific error message for negative amount', async () => {
      const invalidData = { amount: -100 };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'amount',
              message: 'Invalid amount. Amount must be greater than 0.'
            }
          ]
        });
    });

    it('should include specific error message for non-string description', async () => {
      const invalidData = { amount: 1000, description: 123 };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'description',
              message: 'Description must be a string'
            }
          ]
        });
    });

    it('should include specific error message for empty string description', async () => {
      const invalidData = { amount: 1000, description: '' };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'description',
              message: 'Description cannot be empty'
            }
          ]
        });
    });

    it('should include specific error message for whitespace-only description', async () => {
      const invalidData = { amount: 1000, description: '   ' };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'description',
              message: 'Description cannot be empty'
            }
          ]
        });
    });

    it('should include specific error message for unauthorized bypass in production', async () => {
      const invalidData = { amount: 1000, bypassPaystack: true };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'bypassPaystack',
              message: 'Direct wallet top-up is not allowed'
            }
          ]
        });
    });

    it('should include specific error message for non-string payment reference', async () => {
      const invalidData = { amount: 1000, paymentReference: 123 };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'paymentReference',
              message: 'Payment reference must be a string'
            }
          ]
        });
    });

    it('should include specific error message for empty string payment reference', async () => {
      const invalidData = { amount: 1000, paymentReference: '' };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'paymentReference',
              message: 'Payment reference cannot be empty'
            }
          ]
        });
    });

    it('should include specific error message for whitespace-only payment reference', async () => {
      const invalidData = { amount: 1000, paymentReference: '   ' };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'paymentReference',
              message: 'Payment reference cannot be empty'
            }
          ]
        });
    });

    it('should include multiple error messages for multiple validation failures', async () => {
      const invalidData = {
        amount: 'invalid',
        description: 123,
        paymentReference: 456
      };

      await expect(topUpWalletValidator.validateTopUpWalletData(invalidData, validUser, 'production'))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'amount',
              message: 'Invalid amount. Amount must be greater than 0.'
            },
            {
              field: 'amount',
              message: 'Amount must be a number'
            },
            {
              field: 'description',
              message: 'Description must be a string'
            },
            {
              field: 'paymentReference',
              message: 'Payment reference must be a string'
            }
          ]
        });
    });

    it('should not throw error for valid data', async () => {
      const validData = {
        amount: 1000,
        description: 'Wallet top up',
        paymentReference: 'PAY-1234567890-ABC123'
      };

      await expect(topUpWalletValidator.validateTopUpWalletData(validData, validUser, 'production'))
        .resolves.not.toThrow();
    });

    it('should not throw error for admin user with bypass in production', async () => {
      const validData = {
        amount: 1000,
        bypassPaystack: true
      };
      const adminUser = { isAdmin: true };

      await expect(topUpWalletValidator.validateTopUpWalletData(validData, adminUser, 'production'))
        .resolves.not.toThrow();
    });

    it('should not throw error for development environment with bypass', async () => {
      const validData = {
        amount: 1000,
        bypassPaystack: true
      };

      await expect(topUpWalletValidator.validateTopUpWalletData(validData, validUser, 'development'))
        .resolves.not.toThrow();
    });
  });
});
