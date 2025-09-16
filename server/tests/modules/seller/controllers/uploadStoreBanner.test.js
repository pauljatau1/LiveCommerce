const request = require('supertest');
const express = require('express');
const multer = require('multer');
const { uploadStoreBanner } = require('@modules/seller/controllers/seller.controller');
const uploadStoreBannerService = require('@modules/seller/services/uploadStoreBanner.service');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the service
jest.mock('@modules/seller/services/uploadStoreBanner.service');

describe('Upload Store Banner Controller', () => {
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
    app.post('/profile/banner', upload.single('banner'), uploadStoreBanner);

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
      } else if (err instanceof NotFoundException) {
        res.status(404).json({
          success: false,
          message: err.message,
          errors: null,
          data: null,
          pagination: null
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: null,
          data: null,
          pagination: null
        });
      }
    });

    // Setup valid file data for testing
    validFileData = {
      buffer: Buffer.from('fake-banner-data'),
      originalname: 'banner.jpg',
      mimetype: 'image/jpeg',
      size: 1024000
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /profile/banner', () => {
    const mockServiceResponse = {
      message: 'Store banner uploaded successfully',
      seller: {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Seller',
        phoneNumber: '+1234567890',
        businessName: 'Test Business',
        businessType: 'retail',
        accountType: 'business',
        isVerified: true,
        storeName: 'Test Store',
        aboutStore: 'A test store',
        storeAvatar: {
          url: 'https://cdn.example.com/avatar.jpg',
          public_id: 'avatar.jpg'
        },
        storeBanner: {
          url: 'https://cdn.example.com/uuid-banner.jpg',
          public_id: 'uuid-banner.jpg'
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }
    };

    it('should successfully upload store banner', async () => {
      // Arrange: Mock service response
      uploadStoreBannerService.uploadStoreBanner.mockResolvedValue(mockServiceResponse);

      // Act: Make request with file upload
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
        .attach('banner', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store banner uploaded successfully',
        data: expect.objectContaining({
          message: 'Store banner uploaded successfully',
          seller: expect.objectContaining({
            _id: '507f1f77bcf86cd799439011',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'Seller',
            storeBanner: expect.objectContaining({
              url: expect.stringContaining('uuid-banner.jpg'),
              public_id: expect.stringContaining('uuid-banner.jpg')
            })
          })
        }),
        pagination: null
      });

      // Verify service was called with correct parameters
      expect(uploadStoreBannerService.uploadStoreBanner).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          buffer: expect.any(Buffer),
          originalname: validFileData.originalname,
          mimetype: validFileData.mimetype,
          size: expect.any(Number)
        })
      );
    });

    it('should handle validation errors', async () => {
      // Arrange: Mock service to throw ValidationError
      const validationErrors = [
        { field: 'file.buffer', message: 'File buffer must be a valid Buffer object' },
        { field: 'file.mimetype', message: 'File must be a valid image format (JPEG, PNG, GIF, WebP)' }
      ];
      uploadStoreBannerService.uploadStoreBanner.mockRejectedValue(new ValidationError(validationErrors));

      // Act: Make request with invalid file
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
        .attach('banner', Buffer.from('invalid-data'), {
          filename: 'banner.txt',
          contentType: 'text/plain'
        });

      // Assert: Verify error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        data: null,
        pagination: null
      });
    });

    it('should handle seller not found error', async () => {
      // Arrange: Mock service to throw NotFoundException
      uploadStoreBannerService.uploadStoreBanner.mockRejectedValue(new NotFoundException('Seller not found'));

      // Act: Make request
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
        .attach('banner', validFileData.buffer, {
          filename: validFileData.originalname,
          contentType: validFileData.mimetype
        });

      // Assert: Verify error response
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Seller not found',
        errors: null,
        data: null,
        pagination: null
      });
    });

    it('should handle internal server errors', async () => {
      // Arrange: Mock service to throw generic error
      uploadStoreBannerService.uploadStoreBanner.mockRejectedValue(new Error('Database connection failed'));

      // Act: Make request
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
        .attach('banner', validFileData.buffer, {
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

    it('should handle missing file', async () => {
      // Arrange: Mock service to throw ValidationError for missing file
      uploadStoreBannerService.uploadStoreBanner.mockRejectedValue(
        new ValidationError([{ field: 'banner', message: 'Banner file is required' }])
      );

      // Act: Make request without file
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token');

      // Assert: Verify error response
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'banner', message: 'Banner file is required' }],
        data: null,
        pagination: null
      });
    });

    it('should handle different file types', async () => {
      // Arrange: Test with PNG file
      const pngFile = {
        buffer: Buffer.from('fake-png-data'),
        originalname: 'banner.png',
        mimetype: 'image/png',
        size: 2048000
      };

      const pngServiceResponse = {
        message: 'Store banner uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          phoneNumber: '+1234567890',
          businessName: 'Test Business',
          businessType: 'retail',
          accountType: 'business',
          isVerified: true,
          storeName: 'Test Store',
          aboutStore: 'A test store',
          storeAvatar: {
            url: 'https://cdn.example.com/avatar.jpg',
            public_id: 'avatar.jpg'
          },
          storeBanner: {
            url: 'https://cdn.example.com/uuid-banner.png',
            public_id: 'uuid-banner.png'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      uploadStoreBannerService.uploadStoreBanner.mockResolvedValue(pngServiceResponse);

      // Act: Make request with PNG file
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
;

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store banner uploaded successfully',
        data: expect.objectContaining({
          message: 'Store banner uploaded successfully',
          seller: expect.objectContaining({
            _id: '507f1f77bcf86cd799439011',
            storeBanner: expect.objectContaining({
              url: expect.stringContaining('uuid-banner.png'),
              public_id: expect.stringContaining('uuid-banner.png')
            })
          })
        }),
        pagination: null
      });
    });

    it('should handle large files', async () => {
      // Arrange: Test with large file (10MB)
      const largeFile = {
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
        originalname: 'large-banner.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024
      };

      const largeFileServiceResponse = {
        message: 'Store banner uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          phoneNumber: '+1234567890',
          businessName: 'Test Business',
          businessType: 'retail',
          accountType: 'business',
          isVerified: true,
          storeName: 'Test Store',
          aboutStore: 'A test store',
          storeAvatar: {
            url: 'https://cdn.example.com/avatar.jpg',
            public_id: 'avatar.jpg'
          },
          storeBanner: {
            url: 'https://cdn.example.com/uuid-large-banner.jpg',
            public_id: 'uuid-large-banner.jpg'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      uploadStoreBannerService.uploadStoreBanner.mockResolvedValue(largeFileServiceResponse);

      // Act: Make request with large file
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
;

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store banner uploaded successfully',
        data: expect.objectContaining({
          message: 'Store banner uploaded successfully',
          seller: expect.objectContaining({
            _id: '507f1f77bcf86cd799439011',
            storeBanner: expect.objectContaining({
              url: expect.stringContaining('uuid-large-banner.jpg'),
              public_id: expect.stringContaining('uuid-large-banner.jpg')
            })
          })
        }),
        pagination: null
      });
    });

    it('should handle special characters in filename', async () => {
      // Arrange: Test with special characters in filename
      const specialFile = {
        buffer: Buffer.from('fake-banner-data'),
        originalname: 'banner-with-special-chars_123.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const specialFileServiceResponse = {
        message: 'Store banner uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          phoneNumber: '+1234567890',
          businessName: 'Test Business',
          businessType: 'retail',
          accountType: 'business',
          isVerified: true,
          storeName: 'Test Store',
          aboutStore: 'A test store',
          storeAvatar: {
            url: 'https://cdn.example.com/avatar.jpg',
            public_id: 'avatar.jpg'
          },
          storeBanner: {
            url: 'https://cdn.example.com/uuid-banner-with-special-chars_123.jpg',
            public_id: 'uuid-banner-with-special-chars_123.jpg'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      uploadStoreBannerService.uploadStoreBanner.mockResolvedValue(specialFileServiceResponse);

      // Act: Make request with special filename
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
;

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store banner uploaded successfully',
        data: expect.objectContaining({
          message: 'Store banner uploaded successfully',
          seller: expect.objectContaining({
            _id: '507f1f77bcf86cd799439011',
            storeBanner: expect.objectContaining({
              url: expect.stringContaining('uuid-banner-with-special-chars_123.jpg'),
              public_id: expect.stringContaining('uuid-banner-with-special-chars_123.jpg')
            })
          })
        }),
        pagination: null
      });
    });

    it('should handle WebP files', async () => {
      // Arrange: Test with WebP file
      const webpFile = {
        buffer: Buffer.from('fake-webp-data'),
        originalname: 'banner.webp',
        mimetype: 'image/webp',
        size: 768000
      };

      const webpServiceResponse = {
        message: 'Store banner uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          phoneNumber: '+1234567890',
          businessName: 'Test Business',
          businessType: 'retail',
          accountType: 'business',
          isVerified: true,
          storeName: 'Test Store',
          aboutStore: 'A test store',
          storeAvatar: {
            url: 'https://cdn.example.com/avatar.jpg',
            public_id: 'avatar.jpg'
          },
          storeBanner: {
            url: 'https://cdn.example.com/uuid-banner.webp',
            public_id: 'uuid-banner.webp'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      uploadStoreBannerService.uploadStoreBanner.mockResolvedValue(webpServiceResponse);

      // Act: Make request with WebP file
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
;

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store banner uploaded successfully',
        data: expect.objectContaining({
          message: 'Store banner uploaded successfully',
          seller: expect.objectContaining({
            _id: '507f1f77bcf86cd799439011',
            storeBanner: expect.objectContaining({
              url: expect.stringContaining('uuid-banner.webp'),
              public_id: expect.stringContaining('uuid-banner.webp')
            })
          })
        }),
        pagination: null
      });
    });

    it('should handle GIF files', async () => {
      // Arrange: Test with GIF file
      const gifFile = {
        buffer: Buffer.from('fake-gif-data'),
        originalname: 'banner.gif',
        mimetype: 'image/gif',
        size: 512000
      };

      const gifServiceResponse = {
        message: 'Store banner uploaded successfully',
        seller: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Seller',
          phoneNumber: '+1234567890',
          businessName: 'Test Business',
          businessType: 'retail',
          accountType: 'business',
          isVerified: true,
          storeName: 'Test Store',
          aboutStore: 'A test store',
          storeAvatar: {
            url: 'https://cdn.example.com/avatar.jpg',
            public_id: 'avatar.jpg'
          },
          storeBanner: {
            url: 'https://cdn.example.com/uuid-banner.gif',
            public_id: 'uuid-banner.gif'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      uploadStoreBannerService.uploadStoreBanner.mockResolvedValue(gifServiceResponse);

      // Act: Make request with GIF file
      const response = await request(app)
        .post('/profile/banner')
        .set('Authorization', 'Bearer valid-token')
;

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Store banner uploaded successfully',
        data: expect.objectContaining({
          message: 'Store banner uploaded successfully',
          seller: expect.objectContaining({
            _id: '507f1f77bcf86cd799439011',
            storeBanner: expect.objectContaining({
              url: expect.stringContaining('uuid-banner.gif'),
              public_id: expect.stringContaining('uuid-banner.gif')
            })
          })
        }),
        pagination: null
      });
    });
  });
});
