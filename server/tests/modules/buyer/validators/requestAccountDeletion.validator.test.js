const requestAccountDeletionValidator = require('@modules/buyer/validators/requestAccountDeletion.validator');
const ValidationError = require('@utils/errors/ValidationError');
const mongoose = require('mongoose');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('Request Account Deletion Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequestAccountDeletionData', () => {
    const validBuyerId = new mongoose.Types.ObjectId().toString();
    const mockBuyer = {
      _id: validBuyerId,
      email: 'test@example.com',
      accountDeletion: null
    };

    it('should not throw for valid buyer ID', async () => {
      buyerRepository.findById.mockResolvedValue(mockBuyer);

      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(validBuyerId)).resolves.not.toThrow();
    });

    it('should throw ValidationError for null buyer ID', async () => {
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(null)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for undefined buyer ID', async () => {
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(undefined)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for empty string buyer ID', async () => {
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData('')).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError for whitespace-only buyer ID', async () => {
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData('   ')).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid ObjectId format', async () => {
      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData('invalid-id')).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Invalid buyer ID format'
          }
        ]
      });
    });

    it('should throw ValidationError when buyer not found', async () => {
      buyerRepository.findById.mockResolvedValue(null);

      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(validBuyerId)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer not found'
          }
        ]
      });
    });

    it('should throw ValidationError when buyer already in deletion process', async () => {
      const buyerInDeletion = {
        ...mockBuyer,
        accountDeletion: {
          otp: '123456'
        }
      };
      buyerRepository.findById.mockResolvedValue(buyerInDeletion);

      await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(validBuyerId)).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Account deletion request already in progress'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyer ID', async () => {
        await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(null)).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for invalid buyer ID format', async () => {
        await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData('invalid-id')).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Invalid buyer ID format'
            }
          ]
        });
      });

      it('should include specific error message for buyer not found', async () => {
        buyerRepository.findById.mockResolvedValue(null);

        await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(validBuyerId)).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer not found'
            }
          ]
        });
      });

      it('should include specific error message for buyer already in deletion process', async () => {
        const buyerInDeletion = {
          ...mockBuyer,
          accountDeletion: {
            otp: '123456'
          }
        };
        buyerRepository.findById.mockResolvedValue(buyerInDeletion);

        await expect(requestAccountDeletionValidator.validateRequestAccountDeletionData(validBuyerId)).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Account deletion request already in progress'
            }
          ]
        });
      });
    });
  });
}); 