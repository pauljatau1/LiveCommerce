const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AWS = require('aws-sdk');

// Import the service
const uploadIdentityDocumentService = require('@modules/buyer/services/uploadIdentityDocument.service');

// Import the Buyer and Product models
const Buyer = require('@models/Buyer');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock the validator
jest.mock('@modules/buyer/validators/uploadIdentityDocument.validator', () => ({
  validateUploadIdentityDocumentData: jest.fn()
}));

// Mock AWS S3
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    upload: jest.fn().mockImplementation((params) => ({
      promise: jest.fn().mockResolvedValue({
        Key: params.Key
      })
    }))
  }))
}));

// Import the mocked modules
const uploadIdentityDocumentValidator = require('@modules/buyer/validators/uploadIdentityDocument.validator');

let mongoServer;

describe('Upload Identity Document Service', () => {
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
    await Seller.deleteMany({});
  });

  describe('uploadIdentityDocument', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();

    it('should successfully upload identity document', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      await buyer.save();

      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      const result = await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      expect(uploadIdentityDocumentValidator.validateUploadIdentityDocumentData).toHaveBeenCalledWith({
        buyerId: mockBuyerId.toString(),
        file: mockFile
      });

      expect(result).toHaveProperty('document');
      expect(result.document).toHaveProperty('url');
      expect(result.document).toHaveProperty('public_id');
      expect(result.document).toHaveProperty('uploadedAt');
      expect(result.document).toHaveProperty('status');
      expect(result.document.status).toBe('pending');
      expect(result.document.url).toContain('https://');
      expect(result.document.url).toContain(process.env.CDN_URL);
    });

    it('should handle buyer with existing identity document', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        identityDocument: {
          url: 'https://old-document.com/old.pdf',
          public_id: 'old-document-key',
          uploadedAt: new Date(),
          status: 'pending'
        }
      });

      await buyer.save();

      const mockFile = {
        originalname: 'new-document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('new file content'),
        size: 2048
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      const result = await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      expect(result.document.url).not.toBe('https://old-document.com/old.pdf');
      expect(result.document.public_id).not.toBe('old-document-key');
      expect(result.document.status).toBe('pending');
    });

    it('should reset verification status when uploading new document', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678',
        isIdentityVerified: true
      });

      await buyer.save();

      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      const updatedBuyer = await Buyer.findById(mockBuyerId);
      expect(updatedBuyer.isIdentityVerified).toBe(false);
    });

    it('should handle different file types', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      await buyer.save();

      const mockFile = {
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image content'),
        size: 512
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      const result = await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      expect(result.document).toHaveProperty('url');
      expect(result.document.url).toContain('image.jpg');
    });

    it('should generate unique file key with timestamp', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      await buyer.save();

      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      const result = await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      expect(result.document.public_id).toContain('verification/buyers/');
      expect(result.document.public_id).toContain('identity-');
      expect(result.document.public_id).toContain('-document.pdf');
    });

    it('should handle buyer without existing identity document', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      await buyer.save();

      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      const result = await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      expect(result.document).toHaveProperty('url');
      expect(result.document).toHaveProperty('public_id');
      expect(result.document).toHaveProperty('uploadedAt');
      expect(result.document).toHaveProperty('status');
    });

    it('should include all required document properties', async () => {
      // Arrange
      const buyer = new Buyer({
        _id: mockBuyerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'hashedpassword',
        phoneNumber: '+2348012345678'
      });

      await buyer.save();

      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      };

      uploadIdentityDocumentValidator.validateUploadIdentityDocumentData.mockResolvedValue();

      // Act
      const result = await uploadIdentityDocumentService.uploadIdentityDocument(
        mockBuyerId.toString(),
        mockFile
      );

      // Assert
      expect(result.document.url).toBeDefined();
      expect(result.document.public_id).toBeDefined();
      expect(result.document.uploadedAt).toBeInstanceOf(Date);
      expect(result.document.status).toBe('pending');
    });
  });
}); 