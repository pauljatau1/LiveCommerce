const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const loginService = require('@modules/seller/services/login.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const { generateToken } = require('@utils/helpers');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');
const Seller = require('@models/Seller');

// Mock the helpers module
jest.mock('@utils/helpers');
jest.mock('@modules/seller/repositories/seller.repository');

describe('Login Service', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
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
    generateToken.mockReturnValue('mock-jwt-token');
  });

  const validLoginData = {
    email: 'seller@example.com',
    password: 'password123'
  };

  const mockSeller = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'seller@example.com',
    phoneNumber: '+2348012345678',
    storeName: "John's Store",
    agoraUid: 123456789,
    emailVerified: true,
    createdAt: new Date(),
    comparePassword: jest.fn()
  };

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      mockSeller.comparePassword.mockResolvedValue(true);

      // Act
      const result = await loginService.login(validLoginData);

      // Assert
      expect(result).toEqual({
        user: mockSeller,
        token: 'mock-jwt-token'
      });
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      expect(mockSeller.comparePassword).toHaveBeenCalledWith(validLoginData.password);
      expect(generateToken).toHaveBeenCalledWith(mockSeller._id, 'Seller', '2w', 0);
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const invalidData = {
        password: 'password123'
      };

      // Act & Assert
      await expect(loginService.login(invalidData)).rejects.toThrow(ValidationError);
      expect(sellerRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when password is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'seller@example.com'
      };

      // Act & Assert
      await expect(loginService.login(invalidData)).rejects.toThrow(ValidationError);
      expect(sellerRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when seller is not found', async () => {
      // Arrange
      sellerRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginService.login(validLoginData)).rejects.toThrow(NotFoundException);
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when password is incorrect', async () => {
      // Arrange
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      mockSeller.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(loginService.login(validLoginData)).rejects.toThrow(NotFoundException);
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      expect(mockSeller.comparePassword).toHaveBeenCalledWith(validLoginData.password);
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should throw original error when seller exists but comparePassword throws error', async () => {
      // Arrange
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      mockSeller.comparePassword.mockRejectedValue(new Error('Password comparison failed'));

      // Act & Assert
      await expect(loginService.login(validLoginData)).rejects.toThrow('Password comparison failed');
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      expect(mockSeller.comparePassword).toHaveBeenCalledWith(validLoginData.password);
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should handle database errors from findByEmail', async () => {
      // Arrange
      sellerRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(loginService.login(validLoginData)).rejects.toThrow('Database connection failed');
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should handle generateToken errors', async () => {
      // Arrange
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      mockSeller.comparePassword.mockResolvedValue(true);
      generateToken.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      // Act & Assert
      await expect(loginService.login(validLoginData)).rejects.toThrow('Token generation failed');
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      expect(mockSeller.comparePassword).toHaveBeenCalledWith(validLoginData.password);
      expect(generateToken).toHaveBeenCalledWith(mockSeller._id, 'Seller', '2w', 0);
    });

    it('should work with numeric password', async () => {
      // Arrange
      const loginDataWithNumericPassword = {
        email: 'seller@example.com',
        password: 123456
      };
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      mockSeller.comparePassword.mockResolvedValue(true);

      // Act
      const result = await loginService.login(loginDataWithNumericPassword);

      // Assert
      expect(result).toEqual({
        user: mockSeller,
        token: 'mock-jwt-token'
      });
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(loginDataWithNumericPassword.email);
      expect(mockSeller.comparePassword).toHaveBeenCalledWith(loginDataWithNumericPassword.password);
      expect(generateToken).toHaveBeenCalledWith(mockSeller._id, 'Seller', '2w', 0);
    });

    it('should handle case-insensitive email lookup', async () => {
      // Arrange
      const loginDataWithUppercaseEmail = {
        email: 'SELLER@EXAMPLE.COM',
        password: 'password123'
      };
      sellerRepository.findByEmail.mockResolvedValue(mockSeller);
      mockSeller.comparePassword.mockResolvedValue(true);

      // Act
      const result = await loginService.login(loginDataWithUppercaseEmail);

      // Assert
      expect(result).toEqual({
        user: mockSeller,
        token: 'mock-jwt-token'
      });
      expect(sellerRepository.findByEmail).toHaveBeenCalledWith(loginDataWithUppercaseEmail.email);
      expect(mockSeller.comparePassword).toHaveBeenCalledWith(loginDataWithUppercaseEmail.password);
    });

    it('should return correct user object structure', async () => {
      // Arrange
      const sellerWithAllFields = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'seller@example.com',
        phoneNumber: '+2348012345678',
        storeName: "John's Store",
        agoraUid: 123456789,
        emailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        comparePassword: jest.fn()
      };
      sellerRepository.findByEmail.mockResolvedValue(sellerWithAllFields);
      sellerWithAllFields.comparePassword.mockResolvedValue(true);

      // Act
      const result = await loginService.login(validLoginData);

      // Assert
      expect(result.user).toEqual(sellerWithAllFields);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user._id).toBe('507f1f77bcf86cd799439011');
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.user.email).toBe('seller@example.com');
      expect(result.user.phoneNumber).toBe('+2348012345678');
      expect(result.user.storeName).toBe("John's Store");
      expect(result.user.agoraUid).toBe(123456789);
      expect(result.user.emailVerified).toBe(true);
    });
  });
});
