const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ValidationError = require('@utils/errors/ValidationError');

// Import the validator
const registerValidator = require('@modules/buyer/validators/register.validator');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const { validateXSS, validateEmailFormat } = require('@utils/validator');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@utils/validator');

let mongoServer;

describe('Register Validator', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validRegistrationData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    phoneNumber: '+2348012345678',
    password: 'password123'
  };

  describe('validateRegisterData', () => {
    it('should pass validation for valid registration data', async () => {
      // Mock repository to return empty results (no existing users)
      buyerRepository.findAll.mockResolvedValue([]);
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .resolves.toBeUndefined();

      // Verify all validation functions were called
      expect(buyerRepository.findAll).toHaveBeenCalledTimes(3); // email, username, phoneNumber
    });

    it('should throw ValidationError when any validation fails', async () => {
      // Mock email validation to fail
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('validateFirstName', () => {
    it('should pass validation for valid firstName', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: 'John'
      })).resolves.toBeUndefined();
    });

    it('should throw error when firstName is missing', async () => {
      const dataWithoutFirstName = { ...validRegistrationData };
      delete dataWithoutFirstName.firstName;

      await expect(registerValidator.validateRegisterData(dataWithoutFirstName))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when firstName is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when firstName is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: null
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when firstName is undefined', async () => {
      const dataWithoutFirstName = { ...validRegistrationData };
      dataWithoutFirstName.firstName = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutFirstName))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when firstName contains XSS patterns', async () => {
      validateXSS.mockReturnValue({
        field: 'firstName',
        message: 'Invalid characters detected in firstName'
      });

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: '<script>alert("xss")</script>'
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when firstName exceeds 100 characters', async () => {
      validateXSS.mockReturnValue(null);

      const longFirstName = 'a'.repeat(101);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: longFirstName
      })).rejects.toThrow(ValidationError);
    });

    it('should pass validation when firstName is exactly 100 characters', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      const exactFirstName = 'a'.repeat(100);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: exactFirstName
      })).resolves.toBeUndefined();
    });
  });

  describe('validateLastName', () => {
    it('should pass validation for valid lastName', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: 'Doe'
      })).resolves.toBeUndefined();
    });

    it('should throw error when lastName is missing', async () => {
      const dataWithoutLastName = { ...validRegistrationData };
      delete dataWithoutLastName.lastName;

      await expect(registerValidator.validateRegisterData(dataWithoutLastName))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when lastName is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when lastName is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: null
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when lastName is undefined', async () => {
      const dataWithoutLastName = { ...validRegistrationData };
      dataWithoutLastName.lastName = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutLastName))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when lastName contains XSS patterns', async () => {
      validateXSS.mockReturnValue({
        field: 'lastName',
        message: 'Invalid characters detected in lastName'
      });

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: '<script>alert("xss")</script>'
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when lastName exceeds 100 characters', async () => {
      validateXSS.mockReturnValue(null);

      const longLastName = 'a'.repeat(101);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: longLastName
      })).rejects.toThrow(ValidationError);
    });

    it('should pass validation when lastName is exactly 100 characters', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      const exactLastName = 'a'.repeat(100);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: exactLastName
      })).resolves.toBeUndefined();
    });
  });

  describe('validateEmail', () => {
    it('should pass validation for valid email', async () => {
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: 'john.doe@example.com'
      })).resolves.toBeUndefined();
    });

    it('should throw error when email is missing', async () => {
      const dataWithoutEmail = { ...validRegistrationData };
      delete dataWithoutEmail.email;

      await expect(registerValidator.validateRegisterData(dataWithoutEmail))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when email is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when email is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: null
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when email is undefined', async () => {
      const dataWithoutEmail = { ...validRegistrationData };
      dataWithoutEmail.email = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutEmail))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when email format is invalid', async () => {
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: 'invalid-email'
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when email already exists', async () => {
      buyerRepository.findAll.mockResolvedValue([{ email: 'john.doe@example.com' }]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should pass validation for various valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'test.user@example.com',
        'test+user@example.com',
        'test123@example.com',
        'test@subdomain.example.com',
        'test@example.co.uk'
      ];

      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      for (const email of validEmails) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          email
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('validatePhoneNumber', () => {
    it('should pass validation for valid phone number', async () => {
      buyerRepository.findAll.mockResolvedValue([]);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        phoneNumber: '+2348012345678'
      })).resolves.toBeUndefined();
    });

    it('should throw error when phoneNumber is missing', async () => {
      const dataWithoutPhone = { ...validRegistrationData };
      delete dataWithoutPhone.phoneNumber;

      await expect(registerValidator.validateRegisterData(dataWithoutPhone))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when phoneNumber is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        phoneNumber: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when phoneNumber is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        phoneNumber: null
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when phoneNumber is undefined', async () => {
      const dataWithoutPhone = { ...validRegistrationData };
      dataWithoutPhone.phoneNumber = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutPhone))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when phoneNumber already exists', async () => {
      buyerRepository.findAll.mockResolvedValue([{ phoneNumber: '+2348012345678' }]);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should pass validation for various phone number formats', async () => {
      const validPhoneNumbers = [
        '+2348012345678',
        '+1234567890',
        '+44123456789',
        '08012345678',
        '1234567890'
      ];

      buyerRepository.findAll.mockResolvedValue([]);

      for (const phoneNumber of validPhoneNumbers) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          phoneNumber
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('validateUsername', () => {
    it('should pass validation for valid username', async () => {
      buyerRepository.findAll.mockResolvedValue([]);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: 'johndoe'
      })).resolves.toBeUndefined();
    });

    it('should throw error when username is missing', async () => {
      const dataWithoutUsername = { ...validRegistrationData };
      delete dataWithoutUsername.username;

      await expect(registerValidator.validateRegisterData(dataWithoutUsername))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when username is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when username is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: null
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when username is undefined', async () => {
      const dataWithoutUsername = { ...validRegistrationData };
      dataWithoutUsername.username = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutUsername))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when username contains spaces', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: 'john doe'
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when username already exists', async () => {
      buyerRepository.findAll.mockResolvedValue([{ username: 'johndoe' }]);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should pass validation for various valid username formats', async () => {
      const validUsernames = [
        'johndoe',
        'john_doe',
        'john123',
        'john.doe',
        'john-doe',
        'johndoe123'
      ];

      buyerRepository.findAll.mockResolvedValue([]);

      for (const username of validUsernames) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          username
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('validatePassword', () => {
    it('should pass validation for valid password', async () => {
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        password: 'password123'
      })).resolves.toBeUndefined();
    });

    it('should throw error when password is missing', async () => {
      const dataWithoutPassword = { ...validRegistrationData };
      delete dataWithoutPassword.password;

      await expect(registerValidator.validateRegisterData(dataWithoutPassword))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when password is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        password: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when password is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        password: null
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when password is undefined', async () => {
      const dataWithoutPassword = { ...validRegistrationData };
      dataWithoutPassword.password = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutPassword))
        .rejects
        .toThrow(ValidationError);
    });

    it('should pass validation for various password formats', async () => {
      const validPasswords = [
        'password123',
        'P@ssw0rd!',
        'password with spaces',
        '123456789',
        'a',
        'verylongpasswordwithspecialcharacters!@#$%^&*()'
      ];

      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      for (const password of validPasswords) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          password
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('Multiple validation errors', () => {
    it('should throw ValidationError with multiple errors', async () => {
      // Mock multiple validation failures
      validateXSS.mockReturnValue({
        field: 'firstName',
        message: 'Invalid characters detected in firstName'
      });
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });
      buyerRepository.findAll.mockResolvedValue([{ username: 'johndoe' }]);

      try {
        await registerValidator.validateRegisterData({
          ...validRegistrationData,
          firstName: '<script>alert("xss")</script>',
          email: 'invalid-email'
        });
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Repository interaction', () => {
    it('should call repository with correct queries', async () => {
      // Mock all validation functions to pass
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);

      await registerValidator.validateRegisterData(validRegistrationData);

      expect(buyerRepository.findAll).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
      expect(buyerRepository.findAll).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(buyerRepository.findAll).toHaveBeenCalledWith({ phoneNumber: '+2348012345678' });
    });

    it('should handle repository errors gracefully', async () => {
      // Mock all validation functions to pass
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);
      
      // Mock repository to throw error
      buyerRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow('Database error');
    });
  });
}); 