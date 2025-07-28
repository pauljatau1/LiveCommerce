const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the validator
const uploadIdentityDocumentValidator = require('@modules/buyer/validators/uploadIdentityDocument.validator');

// Import the Buyer and Product models
const Buyer = require('@modules/buyer/models/buyer.model');
const Product = require('@models/Product');
const Seller = require('@models/Seller');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository', () => ({
  findById: jest.fn()
}));

// Import the mocked repository
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

let mongoServer;

describe('Upload Identity Document Validator', () => {
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

  describe('validateUploadIdentityDocumentData', () => {
    const mockBuyerId = new mongoose.Types.ObjectId();

    it('should pass validation with valid buyer ID and file', async () => {
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
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).resolves.not.toThrow();
    });

    it('should throw validation error for missing buyer ID', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          null,
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for missing file', async () => {
      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          null
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid buyer ID format', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          'invalid-buyer-id',
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error when buyer does not exist', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for file without buffer', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for file without originalname', async () => {
      // Arrange
      const mockFile = {
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for file without mimetype', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for invalid file type', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.exe',
        mimetype: 'application/x-executable',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for file too large', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 15 * 1024 * 1024 // 15MB
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should accept valid PDF file', async () => {
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
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).resolves.not.toThrow();
    });

    it('should accept valid JPEG file', async () => {
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
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).resolves.not.toThrow();
    });

    it('should accept valid PNG file', async () => {
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
        originalname: 'image.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).resolves.not.toThrow();
    });

    it('should accept valid DOC file', async () => {
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
        originalname: 'document.doc',
        mimetype: 'application/msword',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).resolves.not.toThrow();
    });

    it('should accept valid DOCX file', async () => {
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
        originalname: 'document.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      buyerRepository.findById.mockResolvedValue(buyer);

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          mockBuyerId.toString(),
          mockFile
        )
      ).resolves.not.toThrow();
    });

    it('should throw validation error for empty buyer ID string', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          '',
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for undefined buyer ID', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          undefined,
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });

    it('should throw validation error for whitespace buyer ID', async () => {
      // Arrange
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      // Act & Assert
      await expect(
        uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
          '   ',
          mockFile
        )
      ).rejects.toThrow('Validation failed');
    });
  });
}); 