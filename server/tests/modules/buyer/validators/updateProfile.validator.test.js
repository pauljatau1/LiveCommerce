const { validateUpdateProfileData } = require('@modules/buyer/validators/updateProfile.validator');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the validator utility
jest.mock('@utils/validator', () => ({
  validateXSS: jest.fn()
}));

const { validateXSS } = require('@utils/validator');

describe('updateProfile.validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateXSS.mockReturnValue(null); // Default to no XSS errors
  });

  describe('validateFieldIfProvided', () => {
    const mockValidator = jest.fn();

    beforeEach(() => {
      mockValidator.mockClear();
    });

    it('should call validator when field is provided', () => {
      const data = { firstName: 'John' };
      const errors = [];
      
      const { validateFieldIfProvided } = require('@modules/buyer/validators/updateProfile.validator');
      validateFieldIfProvided(data, 'firstName', mockValidator, errors);
      
      expect(mockValidator).toHaveBeenCalledWith('John');
    });

    it('should not call validator when field is undefined', () => {
      const data = { firstName: undefined };
      const errors = [];
      
      const { validateFieldIfProvided } = require('@modules/buyer/validators/updateProfile.validator');
      validateFieldIfProvided(data, 'firstName', mockValidator, errors);
      
      expect(mockValidator).not.toHaveBeenCalled();
    });

    it('should add error to errors array when validation fails', () => {
      const data = { firstName: 'John' };
      const errors = [];
      const mockError = { field: 'firstName', message: 'Invalid' };
      mockValidator.mockReturnValue(mockError);
      
      const { validateFieldIfProvided } = require('@modules/buyer/validators/updateProfile.validator');
      validateFieldIfProvided(data, 'firstName', mockValidator, errors);
      
      expect(errors).toContain(mockError);
    });

    it('should not add error when validation passes', () => {
      const data = { firstName: 'John' };
      const errors = [];
      mockValidator.mockReturnValue(null);
      
      const { validateFieldIfProvided } = require('@modules/buyer/validators/updateProfile.validator');
      validateFieldIfProvided(data, 'firstName', mockValidator, errors);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateAllFields', () => {
    it('should validate all provided fields', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };
      
      const { validateAllFields } = require('@modules/buyer/validators/updateProfile.validator');
      const errors = validateAllFields(data);
      
      // Should not have errors with valid data
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid fields', () => {
      const data = {
        firstName: 'a'.repeat(101), // Too long
        username: 'jo' // Too short
      };
      
      const { validateAllFields } = require('@modules/buyer/validators/updateProfile.validator');
      const errors = validateAllFields(data);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.field === 'firstName')).toBe(true);
      expect(errors.some(error => error.field === 'username')).toBe(true);
    });

    it('should handle empty data object', () => {
      const data = {};
      
      const { validateAllFields } = require('@modules/buyer/validators/updateProfile.validator');
      const errors = validateAllFields(data);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateUpdateProfileData', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        country: 'Nigeria',
        phoneNumber: '+2341234567890',
        bio: 'Test bio',
        preferredLanguage: 'en',
        preferredCurrency: 'NGN'
      };

      await expect(validateUpdateProfileData(validData)).resolves.not.toThrow();
    });

    it('should pass validation with partial data', async () => {
      const partialData = {
        firstName: 'John'
      };

      await expect(validateUpdateProfileData(partialData)).resolves.not.toThrow();
    });

    it('should pass validation with empty object', async () => {
      await expect(validateUpdateProfileData({})).resolves.not.toThrow();
    });

    it('should throw ValidationError for XSS in firstName', async () => {
      validateXSS.mockReturnValue({ field: 'firstName', message: 'XSS detected' });

      const data = { firstName: '<script>alert("xss")</script>' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for XSS in lastName', async () => {
      validateXSS.mockReturnValue({ field: 'lastName', message: 'XSS detected' });

      const data = { lastName: '<script>alert("xss")</script>' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for username with spaces', async () => {
      const data = { username: 'john doe' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for username too short', async () => {
      const data = { username: 'jo' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for username too long', async () => {
      const data = { username: 'a'.repeat(31) };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for phone number too short', async () => {
      const data = { phoneNumber: '123456789' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for phone number too long', async () => {
      const data = { phoneNumber: '1234567890123456' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for bio too long', async () => {
      const data = { bio: 'a'.repeat(501) };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for preferredLanguage too long', async () => {
      const data = { preferredLanguage: 'a'.repeat(11) };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for preferredCurrency too long', async () => {
      const data = { preferredCurrency: 'USDD' };

      await expect(validateUpdateProfileData(data))
        .rejects.toThrow(ValidationError);
    });

    it('should allow empty string values', async () => {
      const data = {
        firstName: '',
        lastName: '',
        bio: '',
        preferredLanguage: '',
        preferredCurrency: ''
      };

      await expect(validateUpdateProfileData(data)).resolves.not.toThrow();
    });

    it('should allow null values', async () => {
      const data = {
        firstName: null,
        lastName: null,
        bio: null,
        preferredLanguage: null,
        preferredCurrency: null
      };

      await expect(validateUpdateProfileData(data)).resolves.not.toThrow();
    });

    it('should allow undefined values', async () => {
      const data = {
        firstName: undefined,
        lastName: undefined,
        bio: undefined,
        preferredLanguage: undefined,
        preferredCurrency: undefined
      };

      await expect(validateUpdateProfileData(data)).resolves.not.toThrow();
    });

    it('should accumulate multiple validation errors', async () => {
      validateXSS.mockReturnValue({ field: 'firstName', message: 'XSS detected' });

      const data = {
        firstName: '<script>alert("xss")</script>',
        username: 'jo',
        phoneNumber: '123'
      };

      try {
        await validateUpdateProfileData(data);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toHaveLength(3);
        expect(error.errors).toEqual(
          expect.arrayContaining([
            { field: 'firstName', message: 'XSS detected' },
            { field: 'username', message: 'Username must be at least 3 characters long' },
            { field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }
          ])
        );
      }
    });
  });
}); 