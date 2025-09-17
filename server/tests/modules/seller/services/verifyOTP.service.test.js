// Mock dependencies before importing the service
jest.mock('@modules/seller/repositories/seller.repository', () => ({
  findByEmail: jest.fn(),
  saveSeller: jest.fn()
}));
jest.mock('@modules/seller/validators/verifyOTP.validator', () => ({
  validateVerifyOTPData: jest.fn()
}));

const verifyOTPService = require('@modules/seller/services/verifyOTP.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const { validateVerifyOTPData } = require('@modules/seller/validators/verifyOTP.validator');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

describe('Verify OTP Service', () => {
  let mockSeller;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock seller
    mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'seller@example.com',
      emailVerified: false,
      otp: '1234',
      storeName: 'John\'s Store',
      save: jest.fn()
    };
  });

  describe('verifyOTP', () => {
    const validEmail = 'seller@example.com';
    const validOTP = '1234';

    it('should successfully verify OTP and return response with token', async () => {
      // Arrange: Mock successful validation and repository operations
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      sellerRepository.saveSeller.mockResolvedValue(mockSeller);

      // Act: Call the service method
      const result = await verifyOTPService.verifyOTP(validEmail, validOTP);

      // Assert: Verify the result structure
      expect(result).toMatchObject({
        success: true,
        message: 'Email verified successfully.',
        user: mockSeller,
        token: expect.any(String)
      });

      // Assert: Verify validation was called
      expect(validateVerifyOTPData).toHaveBeenCalledWith({
        email: validEmail,
        otp: validOTP
      });

      // Assert: Verify repository operations
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockSeller.save).toHaveBeenCalledTimes(1);

      // Assert: Verify seller was updated
      expect(mockSeller.emailVerified).toBe(true);
      expect(mockSeller.otp).toBeUndefined();
    });

    it('should throw ValidationError when validation fails', async () => {
      // Arrange: Mock validation failure
      const validationError = new ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
      validateVerifyOTPData.mockRejectedValue(validationError);

      // Act & Assert: Verify ValidationError is thrown
      await expect(verifyOTPService.verifyOTP(validEmail, validOTP))
        .rejects.toThrow(ValidationError);

      // Assert: Verify validation was called
      expect(validateVerifyOTPData).toHaveBeenCalledWith({
        email: validEmail,
        otp: validOTP
      });

      // Assert: Verify repository was not called
      expect(sellerRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when seller is not found', async () => {
      // Arrange: Mock validation success but seller not found
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert: Verify NotFoundException is thrown
      await expect(verifyOTPService.verifyOTP(validEmail, validOTP))
        .rejects.toThrow(NotFoundException);
      await expect(verifyOTPService.verifyOTP(validEmail, validOTP))
        .rejects.toThrow('Seller not found');

      // Assert: Verify repository was called
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockSeller.save).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when OTP is invalid', async () => {
      // Arrange: Mock validation success and seller found but OTP mismatch
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);

      // Act & Assert: Verify ValidationError is thrown for invalid OTP
      await expect(verifyOTPService.verifyOTP(validEmail, '9999'))
        .rejects.toThrow(ValidationError);
      await expect(verifyOTPService.verifyOTP(validEmail, '9999'))
        .rejects.toMatchObject({
          errors: [{ field: 'otp', message: 'Invalid OTP' }]
        });

      // Assert: Verify repository was called
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockSeller.save).not.toHaveBeenCalled();
    });

    it('should handle database error during seller lookup', async () => {
      // Arrange: Mock validation success but database error
      validateVerifyOTPData.mockResolvedValue();
      const dbError = new Error('Database connection failed');
      sellerRepository.findByEmail.mockRejectedValue(dbError);

      // Act & Assert: Verify database error is propagated
      await expect(verifyOTPService.verifyOTP(validEmail, validOTP))
        .rejects.toThrow('Database connection failed');

      // Assert: Verify repository was called
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validEmail);
    });

    it('should handle database error during seller save', async () => {
      // Arrange: Mock successful validation and lookup but save error
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      const saveError = new Error('Save operation failed');
      mockSeller.save.mockRejectedValue(saveError);

      // Act & Assert: Verify save error is propagated
      await expect(verifyOTPService.verifyOTP(validEmail, validOTP))
        .rejects.toThrow('Save operation failed');

      // Assert: Verify repository operations
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockSeller.save).toHaveBeenCalledTimes(1);
    });

    it('should handle numeric OTP input', async () => {
      // Arrange: Mock successful operations with numeric OTP
      const numericOTP = 1234;
      const mockSellerWithNumericOTP = {
        ...mockSeller,
        otp: 1234
      };
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSellerWithNumericOTP);

      // Act: Call the service method with numeric OTP
      const result = await verifyOTPService.verifyOTP(validEmail, numericOTP);

      // Assert: Verify the result
      expect(result.success).toBe(true);
      expect(validateVerifyOTPData).toHaveBeenCalledWith({
        email: validEmail,
        otp: numericOTP
      });
    });

    it('should handle case insensitive email lookup', async () => {
      // Arrange: Mock successful operations with uppercase email
      const uppercaseEmail = 'SELLER@EXAMPLE.COM';
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      sellerRepository.saveSeller.mockResolvedValue(mockSeller);

      // Act: Call the service method with uppercase email
      const result = await verifyOTPService.verifyOTP(uppercaseEmail, validOTP);

      // Assert: Verify the result
      expect(result.success).toBe(true);
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(uppercaseEmail);
    });

    it('should generate valid JWT token', async () => {
      // Arrange: Mock successful operations
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      sellerRepository.saveSeller.mockResolvedValue(mockSeller);

      // Act: Call the service method
      const result = await verifyOTPService.verifyOTP(validEmail, validOTP);

      // Assert: Verify token is generated
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });

    it('should handle missing JWT_SECRET environment variable', async () => {
      // Arrange: Mock successful operations but missing JWT_SECRET
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      validateVerifyOTPData.mockResolvedValue();
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);

      // Act & Assert: Verify error is thrown for missing JWT_SECRET
      await expect(verifyOTPService.verifyOTP(validEmail, validOTP))
        .rejects.toThrow('secretOrPrivateKey must have a value');

      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalJwtSecret;
    });
  });
});