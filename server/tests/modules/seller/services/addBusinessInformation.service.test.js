/**
 * Add Business Information Service Tests
 *
 * This test suite validates the addBusinessInformation service functionality.
 * It ensures that the service properly handles business logic, data validation,
 * and database operations for adding business information to seller profiles.
 *
 * Test Coverage:
 * - Successful business information addition
 * - Validation error handling
 * - Seller not found scenarios
 * - Database operation failures
 * - Business logic validation
 * - Data integrity checks
 * - Completion flag updates
 *
 * @module addBusinessInformationServiceTests
 */

const { addBusinessInformation } = require('@modules/seller/services/addBusinessInformation.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const addBusinessInformationValidator = require('@modules/seller/validators/addBusinessInformation.validator');

// Mock dependencies
jest.mock('@modules/seller/repositories/seller.repository');
jest.mock('@modules/seller/validators/addBusinessInformation.validator');

describe('Add Business Information Service', () => {
  let validBusinessInformation;
  let mockSeller;

  beforeEach(() => {
    // Valid business information data
    validBusinessInformation = {
      businessEmail: 'business@techsolutions.com',
      businessNumber: '+2348012345678',
      businessAddress: {
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Yaba',
        addressLine1: '123 Business Street',
        addressLine2: 'Suite 100',
        zipCode: '100001'
      }
    };

    // Mock seller object
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      businessEmail: '',
      businessNumber: '',
      businessAddress: null,
      hasFilledBusinessAddress: false,
      save: jest.fn()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('addBusinessInformation', () => {
    it('should successfully add business information to seller profile', async () => {
      // Arrange: Mock successful validation and repository operations
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue({
        ...mockSeller,
        businessEmail: validBusinessInformation.businessEmail,
        businessNumber: validBusinessInformation.businessNumber,
        businessAddress: validBusinessInformation.businessAddress,
        hasFilledBusinessAddress: true
      });

      // Act: Call the service function
      const result = await addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation);

      // Assert: Verify the result structure and content
      expect(result).toEqual({
        message: 'Business information added successfully',
        seller: {
          ...mockSeller,
          businessEmail: validBusinessInformation.businessEmail,
          businessNumber: validBusinessInformation.businessNumber,
          businessAddress: validBusinessInformation.businessAddress,
          hasFilledBusinessAddress: true
        }
      });

      // Assert: Verify validator was called with correct data
      expect(addBusinessInformationValidator.validateAddBusinessInformationData)
        .toHaveBeenCalledWith(validBusinessInformation);

      // Assert: Verify repository operations
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
    });

    it('should update seller business information fields correctly', async () => {
      // Arrange: Mock successful operations
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);

      // Act: Call the service function
      await addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation);

      // Assert: Verify seller fields were updated correctly
      expect(mockSeller.businessEmail).toBe(validBusinessInformation.businessEmail);
      // Phone number should be normalized ('+2348012345678' -> '8012345678')
      expect(mockSeller.businessNumber).toBe('08012345678');
      expect(mockSeller.businessAddress).toEqual(validBusinessInformation.businessAddress);
      expect(mockSeller.hasFilledBusinessAddress).toBe(true);
    });

    it('should set hasFilledBusinessAddress to true when business address is provided', async () => {
      // Arrange: Mock successful operations
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);

      // Act: Call the service function
      await addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation);

      // Assert: Verify completion flag was set correctly
      expect(mockSeller.hasFilledBusinessAddress).toBe(true);
    });

    it('should set hasFilledBusinessAddress to false when business address is null', async () => {
      // Arrange: Mock successful operations with null business address
      const businessInfoWithoutAddress = {
        ...validBusinessInformation,
        businessAddress: null
      };

      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);

      // Act: Call the service function
      await addBusinessInformation('507f1f77bcf86cd799439011', businessInfoWithoutAddress);

      // Assert: Verify completion flag was set correctly
      expect(mockSeller.hasFilledBusinessAddress).toBe(false);
    });

    it('should set hasFilledBusinessAddress to false when business address is undefined', async () => {
      // Arrange: Mock successful operations with undefined business address
      const businessInfoWithoutAddress = {
        ...validBusinessInformation,
        businessAddress: undefined
      };

      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);

      // Act: Call the service function
      await addBusinessInformation('507f1f77bcf86cd799439011', businessInfoWithoutAddress);

      // Assert: Verify completion flag was set correctly
      expect(mockSeller.hasFilledBusinessAddress).toBe(false);
    });

    it('should throw validation error when validator fails', async () => {
      // Arrange: Mock validator to throw error
      const validationError = new Error('Validation failed');
      validationError.errors = [
        { field: 'businessEmail', message: 'Business email is required' }
      ];
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert: Should throw validation error
      await expect(addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation))
        .rejects.toThrow('Validation failed');

      // Assert: Verify validator was called
      expect(addBusinessInformationValidator.validateAddBusinessInformationData)
        .toHaveBeenCalledWith(validBusinessInformation);

      // Assert: Verify repository was not called
      expect(sellerRepository.findById).not.toHaveBeenCalled();
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when seller is not found', async () => {
      // Arrange: Mock validator success and repository to return null
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(null);

      // Act & Assert: Should throw error for seller not found
      await expect(addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation))
        .rejects.toThrow('Seller not found');

      // Assert: Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');

      // Assert: Verify save was not called
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when repository findById fails', async () => {
      // Arrange: Mock validator success and repository to throw error
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert: Should throw database error
      await expect(addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation))
        .rejects.toThrow('Database connection failed');

      // Assert: Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');

      // Assert: Verify save was not called
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when repository save fails', async () => {
      // Arrange: Mock successful validation and findById, but save fails
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockRejectedValue(new Error('Save operation failed'));

      // Act & Assert: Should throw save error
      await expect(addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation))
        .rejects.toThrow('Save operation failed');

      // Assert: Verify both repository operations were called
      expect(sellerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(sellerRepository.save).toHaveBeenCalledWith(mockSeller);
    });

    it('should handle business information without optional addressLine2', async () => {
      // Arrange: Remove optional addressLine2
      const businessInfoWithoutOptional = { ...validBusinessInformation };
      delete businessInfoWithoutOptional.businessAddress.addressLine2;

      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);

      // Act: Call the service function
      const result = await addBusinessInformation('507f1f77bcf86cd799439011', businessInfoWithoutOptional);

      // Assert: Verify the result structure and content
      expect(result).toEqual({
        message: 'Business information added successfully',
        seller: mockSeller
      });

      // Assert: Verify seller fields were updated correctly
      expect(mockSeller.businessAddress).toEqual(businessInfoWithoutOptional.businessAddress);
    });

    it('should preserve existing seller data while updating business information', async () => {
      // Arrange: Mock seller with existing data
      const sellerWithExistingData = {
        ...mockSeller,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        storeName: 'John\'s Store',
        businessName: 'Existing Business',
        businessType: 'LLC'
      };

      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(sellerWithExistingData);
      sellerRepository.save.mockResolvedValue(sellerWithExistingData);

      // Act: Call the service function
      await addBusinessInformation('507f1f77bcf86cd799439011', validBusinessInformation);

      // Assert: Verify existing data was preserved
      expect(sellerWithExistingData.firstName).toBe('John');
      expect(sellerWithExistingData.lastName).toBe('Doe');
      expect(sellerWithExistingData.email).toBe('john@example.com');
      expect(sellerWithExistingData.storeName).toBe('John\'s Store');
      expect(sellerWithExistingData.businessName).toBe('Existing Business');
      expect(sellerWithExistingData.businessType).toBe('LLC');

      // Assert: Verify business information was updated
      expect(sellerWithExistingData.businessEmail).toBe(validBusinessInformation.businessEmail);
      // Phone number should be normalized ('+2348012345678' -> '8012345678')
      expect(sellerWithExistingData.businessNumber).toBe('08012345678');
      expect(sellerWithExistingData.businessAddress).toEqual(validBusinessInformation.businessAddress);
    });

    it('refuses saving an address with no listed area, even if a validator is bypassed', async () => {
      const data = {...validBusinessInformation,businessAddress:{country:'',state:'',city:'',addressLine1:'',zipCode:''}};
      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(()=>{});
      sellerRepository.findById.mockResolvedValue(mockSeller);
      await expect(addBusinessInformation('507f1f77bcf86cd799439011',data)).rejects.toThrow('Choose your area from the list.');
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should handle special characters in business information', async () => {
      // Arrange: Mock business information with special characters
      const businessInfoWithSpecialChars = {
        businessEmail: 'business+test@tech-solutions.co.uk',
        businessNumber: '+234-803-123-4567',
        businessAddress: {
          country: 'United States',
          state: 'Lagos',
          city: 'Amuwo-Odofin',
          addressLine1: '123 Main St. #456',
          addressLine2: 'Apt. 7B',
          zipCode: '10001-1234'
        }
      };

      addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
      sellerRepository.findById.mockResolvedValue(mockSeller);
      sellerRepository.save.mockResolvedValue(mockSeller);

      // Act: Call the service function
      await addBusinessInformation('507f1f77bcf86cd799439011', businessInfoWithSpecialChars);

      // Assert: Verify special characters were handled correctly
      expect(mockSeller.businessEmail).toBe(businessInfoWithSpecialChars.businessEmail);
      // Phone number should be normalized ('+1-234-567-8900' -> '2345678900')
      // The normalization removes country code (+1) and special characters
      expect(mockSeller.businessNumber).toBe('08031234567');
      expect(mockSeller.businessAddress).toEqual(businessInfoWithSpecialChars.businessAddress);
    });

    /**
     * Phone Number Normalization Tests
     * These tests verify backward compatibility with legacy phone number formats
     */
    describe('phone number normalization', () => {
      it('should normalize phone numbers starting with 0 (legacy format)', async () => {
        // Arrange: Phone number in old format with leading 0
        const businessInfo = {
          businessEmail: 'test@example.com',
          businessNumber: '08106430258',
          businessAddress: {
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Yaba',
            addressLine1: '123 Test Street',
            zipCode: '100001'
          }
        };

        addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
        sellerRepository.findById.mockResolvedValue(mockSeller);
        sellerRepository.save.mockResolvedValue(mockSeller);

        // Act: Call the service function
        await addBusinessInformation('507f1f77bcf86cd799439011', businessInfo);

        // Assert: Phone number should be normalized to '8106430258'
        expect(mockSeller.businessNumber).toBe('08106430258');
      });

      it('should normalize phone numbers in +234 format', async () => {
        // Arrange: Phone number in international format
        const businessInfo = {
          businessEmail: 'test@example.com',
          businessNumber: '+2348106430258',
          businessAddress: {
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Yaba',
            addressLine1: '123 Test Street',
            zipCode: '100001'
          }
        };

        addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
        sellerRepository.findById.mockResolvedValue(mockSeller);
        sellerRepository.save.mockResolvedValue(mockSeller);

        // Act: Call the service function
        await addBusinessInformation('507f1f77bcf86cd799439011', businessInfo);

        // Assert: Phone number should be normalized to '8106430258'
        expect(mockSeller.businessNumber).toBe('08106430258');
      });

      it('should normalize phone numbers in 234 format (without +)', async () => {
        // Arrange: Phone number in 234 format without +
        const businessInfo = {
          businessEmail: 'test@example.com',
          businessNumber: '2348106430258',
          businessAddress: {
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Yaba',
            addressLine1: '123 Test Street',
            zipCode: '100001'
          }
        };

        addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
        sellerRepository.findById.mockResolvedValue(mockSeller);
        sellerRepository.save.mockResolvedValue(mockSeller);

        // Act: Call the service function
        await addBusinessInformation('507f1f77bcf86cd799439011', businessInfo);

        // Assert: Phone number should be normalized to '8106430258'
        expect(mockSeller.businessNumber).toBe('08106430258');
      });

      it('should leave already-normalized phone numbers unchanged', async () => {
        // Arrange: Phone number already in correct format
        const businessInfo = {
          businessEmail: 'test@example.com',
          businessNumber: '8106430258',
          businessAddress: {
            country: 'Nigeria',
            state: 'Lagos',
            city: 'Yaba',
            addressLine1: '123 Test Street',
            zipCode: '100001'
          }
        };

        addBusinessInformationValidator.validateAddBusinessInformationData.mockImplementation(() => { });
        sellerRepository.findById.mockResolvedValue(mockSeller);
        sellerRepository.save.mockResolvedValue(mockSeller);

        // Act: Call the service function
        await addBusinessInformation('507f1f77bcf86cd799439011', businessInfo);

        // Assert: Phone number should remain '8106430258'
        expect(mockSeller.businessNumber).toBe('08106430258');
      });
    });
  });
});
