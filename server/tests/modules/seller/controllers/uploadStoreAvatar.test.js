/**
 * Upload Store Avatar Controller Tests
 *
 * This test suite validates the uploadStoreAvatar controller functionality.
 * It ensures that the controller properly handles HTTP requests and responses,
 * delegates to the service layer, and handles errors correctly.
 *
 * Test Coverage:
 * - Successful store avatar upload
 * - Error handling for service failures
 * - Request/response handling
 * - HTTP status codes
 * - Response structure validation
 * - Authentication token handling
 * - File upload validation
 * - Multipart form data handling
 *
 * @module uploadStoreAvatarControllerTests
 */

const request = require('supertest');
const express = require('express');
const multer = require('multer');
const { uploadStoreAvatar } = require('@modules/seller/controllers/seller.controller');
const uploadStoreAvatarService = require('@modules/seller/services/uploadStoreAvatar.service');

// Mock the service
jest.mock('@modules/seller/services/uploadStoreAvatar.service');

describe('Upload Store Avatar Controller', () => {
  let app;
  let validFileData;

  beforeEach(() => {
    // Create Express app for testing
    app = express();

    // Setup multer for file upload testing
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    // Add response formatter middleware
    app.use((req, res, next) => {
      res.success = (data, message = 'Success') => {
        res.status(200).json({
          success: true,
          message,
          data,
          pagination: null
        });
      };
      next();
    });

    // Add middleware to set req.user from header
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Mock user ID from token
        req.user = { id: '507f1f77bcf86cd799439011' };
      }
      next();
    });

    // Add the controller route with multer middleware
    app.post('/profile/avatar', upload.single('avatar'), uploadStoreAvatar);

    // Add error handling middleware
    app.use((err, req, res, next) => {
      if (err.name === 'ValidationError') {
        res.status(422).json({
          success: false,
          message: err.message,
          errors: err.errors,
          data: null,
          pagination: null
        });
      } else if (err.type === 'entity.parse.failed') {
        res.status(400).json({
          success: false,
          message: 'Invalid JSON',
          errors: null,
          data: null,
          pagination: null
        });
      } else {
        res.status(500).json({
          success: false,
          message: err.message || 'Internal server error',
          errors: null,
          data: null,
          pagination: null
        });
      }
    });

    // Valid file data for testing
    validFileData = {
      buffer: Buffer.from('fake-image-data'),
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      size: 1024000
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /profile/avatar', () => {
    it('should successfully upload store avatar', async () => {
      // Arrange: Setup service mock
      const mockResponse = {
        message: 'Store avatar uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          storeAvatar: {
            url: 'https://cdn.example.com/uuid-avatar.jpg',
            public_id: 'uuid-avatar.jpg'
          }
        }
      };

      uploadStoreAvatarService.uploadStoreAvatar.mockResolvedValue(mockResponse);

      // Act: Make request with file upload
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store avatar uploaded successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(uploadStoreAvatarService.uploadStoreAvatar).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          buffer: validFileData.buffer,
          originalname: validFileData.originalname,
          mimetype: validFileData.mimetype
        })
      );
    });

    it('should handle different image formats', async () => {
      // Arrange: Setup service mock
      const mockResponse = {
        message: 'Store avatar uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          storeAvatar: {
            url: 'https://cdn.example.com/uuid-avatar.png',
            public_id: 'uuid-avatar.png'
          }
        }
      };

      uploadStoreAvatarService.uploadStoreAvatar.mockResolvedValue(mockResponse);

      const pngFileData = {
        buffer: Buffer.from('fake-png-data'),
        originalname: 'avatar.png',
        mimetype: 'image/png',
        size: 2048000
      };

      // Act: Make request with PNG file
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', pngFileData.buffer, {
          filename: pngFileData.originalname,
          contentType: pngFileData.mimetype
        });

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store avatar uploaded successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with PNG file data
      expect(uploadStoreAvatarService.uploadStoreAvatar).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          mimetype: 'image/png',
          originalname: 'avatar.png'
        })
      );
    });

    it('should handle validation errors', async () => {
      // Arrange: Setup service mock to throw validation error
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'file.mimetype', message: 'File must be a valid image format' }
      ];

      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(validationError);

      // Act: Make request with invalid file
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', Buffer.from('fake-text-data'), {
          filename: 'document.txt',
          contentType: 'text/plain'
        });

      // Assert: Verify error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'file.mimetype', message: 'File must be a valid image format' }
        ],
        data: null,
        pagination: null
      });
    });

    it('should handle seller not found error', async () => {
      // Arrange: Setup service mock to throw seller not found error
      const notFoundError = new Error('Seller not found');
      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(notFoundError);

      // Act: Make request
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle S3 upload errors', async () => {
      // Arrange: Setup service mock to throw S3 upload error
      const s3Error = new Error('S3 upload failed');
      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(s3Error);

      // Act: Make request
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'S3 upload failed',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle database errors', async () => {
      // Arrange: Setup service mock to throw database error
      const databaseError = new Error('Database connection failed');
      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(databaseError);

      // Act: Make request
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle missing authorization token', async () => {
      // Act: Make request without authorization header
      const response = await request(app)
        .post('/profile/avatar')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response (req.user.id will be undefined)
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid authorization token format', async () => {
      // Act: Make request with invalid authorization header format
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'InvalidFormat')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response (req.user.id will be undefined)
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing file upload', async () => {
      // Arrange: Setup service mock to throw validation error for missing file
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = [
        { field: 'avatar', message: 'Avatar file is required' }
      ];

      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(validationError);

      // Act: Make request without file
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token');

      // Assert: Verify error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'avatar', message: 'Avatar file is required' }
        ],
        data: null,
        pagination: null
      });
    });

    it('should handle service throwing unexpected error', async () => {
      // Arrange: Setup service mock to throw unexpected error
      const unexpectedError = new Error('Unexpected error occurred');
      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(unexpectedError);

      // Act: Make request
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Unexpected error occurred',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle service throwing error without message', async () => {
      // Arrange: Setup service mock to throw error without message
      const errorWithoutMessage = new Error();
      uploadStoreAvatarService.uploadStoreAvatar.mockRejectedValue(errorWithoutMessage);

      // Act: Make request
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle large file uploads', async () => {
      // Arrange: Setup service mock
      const mockResponse = {
        message: 'Store avatar uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          storeAvatar: {
            url: 'https://cdn.example.com/uuid-large-avatar.jpg',
            public_id: 'uuid-large-avatar.jpg'
          }
        }
      };

      uploadStoreAvatarService.uploadStoreAvatar.mockResolvedValue(mockResponse);

      const largeFileData = {
        buffer: Buffer.alloc(5 * 1024 * 1024), // 5MB
        originalname: 'large-avatar.jpg',
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024
      };

      // Act: Make request with large file
      const response = await request(app)
        .post('/profile/avatar')
        .set('Authorization', 'Bearer valid-token')
        .attach('avatar', largeFileData.buffer, {
          filename: largeFileData.originalname,
          contentType: largeFileData.mimetype
        });

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store avatar uploaded successfully',
        data: mockResponse,
        pagination: null
      });

      // Verify service was called with large file data
      expect(uploadStoreAvatarService.uploadStoreAvatar).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          size: 5 * 1024 * 1024
        })
      );
    });
  });
});
