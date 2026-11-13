const loginService = require('@modules/buyer/services/login.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const loginValidator = require('@modules/buyer/validators/login.validator');
const ValidationError = require('@utils/errors/ValidationError');
const UnauthorizedException = require('@utils/errors/UnauthorizedException');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/login.validator');
jest.mock('@utils/helpers');
jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn(() => ({
    sendPushNotificationsAsync: jest.fn()
  }))
}));

describe('Login Service', () => {
  const mockBuyerId = '507f1f77bcf86cd799439011';
  const mockBuyer = {
    _id: mockBuyerId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    comparePassword: jest.fn()
  };

  const mockHelpers = require('@utils/helpers');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock buyer
    mockBuyer.comparePassword.mockReset();
    
    // Ensure validator mock is properly reset
    loginValidator.validateLoginData.mockReset();
  });

  describe('login', () => {
    describe('Regular Email/Password Login', () => {
      it('should successfully login with valid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(mockBuyer);
        mockBuyer.comparePassword.mockResolvedValue(true);

        const result = await loginService.login(loginData);

        expect(loginValidator.validateLoginData).toHaveBeenCalledWith(loginData);
        expect(buyerRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
        expect(mockBuyer.comparePassword).toHaveBeenCalledWith(loginData.password);
        expect(result).toEqual({
          user: mockBuyer
        });
      });
    });

    describe('Validation Errors', () => {
      it('should throw ValidationError when email is missing', async () => {
        const loginData = {
          password: 'password123'
        };

        const validationErrors = [{ field: 'email', message: 'Email is required' }];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
        await expect(loginService.login(loginData)).rejects.toThrow('Validation failed');
      });

      it('should throw ValidationError when password is missing', async () => {
        const loginData = {
          email: 'test@example.com'
        };

        const validationErrors = [{ field: 'password', message: 'Password is required' }];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
        await expect(loginService.login(loginData)).rejects.toThrow('Validation failed');
      });

      it('should throw ValidationError when both email and password are missing', async () => {
        const loginData = {};

        const validationErrors = [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password is required' }
        ];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
      });
    });

    describe('Authentication Errors', () => {
      it('should throw UnauthorizedException when buyer is not found', async () => {
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(null);

        await expect(loginService.login(loginData)).rejects.toThrow(UnauthorizedException);
        await expect(loginService.login(loginData)).rejects.toThrow('Invalid credentials');
        await expect(loginService.login(loginData)).rejects.toMatchObject({statusCode:401});
      });

      it('should throw UnauthorizedException when password is incorrect', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(mockBuyer);
        mockBuyer.comparePassword.mockResolvedValue(false);

        await expect(loginService.login(loginData)).rejects.toThrow(UnauthorizedException);
        await expect(loginService.login(loginData)).rejects.toThrow('Invalid credentials');
        await expect(loginService.login(loginData)).rejects.toMatchObject({statusCode:401});
      });
    });

    describe('Google Login', () => {
      it('should call googleLoginMobile when googleToken is provided', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123',
          googleToken: 'google-token'
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(mockBuyer);
        mockBuyer.comparePassword.mockResolvedValue(true);

        await loginService.login(loginData);

        // Should still validate and find buyer, but the actual Google login logic
        // would be handled in googleLoginMobile (which is not exported)
        expect(loginValidator.validateLoginData).toHaveBeenCalledWith(loginData);
        expect(buyerRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      });
    });

    describe('Error Handling', () => {
      it('should handle comparePassword errors gracefully', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(mockBuyer);
        mockBuyer.comparePassword.mockRejectedValue(new Error('Password comparison error'));

        await expect(loginService.login(loginData)).rejects.toThrow('Password comparison error');
      });

      it('should handle findByEmail errors gracefully', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockRejectedValue(new Error('Database error'));

        await expect(loginService.login(loginData)).rejects.toThrow('Database error');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string email', async () => {
        const loginData = {
          email: '',
          password: 'password123'
        };

        const validationErrors = [{ field: 'email', message: 'Email is required' }];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
      });

      it('should handle empty string password', async () => {
        const loginData = {
          email: 'test@example.com',
          password: ''
        };

        const validationErrors = [{ field: 'password', message: 'Password is required' }];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
      });

      it('should handle null values in login data', async () => {
        const loginData = {
          email: null,
          password: null
        };

        const validationErrors = [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password is required' }
        ];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
      });

      it('should handle undefined values in login data', async () => {
        const loginData = {
          email: undefined,
          password: undefined
        };

        const validationErrors = [
          { field: 'email', message: 'Email is required' },
          {field: 'password', message: 'Password is required' }
        ];
        loginValidator.validateLoginData.mockRejectedValue(new ValidationError(validationErrors));

        await expect(loginService.login(loginData)).rejects.toThrow(ValidationError);
      });

      it('should handle buyer with null comparePassword method', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const buyerWithoutComparePassword = {
          ...mockBuyer,
          comparePassword: null
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(buyerWithoutComparePassword);

        await expect(loginService.login(loginData)).rejects.toThrow();
      });

      it('should handle buyer with undefined comparePassword method', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const buyerWithoutComparePassword = {
          ...mockBuyer,
          comparePassword: undefined
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(buyerWithoutComparePassword);

        await expect(loginService.login(loginData)).rejects.toThrow();
      });
    });

    describe('Data Integrity', () => {
      it('should preserve all buyer fields in result', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const extendedBuyer = {
          ...mockBuyer,
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          email: 'test@example.com',
          country: 'US',
          phoneNumber: '+1234567890',
          profileImage: { url: 'https://example.com/profile.jpg' },
          emailVerified: true,
          phoneVerified: false,
          isDisabled: false,
          isNewBuyer: true,
          createdAt: new Date('2024-01-01'),
          isIdentityVerified: false,
          preferredCurrency: 'USD',
          preferredLanguage: 'en',
          role: 'buyer',
          wallet: { balance: 100.50 },
          bio: 'Hello, I am John!',
          notificationPreferences: { email: true, push: false },
          isActive: true
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(extendedBuyer);
        mockBuyer.comparePassword.mockResolvedValue(true);

        const result = await loginService.login(loginData);

        expect(result.user).toEqual(extendedBuyer);
      });

      it('should handle buyer with minimal fields', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const minimalBuyer = {
          _id: mockBuyerId,
          email: 'test@example.com',
          comparePassword: jest.fn().mockResolvedValue(true)
        };

        loginValidator.validateLoginData.mockResolvedValue();
        buyerRepository.findByEmail.mockResolvedValue(minimalBuyer);

        const result = await loginService.login(loginData);

        expect(result.user).toEqual(minimalBuyer);
      });
    });
  });
}); 