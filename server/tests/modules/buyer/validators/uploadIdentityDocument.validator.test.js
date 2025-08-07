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
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer ID is required'
          }
        ]
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing buyer ID', async () => {
        const mockFile = {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test content'),
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            null,
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer ID is required'
            }
          ]
        });
      });

      it('should include specific error message for invalid buyer ID format', async () => {
        const mockFile = {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test content'),
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            'invalid-id',
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Invalid buyer ID format'
            }
          ]
        });
      });

      it('should include specific error message for missing file', async () => {
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
        buyerRepository.findById.mockResolvedValue(buyer);

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            null
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'file',
              message: 'No identity document uploaded'
            }
          ]
        });
      });

      it('should include specific error message for file without buffer', async () => {
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
        buyerRepository.findById.mockResolvedValue(buyer);

        const mockFile = {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'file',
              message: 'Invalid file format'
            }
          ]
        });
      });

      it('should include specific error message for file without originalname', async () => {
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
        buyerRepository.findById.mockResolvedValue(buyer);

        const mockFile = {
          mimetype: 'application/pdf',
          buffer: Buffer.from('test content'),
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'file',
              message: 'File name is required'
            }
          ]
        });
      });

      it('should include specific error message for file without mimetype', async () => {
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
        buyerRepository.findById.mockResolvedValue(buyer);

        const mockFile = {
          originalname: 'document.pdf',
          buffer: Buffer.from('test content'),
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'file',
              message: 'File type is required'
            }
          ]
        });
      });

      it('should include specific error message for invalid file type', async () => {
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
        buyerRepository.findById.mockResolvedValue(buyer);

        const mockFile = {
          originalname: 'document.txt',
          mimetype: 'text/plain',
          buffer: Buffer.from('test content'),
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'file',
              message: 'Invalid file type. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX'
            }
          ]
        });
      });

      it('should include specific error message for file too large', async () => {
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
        buyerRepository.findById.mockResolvedValue(buyer);

        const mockFile = {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test content'),
          size: 15 * 1024 * 1024 // 15MB
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'file',
              message: 'File size too large. Maximum size is 10MB'
            }
          ]
        });
      });

      it('should include specific error message for buyer not found', async () => {
        buyerRepository.findById.mockResolvedValue(null);

        const mockFile = {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test content'),
          size: 1024
        };

        await expect(
          uploadIdentityDocumentValidator.validateUploadIdentityDocumentData(
            mockBuyerId.toString(),
            mockFile
          )
        ).rejects.toMatchObject({
          errors: [
            {
              field: 'buyerId',
              message: 'Buyer not found'
            }
          ]
        });
      });
    });
  });
}); 