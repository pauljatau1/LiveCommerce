const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer and Product models
const Buyer = require('@modules/buyer/models/buyer.model');
const Product = require('@models/Product');

// Mock the upload identity document service
jest.mock('@modules/buyer/services/uploadIdentityDocument.service', () => ({
  uploadIdentityDocument: jest.fn()
}));

// Import the mocked service
const uploadIdentityDocumentService = require('@modules/buyer/services/uploadIdentityDocument.service');

let mongoServer;

describe('Buyer Controller - Upload Identity Document', () => {
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
    await Product.deleteMany({});
  });

  describe('uploadIdentityDocument', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();

    it('should call upload identity document service and return success response', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      const mockReq = {
        user: { id: mockBuyerId.toString() },
        file: mockFile
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        document: {
          url: 'https://cdn.example.com/verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-document.pdf',
          public_id: 'verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-document.pdf',
          uploadedAt: new Date(),
          status: 'pending'
        }
      };

      uploadIdentityDocumentService.uploadIdentityDocument.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.uploadIdentityDocument(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadIdentityDocumentService.uploadIdentityDocument).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockFile
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Identity document uploaded successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next with error', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      const mockReq = {
        user: { id: mockBuyerId.toString() },
        file: mockFile
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockError = new Error('Service error');
      uploadIdentityDocumentService.uploadIdentityDocument.mockRejectedValue(mockError);

      // Act
      await buyerController.uploadIdentityDocument(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadIdentityDocumentService.uploadIdentityDocument).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockFile
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle missing buyer ID', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      const mockReq = {
        user: {},
        file: mockFile
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.uploadIdentityDocument(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadIdentityDocumentService.uploadIdentityDocument).toHaveBeenCalledWith(
        undefined,
        mockFile
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle missing file', async () => {
      // Arrange
      const mockReq = {
        user: { id: mockBuyerId.toString() },
        file: null
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      // Act
      await buyerController.uploadIdentityDocument(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadIdentityDocumentService.uploadIdentityDocument).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        null
      );
      expect(mockRes.success).not.toHaveBeenCalled();
    });

    it('should handle different file types', async () => {
      // Arrange
      const mockFile = {
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image content'),
        size: 2048
      };

      const mockReq = {
        user: { id: mockBuyerId.toString() },
        file: mockFile
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        document: {
          url: 'https://cdn.example.com/verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-image.jpg',
          public_id: 'verification/buyers/507f1f77bcf86cd799439011/identity-1640995200000-image.jpg',
          uploadedAt: new Date(),
          status: 'pending'
        }
      };

      uploadIdentityDocumentService.uploadIdentityDocument.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.uploadIdentityDocument(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadIdentityDocumentService.uploadIdentityDocument).toHaveBeenCalledWith(
        mockBuyerId.toString(),
        mockFile
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Identity document uploaded successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 