const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const generateSmileIdTokenService = require('@modules/seller/services/generateSmileIdToken.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const generateSmileIdTokenValidator = require('@modules/seller/validators/generateSmileIdToken.validator');
const Seller = require('@models/Seller');
const ValidationError = require('@utils/errors/ValidationError');

// Mock external dependencies
jest.mock('smile-identity-core');
jest.mock('@modules/seller/validators/generateSmileIdToken.validator');

const SIDCore = require('smile-identity-core');

describe('Generate SmileID Token Service', () => {
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
    
    // Mock validator to pass by default
    generateSmileIdTokenValidator.validateGenerateSmileIdTokenData.mockReturnValue();
    
    // Set up required environment variables for tests
    process.env.SMILEID_PARTNER_ID = 'test-partner-id';
    process.env.SMILEID_API_KEY = 'test-api-key';
    process.env.BACKEND_URL = 'http://localhost:3000';
    process.env.SMILEID_SANDBOX_MODE = 'true';
  });

  describe('generateSmileIdToken', () => {
    const validTokenData = {
      accountType: 'individual',
      idType: 'NIN_SLIP',
      userId: 'user123'
    };

    const mockSeller = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    };

    const mockSmileIdResponse = {
      token: 'mock-smileid-token',
      success: true
    };

    beforeEach(() => {
      // Mock SmileID WebAPI
      const mockConnection = {
        get_web_token: jest.fn()
      };
      
      SIDCore.WebApi = jest.fn().mockImplementation(() => mockConnection);
      mockConnection.get_web_token.mockResolvedValue(mockSmileIdResponse);
    });

    it('should successfully generate SmileID token for individual account', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      // Act
      const result = await generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString());

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-smileid-token');
      expect(result.expiresAt).toBeDefined();
      expect(result.userId).toBe('user123'); // Using provided userId
      expect(result.jobId).toContain('job-');
      expect(result.product).toBe('enhanced_kyc');
      expect(result.accountType).toBe('individual');
      expect(result.idType).toBe('NIN_SLIP');
      expect(result.success).toBe(true);
    });

    it('should successfully generate SmileID token for business account', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password456',
        phoneNumber: '09876543210',
        storeName: 'Jane Store'
      });
      await seller.save();

      const businessTokenData = {
        accountType: 'business',
        idType: 'BN',
        userId: 'user456'
      };

      // Act
      const result = await generateSmileIdTokenService.generateSmileIdToken(businessTokenData, seller._id.toString());

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-smileid-token');
      expect(result.product).toBe('doc_verification');
      expect(result.accountType).toBe('business');
      expect(result.idType).toBe('BN');
    });

    it('should generate unique tracking IDs', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const tokenDataWithoutUserId = {
        accountType: 'individual',
        idType: 'NIN_SLIP'
      };

      // Act
      const result1 = await generateSmileIdTokenService.generateSmileIdToken(tokenDataWithoutUserId, seller._id.toString());
      const result2 = await generateSmileIdTokenService.generateSmileIdToken(tokenDataWithoutUserId, seller._id.toString());

      // Assert
      expect(result1.userId).not.toBe(result2.userId);
      expect(result1.jobId).not.toBe(result2.jobId);
    });

    it('should use provided userId when available', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const tokenDataWithUserId = {
        accountType: 'individual',
        idType: 'NIN_SLIP',
        userId: 'custom-user-id'
      };

      // Act
      const result = await generateSmileIdTokenService.generateSmileIdToken(tokenDataWithUserId, seller._id.toString());

      // Assert
      expect(result.userId).toBe('custom-user-id');
    });

    it('should generate userId when not provided', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const tokenDataWithoutUserId = {
        accountType: 'individual',
        idType: 'NIN_SLIP'
      };

      // Act
      const result = await generateSmileIdTokenService.generateSmileIdToken(tokenDataWithoutUserId, seller._id.toString());

      // Assert
      expect(result.userId).toContain('seller-');
      expect(result.userId).toContain(seller._id.toString());
    });

    it('should set correct token expiration time', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const beforeCall = new Date();

      // Act
      const result = await generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString());

      const afterCall = new Date();
      const expectedExpiration = new Date(beforeCall.getTime() + 3600000); // 1 hour
      const actualExpiration = new Date(result.expiresAt);

      // Assert
      expect(actualExpiration.getTime()).toBeGreaterThanOrEqual(expectedExpiration.getTime() - 1000); // Allow 1 second tolerance
      expect(actualExpiration.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 3600000 + 1000); // Allow 1 second tolerance
    });

    it('should validate input data before processing', async () => {
      // Arrange
      const invalidData = {
        accountType: 'invalid',
        idType: 'NIN_SLIP'
      };

      generateSmileIdTokenValidator.validateGenerateSmileIdTokenData.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      // Act & Assert
      await expect(generateSmileIdTokenService.generateSmileIdToken(invalidData, 'sellerId'))
        .rejects.toThrow('Validation failed');
    });

    it('should throw error when seller not found', async () => {
      // Arrange
      const validObjectId = new mongoose.Types.ObjectId().toString();
      
      // Act & Assert
      await expect(generateSmileIdTokenService.generateSmileIdToken(validTokenData, validObjectId))
        .rejects.toThrow('Seller not found');
    });

    it('should throw error when SmileID API returns invalid response', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const mockConnection = {
        get_web_token: jest.fn().mockResolvedValue({}) // Empty response
      };
      SIDCore.WebApi = jest.fn().mockImplementation(() => mockConnection);

      // Act & Assert
      await expect(generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString()))
        .rejects.toThrow('Invalid token response from SmileID');
    });

    it('should throw error when SmileID API returns null response', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const mockConnection = {
        get_web_token: jest.fn().mockResolvedValue(null)
      };
      SIDCore.WebApi = jest.fn().mockImplementation(() => mockConnection);

      // Act & Assert
      await expect(generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString()))
        .rejects.toThrow('Invalid token response from SmileID');
    });

    it('should include seller information in partner parameters', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const mockConnection = {
        get_web_token: jest.fn().mockResolvedValue(mockSmileIdResponse)
      };
      SIDCore.WebApi = jest.fn().mockImplementation(() => mockConnection);

      // Act
      await generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString());

      // Assert
      expect(mockConnection.get_web_token).toHaveBeenCalledWith(
        expect.objectContaining({
          partner_params: expect.objectContaining({
            seller_id: seller._id.toString(),
            account_type: 'individual',
            id_type: 'NIN_SLIP',
            seller_email: 'john.doe@example.com',
            seller_name: 'John Doe'
          })
        })
      );
    });

    it('should configure SmileID connection with correct parameters', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const mockConnection = {
        get_web_token: jest.fn().mockResolvedValue(mockSmileIdResponse)
      };
      SIDCore.WebApi = jest.fn().mockImplementation(() => mockConnection);

      // Act
      await generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString());

      // Assert
      expect(SIDCore.WebApi).toHaveBeenCalledWith(
        process.env.SMILEID_PARTNER_ID,
        `${process.env.BACKEND_URL}/api/seller/verification/smileid/callback`,
        process.env.SMILEID_API_KEY,
        expect.any(Number)
      );
    });

    it('should handle SmileID API errors', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      const mockConnection = {
        get_web_token: jest.fn().mockRejectedValue(new Error('SmileID API Error'))
      };
      SIDCore.WebApi = jest.fn().mockImplementation(() => mockConnection);

      // Act & Assert
      await expect(generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString()))
        .rejects.toThrow('SmileID API Error');
    });

    it('should throw error when SmileID environment variables are missing', async () => {
      // Arrange
      const seller = new Seller({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        storeName: 'John Store'
      });
      await seller.save();

      // Mock environment variables to be undefined
      const originalEnv = {
        SMILEID_PARTNER_ID: process.env.SMILEID_PARTNER_ID,
        SMILEID_API_KEY: process.env.SMILEID_API_KEY,
        BACKEND_URL: process.env.BACKEND_URL
      };

      delete process.env.SMILEID_PARTNER_ID;
      delete process.env.SMILEID_API_KEY;
      delete process.env.BACKEND_URL;

      // Act & Assert
      await expect(generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString()))
        .rejects.toThrow(ValidationError);
      
      const error = await generateSmileIdTokenService.generateSmileIdToken(validTokenData, seller._id.toString()).catch(e => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'environment', message: 'Missing required environment variables: SMILEID_PARTNER_ID, SMILEID_API_KEY, BACKEND_URL' }
      ]);

      // Restore environment variables
      process.env.SMILEID_PARTNER_ID = originalEnv.SMILEID_PARTNER_ID;
      process.env.SMILEID_API_KEY = originalEnv.SMILEID_API_KEY;
      process.env.BACKEND_URL = originalEnv.BACKEND_URL;
    });
  });
});
