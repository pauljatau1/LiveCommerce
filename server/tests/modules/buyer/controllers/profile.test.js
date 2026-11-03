const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import the app without starting the server
const { app } = require('@/app');

// Import the controller directly for unit testing
const buyerController = require('@modules/buyer/controllers/buyer.controller');

// Import the Buyer model
const Buyer = require('@models/Buyer');

// Mock the profile services
jest.mock('@modules/buyer/services/profile.service', () => ({
  getProfile: jest.fn()
}));

jest.mock('@modules/buyer/services/updateProfile.service', () => ({
  updateProfile: jest.fn()
}));

jest.mock('@modules/buyer/services/uploadProfileImage.service', () => ({
  uploadProfileImage: jest.fn()
}));

// Import the mocked services
const profileService = require('@modules/buyer/services/profile.service');
const updateProfileService = require('@modules/buyer/services/updateProfile.service');
const uploadProfileImageService = require('@modules/buyer/services/uploadProfileImage.service');
const jwt = require('jsonwebtoken');

// Mock Firebase
jest.mock('@firebase', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn(),
}));

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

let mongoServer;

describe('Buyer Controller - Profile', () => {
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
    
    // Mock JWT verification to return a valid user
    jwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011', role: 'Buyer' });
    
    // Clear database
    await Buyer.deleteMany({});
  });

  describe('getProfile', () => {
    it('should call profile service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: '507f1f77bcf86cd799439011'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        followersCount: 5,
        followingCount: 3,
        postsCount: 10,
        profilePictureUrl: 'https://example.com/profile.jpg',
        bio: 'Test bio'
      };

      profileService.getProfile.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(profileService.getProfile).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockRes.success).toHaveBeenCalledWith(
        mockServiceResponse,
        'Profile retrieved successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        user: {
          id: '507f1f77bcf86cd799439011'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Buyer not found');

      profileService.getProfile.mockRejectedValue(mockError);

      // Act
      await buyerController.getProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(profileService.getProfile).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateProfile', () => {
    it('should call updateProfile service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Updated bio'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        message: 'Profile updated successfully',
        buyer: {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Updated bio'
        }
      };

      updateProfileService.updateProfile.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.updateProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockServiceResponse, 'Profile updated successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        body: {
          firstName: 'Jane'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Service error');

      updateProfileService.updateProfile.mockRejectedValue(mockError);

      // Act
      await buyerController.updateProfile(mockReq, mockRes, mockNext);

      // Assert
      expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.body
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('uploadProfileImage', () => {
    it('should call uploadProfileImage service and return success response', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        file: {
          buffer: Buffer.from('fake-image'),
          originalname: 'profile.jpg',
          mimetype: 'image/jpeg'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();

      const mockServiceResponse = {
        message: 'Profile image uploaded successfully',
        buyer: {
          profileImage: {
            url: 'https://example.com/profile.jpg'
          }
        }
      };

      uploadProfileImageService.uploadProfileImage.mockResolvedValue(mockServiceResponse);

      // Act
      await buyerController.uploadProfileImage(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadProfileImageService.uploadProfileImage).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.file
      );
      expect(mockRes.success).toHaveBeenCalledWith(mockServiceResponse, 'Profile image uploaded successfully');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockReq = {
        user: { id: '507f1f77bcf86cd799439011' },
        file: {
          buffer: Buffer.from('fake-image'),
          originalname: 'profile.jpg',
          mimetype: 'image/jpeg'
        }
      };

      const mockRes = {
        success: jest.fn()
      };

      const mockNext = jest.fn();
      const mockError = new Error('Upload failed');

      uploadProfileImageService.uploadProfileImage.mockRejectedValue(mockError);

      // Act
      await buyerController.uploadProfileImage(mockReq, mockRes, mockNext);

      // Assert
      expect(uploadProfileImageService.uploadProfileImage).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.file
      );
      expect(mockRes.success).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Integration Tests - Profile Endpoints', () => {
    describe('GET /api/v2/buyers/profile', () => {
      it('should get profile successfully via HTTP', async () => {
        const mockResponse = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          username: 'johndoe',
          followersCount: 5,
          followingCount: 3,
          postsCount: 10,
          profilePictureUrl: 'https://example.com/profile.jpg',
          bio: 'Test bio'
        };

        profileService.getProfile.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v2/buyers/profile')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(profileService.getProfile).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(response.body).toEqual({
          success: true,
          data: mockResponse,
          message: 'Profile retrieved successfully',
          pagination: null
        });
      });

      it('should return 500 for service error via HTTP', async () => {
        const mockError = new Error('Service error');
        profileService.getProfile.mockRejectedValue(mockError);

        await request(app)
          .get('/api/v2/buyers/profile')
          .set('Authorization', 'Bearer valid-token')
          .expect(500);
      });
    });

    describe('PUT /api/v2/buyers/profile', () => {
      it('should update profile successfully via HTTP', async () => {
        const mockResponse = {
          message: 'Profile updated successfully',
          buyer: {
            firstName: 'Jane',
            lastName: 'Smith',
            bio: 'Updated bio'
          }
        };

        updateProfileService.updateProfile.mockResolvedValue(mockResponse);

        const response = await request(app)
          .put('/api/v2/buyers/profile')
          .set('Authorization', 'Bearer valid-token')
          .send({
            firstName: 'Jane',
            lastName: 'Smith',
            bio: 'Updated bio'
          })
          .expect(200);

        expect(updateProfileService.updateProfile).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          {
            firstName: 'Jane',
            lastName: 'Smith',
            bio: 'Updated bio'
          }
        );
        expect(response.body).toEqual({
          success: true,
          data: mockResponse,
          message: 'Profile updated successfully',
          pagination: null
        });
      });

      it('should return 500 for service error via HTTP', async () => {
        const mockError = new Error('Service error');
        updateProfileService.updateProfile.mockRejectedValue(mockError);

        await request(app)
          .put('/api/v2/buyers/profile')
          .set('Authorization', 'Bearer valid-token')
          .send({
            firstName: 'Jane'
          })
          .expect(500);
      });
    });

    describe('PUT /api/v2/buyers/profile/avatar', () => {
      it('should upload profile image successfully via HTTP', async () => {
        const mockResponse = {
          message: 'Profile image uploaded successfully',
          buyer: {
            profileImage: {
              url: 'https://example.com/profile.jpg'
            }
          }
        };

        uploadProfileImageService.uploadProfileImage.mockResolvedValue(mockResponse);

        const response = await request(app)
          .put('/api/v2/buyers/profile/avatar')
          .set('Authorization', 'Bearer valid-token')
          .attach('avatar', Buffer.from('fake-image'), 'profile.jpg')
          .expect(200);

        expect(uploadProfileImageService.uploadProfileImage).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          expect.any(Object)
        );
        expect(response.body).toEqual({
          success: true,
          data: mockResponse,
          message: 'Profile image uploaded successfully',
          pagination: null
        });
      });

      it('should return 500 for service error via HTTP', async () => {
        const mockError = new Error('Service error');
        uploadProfileImageService.uploadProfileImage.mockRejectedValue(mockError);

        await request(app)
          .put('/api/v2/buyers/profile/avatar')
          .set('Authorization', 'Bearer valid-token')
          .attach('avatar', Buffer.from('fake-image'), 'profile.jpg')
          .expect(500);
      });
    });
  });
}); 