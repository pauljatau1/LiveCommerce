const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const registerService = require('@modules/buyer/services/register.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const buyerValidator = require('@modules/buyer/validators/register.validator');
const Buyer = require('@models/Buyer');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/register.validator');
jest.mock('@utils/helpers');
jest.mock('@firebase');
jest.mock('@sendgrid/mail');

let mongoServer;

describe('Register Service', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear database
    await Buyer.deleteMany({});
  });

  const validRegistrationData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    country: 'NG',
    phoneNumber: '+2348012345678',
    password: 'password123',
    expoPushToken: 'test-expo-token'
  };

  describe('register function', () => {
    it('should register a new buyer successfully', async () => {
      // Mock validator
      buyerValidator.validateRegisterData.mockResolvedValue();

      // Mock repository
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      // Mock Firebase
      const Firebase = require('@firebase');
      Firebase.saveToken.mockResolvedValue();

      // Mock email sending
      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();

      // Mock helpers
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      const result = await registerService.register(validRegistrationData);

      // Verify validator was called
      expect(buyerValidator.validateRegisterData).toHaveBeenCalledWith(validRegistrationData);

      // Verify repository was called
      expect(buyerRepository.save).toHaveBeenCalled();

      // Verify Firebase token was saved
      expect(Firebase.saveToken).toHaveBeenCalledWith(mockBuyer._id, validRegistrationData.expoPushToken);

      // Verify email was sent
      expect(sgMail.send).toHaveBeenCalled();

      // Verify token was generated
      expect(generateToken).toHaveBeenCalledWith(mockBuyer._id);

      // Verify result structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should handle registration without expoPushToken', async () => {
      const dataWithoutToken = { ...validRegistrationData };
      delete dataWithoutToken.expoPushToken;

      // Mock validator
      buyerValidator.validateRegisterData.mockResolvedValue();

      // Mock repository
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      // Mock Firebase
      const Firebase = require('@firebase');
      Firebase.saveToken.mockResolvedValue();

      // Mock email sending
      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();

      // Mock helpers
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      const result = await registerService.register(dataWithoutToken);

      // Verify Firebase token was NOT saved
      expect(Firebase.saveToken).not.toHaveBeenCalled();

      // Verify other operations were performed
      expect(buyerValidator.validateRegisterData).toHaveBeenCalledWith(dataWithoutToken);
      expect(buyerRepository.save).toHaveBeenCalled();
      expect(sgMail.send).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalled();

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should throw validation error when validator fails', async () => {
      const validationError = new Error('Validation failed');
      buyerValidator.validateRegisterData.mockRejectedValue(validationError);

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Validation failed');

      expect(buyerValidator.validateRegisterData).toHaveBeenCalledWith(validRegistrationData);
      expect(buyerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when repository save fails', async () => {
      buyerValidator.validateRegisterData.mockResolvedValue();

      const saveError = new Error('Database save failed');
      buyerRepository.save.mockRejectedValue(saveError);

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Database save failed');

      expect(buyerValidator.validateRegisterData).toHaveBeenCalledWith(validRegistrationData);
      expect(buyerRepository.save).toHaveBeenCalled();
    });

    it('should throw error when email sending fails', async () => {
      buyerValidator.validateRegisterData.mockResolvedValue();

      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId()
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      const { saveToken } = require('@firebase');
      saveToken.mockResolvedValue();

      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockRejectedValue(new Error('Email sending failed'));

      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Email sending failed');
    });

    it('should throw error when Firebase token save fails', async () => {
      buyerValidator.validateRegisterData.mockResolvedValue();

      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId()
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      // Mock Firebase saveToken to fail
      const Firebase = require('@firebase');
      Firebase.saveToken.mockRejectedValue(new Error('Firebase save failed'));

      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();

      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      // Should throw error when Firebase fails
      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Firebase save failed');

      expect(buyerValidator.validateRegisterData).toHaveBeenCalledWith(validRegistrationData);
      expect(buyerRepository.save).toHaveBeenCalled();
      expect(Firebase.saveToken).toHaveBeenCalled();
    });

    it('should handle undefined expoPushToken', async () => {
      const dataWithUndefinedToken = { ...validRegistrationData };
      dataWithUndefinedToken.expoPushToken = undefined;

      // Mock validator
      buyerValidator.validateRegisterData.mockResolvedValue();

      // Mock repository
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      // Mock Firebase
      const { saveToken } = require('@firebase');
      saveToken.mockResolvedValue();

      // Mock email sending
      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();

      // Mock helpers
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      const result = await registerService.register(dataWithUndefinedToken);

      // Verify Firebase token was NOT saved
      expect(saveToken).not.toHaveBeenCalled();

      // Verify result structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should handle null expoPushToken', async () => {
      const dataWithNullToken = { ...validRegistrationData };
      dataWithNullToken.expoPushToken = null;

      // Mock validator
      buyerValidator.validateRegisterData.mockResolvedValue();

      // Mock repository
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      // Mock Firebase
      const { saveToken } = require('@firebase');
      saveToken.mockResolvedValue();

      // Mock email sending
      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();

      // Mock helpers
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      const result = await registerService.register(dataWithNullToken);

      // Verify Firebase token was NOT saved
      expect(saveToken).not.toHaveBeenCalled();

      // Verify result structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should handle empty string expoPushToken', async () => {
      const dataWithEmptyToken = { ...validRegistrationData };
      dataWithEmptyToken.expoPushToken = '';

      // Mock validator
      buyerValidator.validateRegisterData.mockResolvedValue();

      // Mock repository
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        save: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe'
        })
      };

      buyerRepository.save.mockResolvedValue(mockBuyer);

      // Mock Firebase
      const { saveToken } = require('@firebase');
      saveToken.mockResolvedValue();

      // Mock email sending
      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();

      // Mock helpers
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      const result = await registerService.register(dataWithEmptyToken);

      // Verify Firebase token was NOT saved
      expect(saveToken).not.toHaveBeenCalled();

      // Verify result structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });
  });

  describe('Input validation', () => {
    it('should handle missing required fields', async () => {
      const incompleteData = {
        firstName: 'John'
        // Missing other required fields
      };

      const validationError = new Error('Missing required fields');
      buyerValidator.validateRegisterData.mockRejectedValue(validationError);

      await expect(registerService.register(incompleteData))
        .rejects
        .toThrow('Missing required fields');
    });

    it('should handle invalid email format', async () => {
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const validationError = new Error('Invalid email format');
      buyerValidator.validateRegisterData.mockRejectedValue(validationError);

      await expect(registerService.register(invalidEmailData))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should handle duplicate email', async () => {
      const validationError = new Error('Email is already registered');
      buyerValidator.validateRegisterData.mockRejectedValue(validationError);

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Email is already registered');
    });

    it('should handle duplicate username', async () => {
      const validationError = new Error('Username is already taken');
      buyerValidator.validateRegisterData.mockRejectedValue(validationError);

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Username is already taken');
    });
  });

  describe('Error handling', () => {
    it('should propagate validation errors', async () => {
      const validationError = new Error('Validation failed');
      buyerValidator.validateRegisterData.mockRejectedValue(validationError);

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Validation failed');
    });

    it('should propagate database errors', async () => {
      buyerValidator.validateRegisterData.mockResolvedValue();
      const dbError = new Error('Database connection failed');
      buyerRepository.save.mockRejectedValue(dbError);

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should propagate email service errors', async () => {
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId()
      };

      buyerValidator.validateRegisterData.mockResolvedValue();
      buyerRepository.save.mockResolvedValue(mockBuyer);
      
      const { saveToken } = require('@firebase');
      saveToken.mockResolvedValue();
      
      const sgMail = require('@sendgrid/mail');
      const emailError = new Error('SendGrid service unavailable');
      sgMail.send.mockRejectedValue(emailError);
      
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('SendGrid service unavailable');
    });
  });

  describe('Response format', () => {
    it('should return correct response structure', async () => {
      const mockBuyer = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe'
      };

      buyerValidator.validateRegisterData.mockResolvedValue();
      buyerRepository.save.mockResolvedValue(mockBuyer);
      
      const { saveToken } = require('@firebase');
      saveToken.mockResolvedValue();
      
      const sgMail = require('@sendgrid/mail');
      sgMail.send.mockResolvedValue();
      
      const { generateOTP, generateToken } = require('@utils/helpers');
      generateOTP.mockReturnValue('1234');
      generateToken.mockReturnValue('mock-jwt-token');

      const result = await registerService.register(validRegistrationData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(typeof result.user).toBe('object');
      expect(typeof result.token).toBe('string');
      expect(result.user).toHaveProperty('_id');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('username');
    });
  });
}); 