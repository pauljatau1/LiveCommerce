const jwt = require('jsonwebtoken');
const UnauthorizedException = require('@utils/errors/UnauthorizedException');

// Import the service
const checkTokenService = require('@modules/buyer/services/checkToken.service');

// Mock jwt
jest.mock('jsonwebtoken');

describe('CheckToken Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkToken function', () => {
    it('should validate token and return new token when valid', async () => {
      // Mock data
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockToken = 'valid.jwt.token';
      const mockNewToken = 'new.jwt.token';

      // Mock jwt.verify to return decoded user data
      jwt.verify.mockReturnValue({ id: mockUserId, role: 'Buyer' });
      
      // Mock jwt.sign to return new token
      jwt.sign.mockReturnValue(mockNewToken);

      const result = await checkTokenService.checkToken(mockToken);

      // Verify jwt.verify was called with correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      
      // Verify jwt.sign was called with correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId, role: 'Buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '500w' }
      );

      // Verify result structure
      expect(result).toEqual({
        message: 'Token is valid',
        token: mockNewToken
      });
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      await expect(checkTokenService.checkToken(null))
        .rejects
        .toThrow(UnauthorizedException);

      await expect(checkTokenService.checkToken(undefined))
        .rejects
        .toThrow(UnauthorizedException);

      await expect(checkTokenService.checkToken(''))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const mockToken = 'expired.jwt.token';
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';

      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await expect(checkTokenService.checkToken(mockToken))
        .rejects
        .toThrow(UnauthorizedException);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockToken = 'invalid.jwt.token';
      const invalidError = new Error('invalid signature');

      jwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      await expect(checkTokenService.checkToken(mockToken))
        .rejects
        .toThrow(UnauthorizedException);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should throw UnauthorizedException for other JWT errors', async () => {
      const mockToken = 'malformed.jwt.token';
      const malformedError = new Error('jwt malformed');

      jwt.verify.mockImplementation(() => {
        throw malformedError;
      });

      await expect(checkTokenService.checkToken(mockToken))
        .rejects
        .toThrow(UnauthorizedException);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should handle different user IDs correctly', async () => {
      const testCases = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013'
      ];

      for (const userId of testCases) {
        jwt.verify.mockReturnValue({ id: userId, role: 'Buyer' });
        jwt.sign.mockReturnValue('new.token');

        const result = await checkTokenService.checkToken('valid.token');

        expect(jwt.verify).toHaveBeenCalledWith('valid.token', process.env.JWT_SECRET);
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: userId, role: 'Buyer' },
          process.env.JWT_SECRET,
          { expiresIn: '500w' }
        );
        expect(result.token).toBe('new.token');
      }
    });

    it('should preserve user role in new token', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockToken = 'valid.jwt.token';
      const mockNewToken = 'new.jwt.token';

      jwt.verify.mockReturnValue({ id: mockUserId, role: 'Buyer' });
      jwt.sign.mockReturnValue(mockNewToken);

      await checkTokenService.checkToken(mockToken);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId, role: 'Buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '500w' }
      );
    });
  });

  describe('Error handling', () => {
    it('should handle TokenExpiredError specifically', async () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';

      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      try {
        await checkTokenService.checkToken('expired.token');
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Token has expired. Please sign in again.');
      }
    });

    it('should handle generic JWT errors', async () => {
      const genericError = new Error('jwt generic error');

      jwt.verify.mockImplementation(() => {
        throw genericError;
      });

      try {
        await checkTokenService.checkToken('invalid.token');
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid Token');
      }
    });

    it('should handle missing token with appropriate message', async () => {
      try {
        await checkTokenService.checkToken(null);
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('A token is required for authentication');
      }
    });
  });

  describe('Token generation', () => {
    it('should generate token with correct parameters', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockNewToken = 'new.jwt.token';

      jwt.verify.mockReturnValue({ id: mockUserId, role: 'Buyer' });
      jwt.sign.mockReturnValue(mockNewToken);

      await checkTokenService.checkToken('valid.token');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId, role: 'Buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '500w' }
      );
    });

    it('should use environment JWT_SECRET', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';

      jwt.verify.mockReturnValue({ id: mockUserId, role: 'Buyer' });
      jwt.sign.mockReturnValue('new.token');

      await checkTokenService.checkToken('valid.token');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        process.env.JWT_SECRET,
        expect.any(Object)
      );
    });
  });
}); 