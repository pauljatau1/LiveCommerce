/**
 * Add Business Details Service Tests
 *
 * This test suite validates the addBusinessDetails service functionality.
 * It ensures that the service properly handles business logic, data validation,
 * and database operations for adding business details to seller profiles.
 *
 * Test Coverage:
 * - Successful business details addition
 * - Validation error handling
 * - Seller not found scenarios
 * - Database operation failures
 * - Business logic validation
 * - Data integrity checks
 *
 * @module addBusinessDetailsServiceTests
 */

const { addBusinessDetails } = require('@modules/seller/services/addBusinessDetails.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const addBusinessDetailsValidator = require('@modules/seller/validators/addBusinessDetails.validator');

// Mock dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/addBusinessDetails.validator');

describe('Add Business Details Service', () => {
  let validBusinessDetails;
  let mockSeller;

  beforeEach(() => {
    // Valid business details data
    validBusinessDetails = {
      businessName: 'Tech Solutions Ltd',
      businessType: 'LLC',
      taxInformation: 'Tax ID: 123456789'
    };

    // Mock seller object
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      businessName: '',
      businessType: '',
      taxInformation: '',
      businessAddress: {
        street: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria'
      },
      verificationDocuments: {
        documents: []
      },
      hasFilledBusinessAddress: false,
      hasFilledVerificationDocuments: false,
      save: jest.fn()
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('addBusinessDetails', () => {
    it('should successfully add business details', async () => {
      // Arrange: Mock successful validation and repository operations
      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(mockSeller);
      const updatedSeller = {
        ...mockSeller,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: true,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify successful result
      expect(result).toEqual({
        message: 'Business details added successfully',
        seller: updatedSeller
      });

      // Verify validator was called
      expect(addBusinessDetailsValidator.validateAddBusinessDetailsData).toHaveBeenCalledWith(validBusinessDetails);

      // Verify repository operations
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
    });

    it('should handle validation errors', async () => {
      // Arrange: Mock validation error
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'businessName', message: 'Business name is required' }
      ];

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert: Verify validation error is thrown
      await expect(addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails))
        .rejects.toThrow('Validation failed');

      // Verify validator was called
      expect(addBusinessDetailsValidator.validateAddBusinessDetailsData).toHaveBeenCalledWith(validBusinessDetails);

      // Verify repository was not called
      expect(sellerRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle seller not found', async () => {
      // Arrange: Mock seller not found
      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(null);

      // Act & Assert: Verify seller not found error is thrown
      await expect(addBusinessDetails('nonexistent-seller-id', validBusinessDetails))
        .rejects.toThrow('Seller not found');

      // Verify validator was called
      expect(addBusinessDetailsValidator.validateAddBusinessDetailsData).toHaveBeenCalledWith(validBusinessDetails);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith('nonexistent-seller-id');
    });

    it('should handle database save failure', async () => {
      // Arrange: Mock database save failure
      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert: Verify database error is thrown
      await expect(addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails))
        .rejects.toThrow('Database connection failed');

      // Verify validator was called
      expect(addBusinessDetailsValidator.validateAddBusinessDetailsData).toHaveBeenCalledWith(validBusinessDetails);

      // Verify repository operations
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
    });

    it('should update completion flags correctly when business address exists', async () => {
      // Arrange: Mock seller with business address
      const sellerWithAddress = {
        ...mockSeller,
        businessAddress: {
          street: '123 Main St',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        }
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(sellerWithAddress);
      const updatedSeller = {
        ...sellerWithAddress,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: true,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify completion flags are set correctly
      expect(result.seller.hasFilledBusinessAddress).toBe(true);
      expect(result.seller.hasFilledVerificationDocuments).toBe(false);
    });

    it('should update completion flags correctly when verification documents exist', async () => {
      // Arrange: Mock seller with verification documents
      const sellerWithDocs = {
        ...mockSeller,
        verificationDocuments: {
          documents: [
            { type: 'business_license', url: 'http://example.com/doc1.pdf' }
          ]
        }
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(sellerWithDocs);
      const updatedSeller = {
        ...sellerWithDocs,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: false,
        hasFilledVerificationDocuments: true
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify completion flags are set correctly
      expect(result.seller.hasFilledBusinessAddress).toBe(false);
      expect(result.seller.hasFilledVerificationDocuments).toBe(true);
    });

    it('should handle different business details data', async () => {
      // Arrange: Mock different business details
      const differentBusinessDetails = {
        businessName: 'Different Business Name',
        businessType: 'Corporation',
        taxInformation: 'Different Tax Information'
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(mockSeller);
      const updatedSeller = {
        ...mockSeller,
        businessName: 'Different Business Name',
        businessType: 'Corporation',
        taxInformation: 'Different Tax Information',
        hasFilledBusinessAddress: false,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', differentBusinessDetails);

      // Assert: Verify different business details are processed
      expect(result.seller.businessName).toBe('Different Business Name');
      expect(result.seller.businessType).toBe('Corporation');
      expect(result.seller.taxInformation).toBe('Different Tax Information');

      // Verify validator was called with correct data
      expect(addBusinessDetailsValidator.validateAddBusinessDetailsData).toHaveBeenCalledWith(differentBusinessDetails);
    });

    it('should handle seller with no business address and no verification documents', async () => {
      // Arrange: Mock seller with no business address and no verification documents
      const sellerWithoutData = {
        ...mockSeller,
        businessAddress: null,
        verificationDocuments: {
          documents: []
        }
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(sellerWithoutData);
      const updatedSeller = {
        ...sellerWithoutData,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: false,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify completion flags are set correctly
      expect(result.seller.hasFilledBusinessAddress).toBe(false);
      expect(result.seller.hasFilledVerificationDocuments).toBe(false);
    });

    it('should handle seller with undefined business address', async () => {
      // Arrange: Mock seller with undefined business address
      const sellerWithUndefinedAddress = {
        ...mockSeller,
        businessAddress: undefined,
        verificationDocuments: {
          documents: []
        }
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(sellerWithUndefinedAddress);
      const updatedSeller = {
        ...sellerWithUndefinedAddress,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: false,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify completion flags are set correctly
      expect(result.seller.hasFilledBusinessAddress).toBe(false);
      expect(result.seller.hasFilledVerificationDocuments).toBe(false);
    });

    it('should handle seller with undefined verification documents', async () => {
      // Arrange: Mock seller with undefined verification documents
      const sellerWithUndefinedDocs = {
        ...mockSeller,
        businessAddress: {
          street: '123 Main St',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        },
        verificationDocuments: undefined
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(sellerWithUndefinedDocs);
      const updatedSeller = {
        ...sellerWithUndefinedDocs,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: true,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify completion flags are set correctly
      expect(result.seller.hasFilledBusinessAddress).toBe(true);
      expect(result.seller.hasFilledVerificationDocuments).toBe(false);
    });

    it('should preserve existing seller data while updating business details', async () => {
      // Arrange: Mock seller with existing data
      const sellerWithExistingData = {
        ...mockSeller,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        businessAddress: {
          street: '123 Main St',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        }
      };

      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockResolvedValue(sellerWithExistingData);
      const updatedSeller = {
        ...sellerWithExistingData,
        businessName: 'Tech Solutions Ltd',
        businessType: 'LLC',
        taxInformation: 'Tax ID: 123456789',
        hasFilledBusinessAddress: true,
        hasFilledVerificationDocuments: false
      };
      sellerRepository.save.mockResolvedValue(updatedSeller);

      // Act: Call the service function
      const result = await addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails);

      // Assert: Verify existing data is preserved
      expect(result.seller.firstName).toBe('John');
      expect(result.seller.lastName).toBe('Doe');
      expect(result.seller.email).toBe('john@example.com');
      expect(result.seller.phone).toBe('+1234567890');
      expect(result.seller.businessAddress).toEqual({
        street: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria'
      });

      // Verify business details are updated
      expect(result.seller.businessName).toBe('Tech Solutions Ltd');
      expect(result.seller.businessType).toBe('LLC');
      expect(result.seller.taxInformation).toBe('Tax ID: 123456789');
    });

    it('should handle repository findById failure', async () => {
      // Arrange: Mock repository findById failure
      addBusinessDetailsValidator.validateAddBusinessDetailsData.mockImplementation(() => {});
      sellerRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert: Verify repository error is thrown
      await expect(addBusinessDetails('507f1f77bcf86cd799439011', validBusinessDetails))
        .rejects.toThrow('Database connection failed');

      // Verify validator was called
      expect(addBusinessDetailsValidator.validateAddBusinessDetailsData).toHaveBeenCalledWith(validBusinessDetails);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
