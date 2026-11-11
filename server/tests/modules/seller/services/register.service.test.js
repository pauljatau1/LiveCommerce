const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const registerService = require('@modules/seller/services/register.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const sellerValidator = require('@modules/seller/validators/register.validator');
const Seller = require('@models/Seller');

// Mock external dependencies
jest.mock('@utils/helpers', () => ({ ...jest.requireActual('@utils/helpers'), generateToken: jest.fn(), generateOTP: jest.fn() }));
jest.mock('@services/termiiEmailService', () => ({
  sendRawHTMLEmail: jest.fn().mockResolvedValue(true)
}));

const termiiEmailService = require('@services/termiiEmailService');
const { generateOTP, generateToken } = require('@utils/helpers');

describe('Seller Registration Service', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    process.env.TERMII_API_KEY = 'test-key';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Seller.deleteMany({});
    jest.clearAllMocks();

    // Explicitly reset Termii mock to success
    termiiEmailService.sendRawHTMLEmail.mockResolvedValue(true);

    // Mock helper functions
    generateToken.mockReturnValue('mock-jwt-token');
  });

  describe('register', () => {
    const validRegistrationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phoneNumber: '1234567890',
      storeName: 'John Store'
    };

    it('should successfully register a new seller', async () => {
      const result = await registerService.register(validRegistrationData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.user.email).toBe('john.doe@example.com');
      expect(result.user.phoneNumber).toBe('1234567890');
      expect(result.user.storeName).toBe('John Store');
      expect(result.user.agoraUid).toBeDefined();
      expect(result.user.emailVerified).toBe(true);
    });

    it('should validate registration data before processing', async () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        password: '123',
        phoneNumber: '123',
        storeName: ''
      };

      await expect(registerService.register(invalidData)).rejects.toThrow();
    });

    it('should throw error when email already exists', async () => {
      // Create existing seller
      const existingSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john.doe@example.com',
        password: 'password456',
        phoneNumber: '0987654321',
        storeName: 'Jane Store'
      });
      await existingSeller.save();

      await expect(registerService.register(validRegistrationData)).rejects.toThrow();
    });

    it('should generate unique Agora UID for new seller', async () => {
      const result = await registerService.register(validRegistrationData);

      expect(result.user.agoraUid).toBeDefined();
      expect(typeof result.user.agoraUid).toBe('number');
      expect(result.user.agoraUid).toBeGreaterThanOrEqual(100000);
      expect(result.user.agoraUid).toBeLessThanOrEqual(4294967295);
    });

    it('should automatically verify email on registration', async () => {
      const result = await registerService.register(validRegistrationData);

      expect(result.user.emailVerified).toBe(true);
    });

    it('should generate JWT token for authentication', async () => {
      const result = await registerService.register(validRegistrationData);

      expect(generateToken).toHaveBeenCalledWith(
        result.user._id,
        'Seller',
        '2w'
      );
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should send welcome email to new seller', async () => {
      await registerService.register(validRegistrationData);

      expect(termiiEmailService.sendRawHTMLEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john.doe@example.com',
          subject: `Your store is ready · ${process.env.APP_NAME || 'gbam'}`,
          html: expect.stringContaining('John') // HTML content check
        })
      );
    });

    it('should send admin notification about new registration', async () => {
      await registerService.register(validRegistrationData);

      // Since sendAdminNotification sends to each admin separately in loop, we check calls
      const calls = termiiEmailService.sendRawHTMLEmail.mock.calls;
      const adminEmailCall = calls.find(call =>
        call[0].subject === 'New Seller Registration - Auqli' &&
        call[0].email === 'admin@auqli.com'
      );

      expect(adminEmailCall).toBeDefined();
      expect(adminEmailCall[0].html).toContain('John Doe');
      expect(adminEmailCall[0].html).toContain('john.doe@example.com');
    });

    it('should succeed even when email sending fails because email is non-blocking', async () => {
      // Mock email sending to fail - but registration should still succeed
      termiiEmailService.sendRawHTMLEmail.mockRejectedValue(new Error('Email service unavailable'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Registration should succeed despite email failure
      const result = await registerService.register(validRegistrationData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('john.doe@example.com');

      // Verify seller was saved to database
      const savedSeller = await Seller.findById(result.user._id);
      expect(savedSeller).toBeDefined();
      expect(savedSeller.email).toBe('john.doe@example.com');

      consoleSpy.mockRestore();
    });

    it('should save seller to database with all required fields', async () => {
      const result = await registerService.register(validRegistrationData);

      // Verify seller was saved to database
      const savedSeller = await Seller.findById(result.user._id);
      expect(savedSeller).toBeDefined();
      expect(savedSeller.firstName).toBe('John');
      expect(savedSeller.lastName).toBe('Doe');
      expect(savedSeller.email).toBe('john.doe@example.com');
      expect(savedSeller.phoneNumber).toBe('1234567890');
      expect(savedSeller.storeName).toBe('John Store');
      expect(savedSeller.agoraUid).toBeDefined();
      expect(savedSeller.emailVerified).toBe(true);
    });

    it('should handle whitespace in input fields', async () => {
      const dataWithWhitespace = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '  1234567890  ',
        storeName: '  John Store  '
      };

      const result = await registerService.register(dataWithWhitespace);

      expect(result.user.firstName).toBe('  John  ');
      expect(result.user.lastName).toBe('  Doe  ');
      expect(result.user.email).toBe('john.doe@example.com');
      expect(result.user.phoneNumber).toBe('  1234567890  ');
      expect(result.user.storeName).toBe('  John Store  ');
    });

    it('should ensure Agora UID uniqueness', async () => {
      // Create a seller with a specific Agora UID
      const existingSeller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password456',
        phoneNumber: '0987654321',
        storeName: 'Jane Store',
        agoraUid: 123456789
      });
      await existingSeller.save();

      // Mock the repository to simulate collision and then success
      const originalFindByAgoraUid = sellerRepository.findByAgoraUid;
      sellerRepository.findByAgoraUid = jest.fn()
        .mockResolvedValueOnce(existingSeller) // First call returns existing seller
        .mockResolvedValueOnce(null); // Second call returns null (unique)

      const result = await registerService.register(validRegistrationData);

      expect(result.user.agoraUid).toBeDefined();
      expect(result.user.agoraUid).not.toBe(123456789);
      expect(sellerRepository.findByAgoraUid).toHaveBeenCalledTimes(2);

      // Restore original function
      sellerRepository.findByAgoraUid = originalFindByAgoraUid;
    });

    it('should throw error if unable to generate unique Agora UID after 5 attempts', async () => {
      // Mock the repository to always return an existing seller
      const originalFindByAgoraUid = sellerRepository.findByAgoraUid;
      sellerRepository.findByAgoraUid = jest.fn().mockResolvedValue({ _id: 'existing' });

      await expect(registerService.register(validRegistrationData)).rejects.toThrow('Failed to generate unique Agora UID after 5 attempts');

      // Restore original function
      sellerRepository.findByAgoraUid = originalFindByAgoraUid;
    });

    describe('error handling', () => {
      it('should throw validation error for invalid data', async () => {
        const invalidData = {
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: '123',
          phoneNumber: '123',
          storeName: ''
        };

        await expect(registerService.register(invalidData)).rejects.toThrow();
      });

      it('should throw error when email already exists', async () => {
        // Create existing seller
        const existingSeller = new Seller({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'john.doe@example.com',
          password: 'password456',
          phoneNumber: '0987654321',
          storeName: 'Jane Store'
        });
        await existingSeller.save();

        await expect(registerService.register(validRegistrationData)).rejects.toThrow();
      });

      it('should handle database errors gracefully', async () => {
        // Mock repository to throw error
        const originalSaveSeller = sellerRepository.saveSeller;
        sellerRepository.saveSeller = jest.fn().mockRejectedValue(new Error('Database connection failed'));

        await expect(registerService.register(validRegistrationData)).rejects.toThrow('Database connection failed');

        // Restore original function
        sellerRepository.saveSeller = originalSaveSeller;
      });
    });
  });
});
