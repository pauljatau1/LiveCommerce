const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the service
const checkTokenService = require('@modules/seller/services/checkToken.service');
const UnauthorizedException = require('@utils/errors/UnauthorizedException');

// Mock dependencies
jest.mock('@utils/helpers');

let mongoServer;

describe('Check Token Service', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3' // Use a version compatible with Debian 12
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('checkToken function', () => {
    it('should successfully validate a valid token and return new token', async () => {
      // Mock data
      const mockToken = 'valid.jwt.token';
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockNewToken = 'new.jwt.token';

      // Mock jwt.verify to return valid user data
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: mockUserId });

      // Mock generateToken helper
      const { generateToken } = require('@utils/helpers');
      generateToken.mockReturnValue(mockNewToken);

      // Call the service
      const result = checkTokenService.checkToken(mockToken);

      // Verify the result
      expect(result).toEqual({
        token: mockNewToken
      });

      // Verify jwt.verify was called with correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);

      // Verify generateToken was called with correct parameters
      expect(generateToken).toHaveBeenCalledWith(mockUserId, 'Seller', '2w');
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      // Call the service without token
      expect(() => checkTokenService.checkToken()).toThrow(UnauthorizedException);
      expect(() => checkTokenService.checkToken()).toThrow('A token is required for authentication');
    });

    it('should throw UnauthorizedException when token is null', () => {
      // Call the service with null token
      expect(() => checkTokenService.checkToken(null)).toThrow(UnauthorizedException);
      expect(() => checkTokenService.checkToken(null)).toThrow('A token is required for authentication');
    });

    it('should throw UnauthorizedException when token is empty string', () => {
      // Call the service with empty string token
      expect(() => checkTokenService.checkToken('')).toThrow(UnauthorizedException);
      expect(() => checkTokenService.checkToken('')).toThrow('A token is required for authentication');
    });

    it('should throw UnauthorizedException when token is undefined', () => {
      // Call the service with undefined token
      expect(() => checkTokenService.checkToken(undefined)).toThrow(UnauthorizedException);
      expect(() => checkTokenService.checkToken(undefined)).toThrow('A token is required for authentication');
    });

    it('should throw TokenExpiredError when token has expired', () => {
      // Mock data
      const mockToken = 'expired.jwt.token';
      const mockError = new Error('Token has expired');
      mockError.name = 'TokenExpiredError';

      // Mock jwt.verify to throw TokenExpiredError
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw mockError;
      });

      // Call the service
      expect(() => checkTokenService.checkToken(mockToken)).toThrow('Token has expired');
      expect(() => checkTokenService.checkToken(mockToken)).toThrow(Error);

      // Verify jwt.verify was called
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should throw generic error when token is invalid', () => {
      // Mock data
      const mockToken = 'invalid.jwt.token';
      const mockError = new Error('Invalid token');

      // Mock jwt.verify to throw generic error
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw mockError;
      });

      // Call the service
      expect(() => checkTokenService.checkToken(mockToken)).toThrow('Invalid token');
      expect(() => checkTokenService.checkToken(mockToken)).toThrow(Error);

      // Verify jwt.verify was called
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should throw JsonWebTokenError when JWT verification fails with other error types', () => {
      // Mock data
      const mockToken = 'malformed.jwt.token';
      const mockError = new Error('Malformed token');
      mockError.name = 'JsonWebTokenError';

      // Mock jwt.verify to throw JsonWebTokenError
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw mockError;
      });

      // Call the service
      expect(() => checkTokenService.checkToken(mockToken)).toThrow('Malformed token');
      expect(() => checkTokenService.checkToken(mockToken)).toThrow(Error);

      // Verify jwt.verify was called
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should handle JWT verification errors gracefully', () => {
      // Mock data
      const mockToken = 'error.jwt.token';
      const mockError = new Error('JWT secret not provided');

      // Mock jwt.verify to throw error
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw mockError;
      });

      // Call the service
      expect(() => checkTokenService.checkToken(mockToken)).toThrow('JWT secret not provided');
      expect(() => checkTokenService.checkToken(mockToken)).toThrow(Error);

      // Verify jwt.verify was called
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should generate new token with correct parameters when token is valid', () => {
      // Mock data
      const mockToken = 'valid.jwt.token';
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockNewToken = 'new.jwt.token';

      // Mock jwt.verify to return valid user data
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: mockUserId });

      // Mock generateToken helper
      const { generateToken } = require('@utils/helpers');
      generateToken.mockReturnValue(mockNewToken);

      // Call the service
      const result = checkTokenService.checkToken(mockToken);

      // Verify generateToken was called with correct parameters
      expect(generateToken).toHaveBeenCalledWith(mockUserId, 'Seller', '2w');

      // Verify the result contains the new token
      expect(result.token).toBe(mockNewToken);
    });

    it('should return correct token structure when token is valid', () => {
      // Mock data
      const mockToken = 'valid.jwt.token';
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockNewToken = 'new.jwt.token';

      // Mock jwt.verify to return valid user data
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: mockUserId });

      // Mock generateToken helper
      const { generateToken } = require('@utils/helpers');
      generateToken.mockReturnValue(mockNewToken);

      // Call the service
      const result = checkTokenService.checkToken(mockToken);

      // Verify the result structure
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.token).toBe(mockNewToken);
    });

    it('should handle different user ID formats correctly', () => {
      // Mock data with different user ID formats
      const mockToken = 'valid.jwt.token';
      const mockUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
      const mockNewToken = 'new.jwt.token';

      // Mock jwt.verify to return valid user data
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: mockUserId });

      // Mock generateToken helper
      const { generateToken } = require('@utils/helpers');
      generateToken.mockReturnValue(mockNewToken);

      // Call the service
      const result = checkTokenService.checkToken(mockToken);

      // Verify generateToken was called with the correct user ID
      expect(generateToken).toHaveBeenCalledWith(mockUserId, 'Seller', '2w');

      // Verify the result
      expect(result.token).toBe(mockNewToken);
    });
  });
});
