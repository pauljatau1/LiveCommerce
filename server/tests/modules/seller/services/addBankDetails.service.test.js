// Import the service and dependencies
const addBankDetailsService = require('@modules/seller/services/addBankDetails.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const addBankDetailsValidator = require('@modules/seller/validators/addBankDetails.validator');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/addBankDetails.validator');

describe('Add Bank Details Service', () => {
  // Test data
  const mockSellerId = '507f1f77bcf86cd799439011';
  const mockBankDetails = {
    bankCountry: 'Nigeria',
    bankName: 'First Bank of Nigeria',
    bankAccountType: 'Savings',
    accountCurrency: 'NGN',
    accountNumber: '1234567890',
    accountName: 'John Doe',
    swiftCode: 'FBNINGL',
    bankIdentifierCode: 'FBNINGL'
  };

  const mockSeller = {
    _id: mockSellerId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    bankDetails: undefined,
    hasFilledBankDetails: false
  };

  const mockUpdatedSeller = {
    ...mockSeller,
    bankDetails: mockBankDetails,
    hasFilledBankDetails: !!mockBankDetails,
    isBankVerified: false // Added isBankVerified field to match Seller model
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('addBankDetails', () => {
    it('should successfully add bank details to a seller account', async () => {
      // Arrange
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockUpdatedSeller);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act
      const result = await addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails);

      // Assert
      expect(addBankDetailsValidator.validateBankDetails).toHaveBeenCalledWith(mockBankDetails);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
      expect(result).toEqual(mockUpdatedSeller);
      expect(mockSeller.bankDetails).toEqual(mockBankDetails);
      expect(mockSeller.hasFilledBankDetails).toBe(!!mockBankDetails);
    });

    it('should throw ValidationError when bank details validation fails', async () => {
      // Arrange
      const validationError = new ValidationError('Bank details validation failed', [
        { field: 'bankCountry', message: 'Bank country is required' }
      ]);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {
        throw validationError;
      });

      // Create a seller without existing bank details so validation can happen
      const sellerWithoutBankDetails = {
        ...mockSeller,
        bankDetails: undefined
      };
      sellerRepository.findById.mockResolvedValue(sellerWithoutBankDetails);

      // Act & Assert
      await expect(addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails))
        .rejects.toThrow(ValidationError);
      
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(addBankDetailsValidator.validateBankDetails).toHaveBeenCalledWith(mockBankDetails);
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when seller is not found', async () => {
      // Arrange
      sellerRepository.findById.mockResolvedValue(null);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act & Assert
      await expect(addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails))
        .rejects.toThrow('Seller not found');
      
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(addBankDetailsValidator.validateBankDetails).not.toHaveBeenCalled();
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should successfully update bank details when seller already has bank details (no approval required)', async () => {
      // Arrange - Seller already has existing bank details
      const sellerWithBankDetails = {
        ...mockSeller,
        bankDetails: {
          accountNumber: '0987654321',
          bankName: 'Existing Bank'
        }
      };
      sellerRepository.findById.mockResolvedValue(sellerWithBankDetails);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});
      
      const updatedSeller = {
        ...sellerWithBankDetails,
        bankDetails: mockBankDetails,
        hasFilledBankDetails: true
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act - Should allow direct update without approval process
      const result = await addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails);

      // Assert - Should succeed (no longer throws error)
      expect(result).toEqual(updatedSeller);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(addBankDetailsValidator.validateBankDetails).toHaveBeenCalledWith(mockBankDetails);
      expect(sellerRepository.save).toHaveBeenCalledWith(sellerWithBankDetails);
    });

    it('should throw error when seller has bankDetails but no accountNumber', async () => {
      // Arrange
      const sellerWithPartialBankDetails = {
        ...mockSeller,
        bankDetails: {
          bankName: 'Partial Bank'
          // No accountNumber
        }
      };
      sellerRepository.findById.mockResolvedValue(sellerWithPartialBankDetails);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act
      const result = await addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails);

      // Assert - Should succeed since accountNumber is not present
      expect(addBankDetailsValidator.validateBankDetails).toHaveBeenCalledWith(mockBankDetails);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(sellerWithPartialBankDetails);
      expect(result).toEqual(mockUpdatedSeller);
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const saveError = new Error('Database save failed');
      const sellerWithoutBankDetails = {
        ...mockSeller,
        bankDetails: undefined
      };
      sellerRepository.findById.mockResolvedValue(sellerWithoutBankDetails);
      sellerRepository.save.mockRejectedValue(saveError);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act & Assert
      await expect(addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails))
        .rejects.toThrow('Database save failed');
      
      expect(addBankDetailsValidator.validateBankDetails).toHaveBeenCalledWith(mockBankDetails);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(sellerWithoutBankDetails);
    });

    it('should handle repository findById errors', async () => {
      // Arrange
      const findError = new Error('Database find failed');
      sellerRepository.findById.mockRejectedValue(findError);
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act & Assert
      await expect(addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails))
        .rejects.toThrow('Database find failed');
      
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(addBankDetailsValidator.validateBankDetails).not.toHaveBeenCalled();
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should work with minimal required bank details', async () => {
      // Arrange
      const minimalBankDetails = {
        bankCountry: 'Nigeria',
        bankName: 'First Bank of Nigeria',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'John Doe'
      };
      const sellerWithoutBankDetails = {
        ...mockSeller,
        bankDetails: undefined
      };
      sellerRepository.findById.mockResolvedValue(sellerWithoutBankDetails);
      sellerRepository.save.mockResolvedValue({
        ...sellerWithoutBankDetails,
        bankDetails: minimalBankDetails,
        hasFilledBankDetails: !!minimalBankDetails
      });
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act
      const result = await addBankDetailsService.addBankDetails(mockSellerId, minimalBankDetails);

      // Assert
      expect(addBankDetailsValidator.validateBankDetails).toHaveBeenCalledWith(minimalBankDetails);
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(sellerRepository.save).toHaveBeenCalledWith(sellerWithoutBankDetails);
      expect(result.bankDetails).toEqual(minimalBankDetails);
      expect(result.hasFilledBankDetails).toBe(!!minimalBankDetails);
    });

    it('should preserve existing seller properties when updating bank details', async () => {
      // Arrange
      const sellerWithAdditionalProps = {
        ...mockSeller,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        storeName: 'John Store',
        walletBalance: 1000,
        bankDetails: undefined
      };
      sellerRepository.findById.mockResolvedValue(sellerWithAdditionalProps);
      sellerRepository.save.mockResolvedValue({
        ...sellerWithAdditionalProps,
        bankDetails: mockBankDetails,
        hasFilledBankDetails: !!mockBankDetails
      });
      addBankDetailsValidator.validateBankDetails.mockImplementation(() => {});

      // Act
      const result = await addBankDetailsService.addBankDetails(mockSellerId, mockBankDetails);

      // Assert
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.storeName).toBe('John Store');
      expect(result.walletBalance).toBe(1000);
      expect(result.bankDetails).toEqual(mockBankDetails);
      expect(result.hasFilledBankDetails).toBe(!!mockBankDetails);
    });

    it('should handle undefined/null bankDetails without validation', async () => {
      // Arrange
      const undefinedBankDetails = undefined;
      const sellerWithoutBankDetails = {
        ...mockSeller,
        bankDetails: undefined
      };
      sellerRepository.findById.mockResolvedValue(sellerWithoutBankDetails);
      sellerRepository.save.mockResolvedValue({
        ...sellerWithoutBankDetails,
        bankDetails: undefinedBankDetails,
        hasFilledBankDetails: !!undefinedBankDetails
      });

      // Act
      const result = await addBankDetailsService.addBankDetails(mockSellerId, undefinedBankDetails);

      // Assert - Should succeed without validation when bankDetails is undefined
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(addBankDetailsValidator.validateBankDetails).not.toHaveBeenCalled();
      expect(sellerRepository.save).toHaveBeenCalledWith(sellerWithoutBankDetails);
      expect(result.bankDetails).toBeUndefined();
      expect(result.hasFilledBankDetails).toBe(false);
    });

    it('should handle null bankDetails without validation', async () => {
      // Arrange
      const nullBankDetails = null;
      const sellerWithoutBankDetails = {
        ...mockSeller,
        bankDetails: undefined
      };
      sellerRepository.findById.mockResolvedValue(sellerWithoutBankDetails);
      sellerRepository.save.mockResolvedValue({
        ...sellerWithoutBankDetails,
        bankDetails: nullBankDetails,
        hasFilledBankDetails: !!nullBankDetails
      });

      // Act
      const result = await addBankDetailsService.addBankDetails(mockSellerId, nullBankDetails);

      // Assert - Should succeed without validation when bankDetails is null
      expect(sellerRepository.findById).toHaveBeenCalledWith(mockSellerId);
      expect(addBankDetailsValidator.validateBankDetails).not.toHaveBeenCalled();
      expect(sellerRepository.save).toHaveBeenCalledWith(sellerWithoutBankDetails);
      expect(result.bankDetails).toBeNull();
      expect(result.hasFilledBankDetails).toBe(false);
    });
  });
});
