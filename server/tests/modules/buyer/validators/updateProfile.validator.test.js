const { validateUpdateProfileData } = require('@modules/buyer/validators/updateProfile.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Update Profile Validator', () => {
  describe('validateUpdateProfileData', () => {
    it('should not throw for valid data', async () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        country: 'USA',
        phoneNumber: '1234567890',
        bio: 'A short bio',
        preferredLanguage: 'en',
        preferredCurrency: 'USD'
      };

      await expect(validateUpdateProfileData(validData)).resolves.not.toThrow();
    });

    it('should not throw for empty data object', async () => {
      const emptyData = {};
      await expect(validateUpdateProfileData(emptyData)).resolves.not.toThrow();
    });

    it('should not throw for partial data', async () => {
      const partialData = {
        firstName: 'John'
      };
      await expect(validateUpdateProfileData(partialData)).resolves.not.toThrow();
    });

    it('should throw ValidationError for invalid firstName', async () => {
      const invalidData = {
        firstName: 'A'.repeat(101) // Exceeds 100 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'firstName', message: 'First name must not exceed 100 characters' }]
      });
    });

    it('should throw ValidationError for invalid lastName', async () => {
      const invalidData = {
        lastName: 'A'.repeat(101) // Exceeds 100 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'lastName', message: 'Last name must not exceed 100 characters' }]
      });
    });

    it('should throw ValidationError for invalid username', async () => {
      const invalidData = {
        username: 'jo' // Less than 3 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'username', message: 'Username must be at least 3 characters long' }]
      });
    });

    it('should throw ValidationError for username with spaces', async () => {
      const invalidData = {
        username: 'john doe'
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'username', message: 'Username cannot contain spaces' }]
      });
    });

    it('should throw ValidationError for username too long', async () => {
      const invalidData = {
        username: 'A'.repeat(31) // Exceeds 30 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'username', message: 'Username must not exceed 30 characters' }]
      });
    });

    it('should throw ValidationError for invalid country', async () => {
      const invalidData = {
        country: 'A'.repeat(101) // Exceeds 100 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'country', message: 'Country must not exceed 100 characters' }]
      });
    });

    it('should throw ValidationError for invalid phoneNumber', async () => {
      const invalidData = {
        phoneNumber: '123' // Too short
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }]
      });
    });

    it('should throw ValidationError for phoneNumber too long', async () => {
      const invalidData = {
        phoneNumber: '1'.repeat(16) // Too long
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }]
      });
    });

    it('should throw ValidationError for invalid bio', async () => {
      const invalidData = {
        bio: 'A'.repeat(501) // Exceeds 500 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'bio', message: 'Bio must not exceed 500 characters' }]
      });
    });

    it('should throw ValidationError for invalid preferredLanguage', async () => {
      const invalidData = {
        preferredLanguage: 'A'.repeat(11) // Exceeds 10 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'preferredLanguage', message: 'Preferred language must not exceed 10 characters' }]
      });
    });

    it('should throw ValidationError for invalid preferredCurrency', async () => {
      const invalidData = {
        preferredCurrency: 'A'.repeat(4) // Exceeds 3 characters
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: [{ field: 'preferredCurrency', message: 'Preferred currency must not exceed 3 characters' }]
      });
    });

    it('should accumulate multiple validation errors', async () => {
      const invalidData = {
        firstName: 'A'.repeat(101),
        username: 'jo',
        phoneNumber: '123'
      };

      await expect(validateUpdateProfileData(invalidData)).rejects.toThrow(ValidationError);
      await expect(validateUpdateProfileData(invalidData)).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'firstName', message: 'First name must not exceed 100 characters' },
          { field: 'username', message: 'Username must be at least 3 characters long' },
          { field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }
        ])
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for firstName too long', async () => {
        await expect(validateUpdateProfileData({ firstName: 'A'.repeat(101) })).rejects.toMatchObject({
          errors: [{ field: 'firstName', message: 'First name must not exceed 100 characters' }]
        });
      });

      it('should include specific error message for lastName too long', async () => {
        await expect(validateUpdateProfileData({ lastName: 'A'.repeat(101) })).rejects.toMatchObject({
          errors: [{ field: 'lastName', message: 'Last name must not exceed 100 characters' }]
        });
      });

      it('should include specific error message for username too short', async () => {
        await expect(validateUpdateProfileData({ username: 'jo' })).rejects.toMatchObject({
          errors: [{ field: 'username', message: 'Username must be at least 3 characters long' }]
        });
      });

      it('should include specific error message for username with spaces', async () => {
        await expect(validateUpdateProfileData({ username: 'john doe' })).rejects.toMatchObject({
          errors: [{ field: 'username', message: 'Username cannot contain spaces' }]
        });
      });

      it('should include specific error message for username too long', async () => {
        await expect(validateUpdateProfileData({ username: 'A'.repeat(31) })).rejects.toMatchObject({
          errors: [{ field: 'username', message: 'Username must not exceed 30 characters' }]
        });
      });

      it('should include specific error message for country too long', async () => {
        await expect(validateUpdateProfileData({ country: 'A'.repeat(101) })).rejects.toMatchObject({
          errors: [{ field: 'country', message: 'Country must not exceed 100 characters' }]
        });
      });

      it('should include specific error message for phoneNumber too short', async () => {
        await expect(validateUpdateProfileData({ phoneNumber: '123' })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }]
        });
      });

      it('should include specific error message for phoneNumber too long', async () => {
        await expect(validateUpdateProfileData({ phoneNumber: '1'.repeat(16) })).rejects.toMatchObject({
          errors: [{ field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' }]
        });
      });

      it('should include specific error message for bio too long', async () => {
        await expect(validateUpdateProfileData({ bio: 'A'.repeat(501) })).rejects.toMatchObject({
          errors: [{ field: 'bio', message: 'Bio must not exceed 500 characters' }]
        });
      });

      it('should include specific error message for preferredLanguage too long', async () => {
        await expect(validateUpdateProfileData({ preferredLanguage: 'A'.repeat(11) })).rejects.toMatchObject({
          errors: [{ field: 'preferredLanguage', message: 'Preferred language must not exceed 10 characters' }]
        });
      });

      it('should include specific error message for preferredCurrency too long', async () => {
        await expect(validateUpdateProfileData({ preferredCurrency: 'A'.repeat(4) })).rejects.toMatchObject({
          errors: [{ field: 'preferredCurrency', message: 'Preferred currency must not exceed 3 characters' }]
        });
      });
    });
  });
}); 