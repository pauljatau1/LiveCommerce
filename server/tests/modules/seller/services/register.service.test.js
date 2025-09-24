const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const registerService = require('@modules/seller/services/register.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const sellerValidator = require('@modules/seller/validators/register.validator');
const Seller = require('@models/Seller');

// Mock external dependencies
jest.mock('@sendgrid/mail');
jest.mock('@utils/helpers');

const sgMail = require('@sendgrid/mail');
const { generateOTP, generateToken } = require('@utils/helpers');

describe('Seller Registration Service', () => {
  let mongoServer;

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
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Seller.deleteMany({});
    jest.clearAllMocks();
    
    // Mock SendGrid
    sgMail.send.mockResolvedValue([{ statusCode: 202 }]);
    
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

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john.doe@example.com',
          from: 'Auqli Nigeria <support@auqli.com>',
          subject: "Welcome to Auqli — Let's Get You Selling"
        })
      );
    });

    it('should send admin notification about new registration', async () => {
      await registerService.register(validRegistrationData);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['admin@auqli.com'],
          from: 'Auqli Admin <support@auqli.com>',
          subject: 'New Seller Registration - Auqli'
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      // Mock email sending to fail
      sgMail.send.mockRejectedValue(new Error('Email service unavailable'));

      await expect(registerService.register(validRegistrationData))
        .rejects
        .toThrow('Email service unavailable');
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

    describe('email functionality', () => {
      it('should send welcome email with correct content', async () => {
        await registerService.register(validRegistrationData);

        const welcomeEmailCall = sgMail.send.mock.calls.find(call => 
          call[0].subject === "Welcome to Auqli — Let's Get You Selling"
        );

        expect(welcomeEmailCall).toBeDefined();
        expect(welcomeEmailCall[0].to).toBe('john.doe@example.com');
        expect(welcomeEmailCall[0].from).toBe('Auqli Nigeria <support@auqli.com>');
        expect(welcomeEmailCall[0].html).toContain('John');
        expect(welcomeEmailCall[0].html).toContain('Welcome to Auqli Nigeria');
      });

      it('should send admin notification with seller details', async () => {
        await registerService.register(validRegistrationData);

        const adminEmailCall = sgMail.send.mock.calls.find(call => 
          call[0].subject === 'New Seller Registration - Auqli'
        );

        expect(adminEmailCall).toBeDefined();
        expect(adminEmailCall[0].to).toEqual(['admin@auqli.com']);
        expect(adminEmailCall[0].from).toBe('Auqli Admin <support@auqli.com>');
        expect(adminEmailCall[0].html).toContain('John Doe');
        expect(adminEmailCall[0].html).toContain('john.doe@example.com');
        expect(adminEmailCall[0].html).toContain('1234567890');
      });

      it('should throw error when email sending fails', async () => {
        sgMail.send.mockRejectedValue(new Error('Email service unavailable'));

        await expect(registerService.register(validRegistrationData))
          .rejects
          .toThrow('Email service unavailable');
      });
    });
  });
});
