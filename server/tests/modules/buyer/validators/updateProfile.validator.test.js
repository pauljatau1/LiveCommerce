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
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'firstName', message: 'XSS detected' }
          ])
        });
    });

    it('should throw ValidationError for XSS in lastName', async () => {
      validateXSS.mockReturnValue({ field: 'lastName', message: 'XSS detected' });

      const data = { lastName: '<script>alert("xss")</script>' };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'lastName', message: 'XSS detected' }
          ])
        });
    });

    it('should throw ValidationError for username with spaces', async () => {
      const data = { username: 'john doe' };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'username', message: 'Username cannot contain spaces' }
          ])
        });
    });

    it('should throw ValidationError for username too short', async () => {
      const data = { username: 'jo' };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'username', message: 'Username must be at least 3 characters long' }
          ])
        });
    });

    it('should throw ValidationError for username too long', async () => {
      const data = { username: 'a'.repeat(31) };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'username', message: 'Username must not exceed 30 characters' }
          ])
        });
    });

    it('should throw ValidationError for phone number too short', async () => {
      const data = { phoneNumber: '123456789' };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }
          ])
        });
    });

    it('should throw ValidationError for phone number too long', async () => {
      const data = { phoneNumber: '1234567890123456' };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }
          ])
        });
    });

    it('should throw ValidationError for bio too long', async () => {
      const data = { bio: 'a'.repeat(501) };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'bio', message: 'Bio must not exceed 500 characters' }
          ])
        });
    });

    it('should throw ValidationError for preferredLanguage too long', async () => {
      const data = { preferredLanguage: 'a'.repeat(11) };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'preferredLanguage', message: 'Preferred language must not exceed 10 characters' }
          ])
        });
    });

    it('should throw ValidationError for preferredCurrency too long', async () => {
      const data = { preferredCurrency: 'USDD' };

      await expect(validateUpdateProfileData(data))
        .rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'preferredCurrency', message: 'Preferred currency must not exceed 3 characters' }
          ])
        });
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

      await expect(validateUpdateProfileData(data)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'firstName', message: 'XSS detected' },
          { field: 'username', message: 'Username must be at least 3 characters long' },
          { field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }
        ])
      });
    });

    describe('Specific Error Messages', () => {
      beforeEach(() => {
        validateXSS.mockReturnValue(null);
      });

      it('should include specific error message for firstName with XSS', async () => {
        validateXSS.mockReturnValue({
          field: 'firstName',
          message: 'Invalid characters detected in firstName'
        });

        await expect(validateUpdateProfileData({
          firstName: '<script>alert("xss")</script>'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'firstName',
                message: 'Invalid characters detected in firstName'
              }
            ])
          });
      });

      it('should include specific error message for lastName with XSS', async () => {
        validateXSS.mockReturnValue({
          field: 'lastName',
          message: 'Invalid characters detected in lastName'
        });

        await expect(validateUpdateProfileData({
          lastName: '<script>alert("xss")</script>'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'lastName',
                message: 'Invalid characters detected in lastName'
              }
            ])
          });
      });

      it('should include specific error message for firstName exceeding length limit', async () => {
        await expect(validateUpdateProfileData({
          firstName: 'A'.repeat(101)
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'firstName',
                message: 'First name must not exceed 100 characters'
              }
            ])
          });
      });

      it('should include specific error message for lastName exceeding length limit', async () => {
        await expect(validateUpdateProfileData({
          lastName: 'A'.repeat(101)
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'lastName',
                message: 'Last name must not exceed 100 characters'
              }
            ])
          });
      });

      it('should include specific error message for username with spaces', async () => {
        await expect(validateUpdateProfileData({
          username: 'john doe'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'username',
                message: 'Username cannot contain spaces'
              }
            ])
          });
      });

      it('should include specific error message for username too short', async () => {
        await expect(validateUpdateProfileData({
          username: 'jo'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'username',
                message: 'Username must be at least 3 characters long'
              }
            ])
          });
      });

      it('should include specific error message for username too long', async () => {
        await expect(validateUpdateProfileData({
          username: 'A'.repeat(31)
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'username',
                message: 'Username must not exceed 30 characters'
              }
            ])
          });
      });

      it('should include specific error message for country with XSS', async () => {
        validateXSS.mockReturnValue({
          field: 'country',
          message: 'Invalid characters detected in country'
        });

        await expect(validateUpdateProfileData({
          country: '<script>alert("xss")</script>'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'country',
                message: 'Invalid characters detected in country'
              }
            ])
          });
      });

      it('should include specific error message for country exceeding length limit', async () => {
        await expect(validateUpdateProfileData({
          country: 'A'.repeat(101)
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'country',
                message: 'Country must not exceed 100 characters'
              }
            ])
          });
      });

      it('should include specific error message for phone number too short', async () => {
        await expect(validateUpdateProfileData({
          phoneNumber: '123456789'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'phoneNumber',
                message: 'Phone number must be between 10 and 15 characters'
              }
            ])
          });
      });

      it('should include specific error message for phone number too long', async () => {
        await expect(validateUpdateProfileData({
          phoneNumber: '1234567890123456'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'phoneNumber',
                message: 'Phone number must be between 10 and 15 characters'
              }
            ])
          });
      });

      it('should include specific error message for bio with XSS', async () => {
        validateXSS.mockReturnValue({
          field: 'bio',
          message: 'Invalid characters detected in bio'
        });

        await expect(validateUpdateProfileData({
          bio: '<script>alert("xss")</script>'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'bio',
                message: 'Invalid characters detected in bio'
              }
            ])
          });
      });

      it('should include specific error message for bio exceeding length limit', async () => {
        await expect(validateUpdateProfileData({
          bio: 'A'.repeat(501)
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'bio',
                message: 'Bio must not exceed 500 characters'
              }
            ])
          });
      });

      it('should include specific error message for preferredLanguage with XSS', async () => {
        validateXSS.mockReturnValue({
          field: 'preferredLanguage',
          message: 'Invalid characters detected in preferredLanguage'
        });

        await expect(validateUpdateProfileData({
          preferredLanguage: '<script>alert("xss")</script>'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'preferredLanguage',
                message: 'Invalid characters detected in preferredLanguage'
              }
            ])
          });
      });

      it('should include specific error message for preferredLanguage exceeding length limit', async () => {
        await expect(validateUpdateProfileData({
          preferredLanguage: 'A'.repeat(11)
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'preferredLanguage',
                message: 'Preferred language must not exceed 10 characters'
              }
            ])
          });
      });

      it('should include specific error message for preferredCurrency with XSS', async () => {
        validateXSS.mockReturnValue({
          field: 'preferredCurrency',
          message: 'Invalid characters detected in preferredCurrency'
        });

        await expect(validateUpdateProfileData({
          preferredCurrency: '<script>alert("xss")</script>'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'preferredCurrency',
                message: 'Invalid characters detected in preferredCurrency'
              }
            ])
          });
      });

      it('should include specific error message for preferredCurrency exceeding length limit', async () => {
        await expect(validateUpdateProfileData({
          preferredCurrency: 'USDD'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'preferredCurrency',
                message: 'Preferred currency must not exceed 3 characters'
              }
            ])
          });
      });

      it('should include multiple error messages for multiple validation failures', async () => {
        validateXSS.mockReturnValue({
          field: 'firstName',
          message: 'Invalid characters detected in firstName'
        });

        await expect(validateUpdateProfileData({
          firstName: '<script>alert("xss")</script>',
          username: 'jo',
          phoneNumber: '123'
        }))
          .rejects
          .toMatchObject({
            errors: expect.arrayContaining([
              {
                field: 'firstName',
                message: 'Invalid characters detected in firstName'
              },
              {
                field: 'username',
                message: 'Username must be at least 3 characters long'
              },
              {
                field: 'phoneNumber',
                message: 'Phone number must be between 10 and 15 characters'
              }
            ])
          });
      });
    });
  });
}); 