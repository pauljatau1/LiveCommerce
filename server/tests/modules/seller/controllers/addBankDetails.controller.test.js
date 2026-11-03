// Import the controller and dependencies
const addBankDetailsService = require('@modules/seller/services/addBankDetails.service');
const sellerController = require('@modules/seller/controllers/seller.controller');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the service
jest.mock('@modules/seller/services/addBankDetails.service');

describe('Add Bank Details Controller', () => {
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

  const mockUpdatedSeller = {
    _id: mockSellerId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    bankDetails: mockBankDetails,
    hasFilledBankDetails: true
  };

  // Mock request and response objects
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup mock request object
    mockReq = {
      user: {
        id: mockSellerId
      },
      body: {
        bankDetails: mockBankDetails
      }
    };

    // Setup mock response object
    mockRes = {
      success: jest.fn()
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('addBankDetails', () => {
    it('should successfully add bank details and return success response', async () => {
      // Arrange
      addBankDetailsService.addBankDetails.mockResolvedValue(mockUpdatedSeller);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, mockBankDetails, undefined);
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Bank details added successfully',
          seller: mockUpdatedSeller
        },
        'Bank details added successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws ValidationError', async () => {
      // Arrange
      const validationError = new ValidationError([
        { field: 'bankCountry', message: 'Bank country is required' }
      ]);
      addBankDetailsService.addBankDetails.mockRejectedValue(validationError);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, mockBankDetails, undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(validationError.errors).toEqual([
        { field: 'bankCountry', message: 'Bank country is required' }
      ]);
    });

    it('should call next with error when service throws seller not found error', async () => {
      // Arrange
      const notFoundError = new Error('Seller not found');
      addBankDetailsService.addBankDetails.mockRejectedValue(notFoundError);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, mockBankDetails, undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(notFoundError.message).toBe('Seller not found');
    });

    it('should call next with error when service throws bank details already exist error', async () => {
      // Arrange
      const businessRuleError = new ValidationError([
        { field: 'bankDetails', message: 'Bank details already exist. Please use the bank change request process to update your details.' }
      ]);
      addBankDetailsService.addBankDetails.mockRejectedValue(businessRuleError);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, mockBankDetails, undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(businessRuleError);
      expect(businessRuleError.errors).toEqual([
        { field: 'bankDetails', message: 'Bank details already exist. Please use the bank change request process to update your details.' }
      ]);
    });

    it('should call next with error when service throws database error', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      addBankDetailsService.addBankDetails.mockRejectedValue(databaseError);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, mockBankDetails, undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(databaseError);
      expect(databaseError.message).toBe('Database connection failed');
    });

    it('should call next with error when service throws database findById error', async () => {
      // Arrange
      const findError = new Error('Database find failed');
      addBankDetailsService.addBankDetails.mockRejectedValue(findError);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, mockBankDetails, undefined);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(findError);
      expect(findError.message).toBe('Database find failed');
    });

    it('should handle request with minimal bank details', async () => {
      // Arrange
      const minimalBankDetails = {
        bankCountry: 'Nigeria',
        bankName: 'First Bank of Nigeria',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'John Doe'
      };

      const mockReqWithMinimal = {
        user: { id: mockSellerId },
        body: { bankDetails: minimalBankDetails }
      };

      const mockUpdatedSellerWithMinimal = {
        ...mockUpdatedSeller,
        bankDetails: minimalBankDetails
      };

      addBankDetailsService.addBankDetails.mockResolvedValue(mockUpdatedSellerWithMinimal);

      // Act
      await sellerController.addBankDetails(mockReqWithMinimal, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, minimalBankDetails, undefined);
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Bank details added successfully',
          seller: mockUpdatedSellerWithMinimal
        },
        'Bank details added successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle request with all optional bank details fields', async () => {
      // Arrange
      const completeBankDetails = {
        bankCountry: 'Nigeria',
        bankName: 'First Bank of Nigeria',
        bankAccountType: 'Savings',
        accountCurrency: 'NGN',
        accountNumber: '1234567890',
        accountName: 'John Doe',
        swiftCode: 'FBNINGL',
        bankIdentifierCode: 'FBNINGL'
      };

      const mockReqWithComplete = {
        user: { id: mockSellerId },
        body: { bankDetails: completeBankDetails }
      };

      const mockUpdatedSellerWithComplete = {
        ...mockUpdatedSeller,
        bankDetails: completeBankDetails
      };

      addBankDetailsService.addBankDetails.mockResolvedValue(mockUpdatedSellerWithComplete);

      // Act
      await sellerController.addBankDetails(mockReqWithComplete, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(mockSellerId, completeBankDetails, undefined);
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Bank details added successfully',
          seller: mockUpdatedSellerWithComplete
        },
        'Bank details added successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle request with different seller ID', async () => {
      // Arrange
      const differentSellerId = '507f1f77bcf86cd799439012';
      const mockReqWithDifferentId = {
        user: { id: differentSellerId },
        body: { bankDetails: mockBankDetails }
      };

      const mockUpdatedSellerWithDifferentId = {
        ...mockUpdatedSeller,
        _id: differentSellerId
      };

      addBankDetailsService.addBankDetails.mockResolvedValue(mockUpdatedSellerWithDifferentId);

      // Act
      await sellerController.addBankDetails(mockReqWithDifferentId, mockRes, mockNext);

      // Assert
      expect(addBankDetailsService.addBankDetails).toHaveBeenCalledWith(differentSellerId, mockBankDetails, undefined);
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Bank details added successfully',
          seller: mockUpdatedSellerWithDifferentId
        },
        'Bank details added successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should preserve exact response structure as specified in requirements', async () => {
      // Arrange
      addBankDetailsService.addBankDetails.mockResolvedValue(mockUpdatedSeller);

      // Act
      await sellerController.addBankDetails(mockReq, mockRes, mockNext);

      // Assert - Check that the response structure matches the original API exactly
      expect(mockRes.success).toHaveBeenCalledWith(
        {
          message: 'Bank details added successfully',
          seller: mockUpdatedSeller
        },
        'Bank details added successfully'
      );

      // Verify the exact structure of the first argument (data object)
      const successCallArgs = mockRes.success.mock.calls[0];
      const dataObject = successCallArgs[0];
      
      expect(dataObject).toHaveProperty('message', 'Bank details added successfully');
      expect(dataObject).toHaveProperty('seller');
      expect(dataObject.seller).toEqual(mockUpdatedSeller);
    });
  });
});
