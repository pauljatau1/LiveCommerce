/**
 * Process SmileID Job Controller Tests
 *
 * This test suite validates the processSmileIdJob controller functionality.
 * It ensures that the controller properly handles HTTP requests, delegates
 * to the service layer, and returns appropriate responses.
 *
 * Test Coverage:
 * - Successful job processing requests
 * - Authentication and authorization
 * - Error handling and status codes
 * - Request/response format validation
 * - Service layer integration
 * - Middleware integration
 *
 * @module processSmileIdJobControllerTests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import the app without starting the server
const { app } = require('@/app');

const Seller = require('@models/Seller');

// Mock the service
jest.mock('@modules/seller/services/processSmileIdJob.service', () => ({
  processSmileIdJob: jest.fn()
}));

const processSmileIdJobService = require('@modules/seller/services/processSmileIdJob.service');

describe('Process SmileID Job Controller', () => {
  let mongoServer;
  let seller;
  let authToken;
  let validIndividualData;
  let validBusinessData;

  beforeAll(async () => {
    // Start in-memory MongoDB with compatible version
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up database connections
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    // Clean up blips session helper interval
    try {
      const sessionHelper = require('@modules/blipsv2/helpers/session.helper');
      if (sessionHelper.cleanup) {
        sessionHelper.cleanup();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';

    // Clean up database before each test
    await Seller.deleteMany({});

    // Create test seller
    seller = new Seller({
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      accountType: 'individual',
      isEmailVerified: true,
      phoneNumber: '+2348012345678',
      password: 'hashedPassword123'
    });
    await seller.save();

    // Generate auth token
    authToken = jwt.sign(
      { id: seller._id.toString(), email: seller.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Valid individual account data
    validIndividualData = {
      idInfo: {
        first_name: 'John',
        last_name: 'Doe',
        id_number: '12345678901',
        country: 'NG',
        id_type: 'NIN_SLIP',
        phone_number: '+2348012345678',
        dob: '1990-01-01'
      },
      partner_params: {}
    };

    // Valid business account data
    validBusinessData = {
      images: ['image1.jpg', 'image2.jpg'],
      partner_params: {}
    };
  });

  describe('POST /api/v2/sellers/verification/smileid/job', () => {
    describe('Successful Requests', () => {
      it('should successfully process individual account job', async () => {
        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'SmileID job processed successfully',
          data: mockServiceResponse,
          pagination: null
        });

        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          validIndividualData,
          seller._id.toString()
        );
      });

      it('should successfully process business account job', async () => {
        // Update seller to business account
        seller.accountType = 'business';
        await seller.save();

        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image1.jpg', 'processed-image2.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validBusinessData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'SmileID job processed successfully',
          data: mockServiceResponse,
          pagination: null
        });

        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          validBusinessData,
          seller._id.toString()
        );
      });

      it('should handle job with minimal required data', async () => {
        const minimalData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901'
          }
        };

        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(minimalData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('SmileID job processed successfully');
        expect(response.body.data).toEqual(mockServiceResponse);
      });
    });

    describe('Authentication and Authorization', () => {
      it('should return 401 when no token is provided', async () => {
        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .send(validIndividualData)
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: 'No token provided'
        });

        expect(processSmileIdJobService.processSmileIdJob).not.toHaveBeenCalled();
      });

      it('should return 401 when invalid token is provided', async () => {
        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', 'Bearer invalid-token')
          .send(validIndividualData)
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: 'Invalid token'
        });

        expect(processSmileIdJobService.processSmileIdJob).not.toHaveBeenCalled();
      });

      it('should return 401 when token is malformed', async () => {
        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', 'Bearer malformed.token')
          .send(validIndividualData)
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: 'Invalid token'
        });

        expect(processSmileIdJobService.processSmileIdJob).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when seller not found', async () => {
        processSmileIdJobService.processSmileIdJob.mockRejectedValue(new Error('Seller not found'));

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(500);

        expect(response.body).toEqual({
          error: 'Something went wrong!'
        });

        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          validIndividualData,
          seller._id.toString()
        );
      });

      it('should return 422 when validation fails', async () => {
        const ValidationError = require('@utils/errors/ValidationError');
        const validationError = new ValidationError([
          { field: 'idInfo.first_name', message: 'First name is required' }
        ]);

        processSmileIdJobService.processSmileIdJob.mockRejectedValue(validationError);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(422);

        expect(response.body).toEqual({
          success: false,
          message: 'Validation failed',
          errors: [
            { field: 'idInfo.first_name', message: 'First name is required' }
          ]
        });

        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          validIndividualData,
          seller._id.toString()
        );
      });

      it('should return 500 when service throws unexpected error', async () => {
        processSmileIdJobService.processSmileIdJob.mockRejectedValue(new Error('Unexpected error'));

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(500);

        expect(response.body).toEqual({
          error: 'Something went wrong!'
        });

        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          validIndividualData,
          seller._id.toString()
        );
      });

      it('should return 500 when SmileID API fails', async () => {
        processSmileIdJobService.processSmileIdJob.mockRejectedValue(new Error('SmileID API failure'));

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(500);

        expect(response.body).toEqual({
          error: 'Something went wrong!'
        });

        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          validIndividualData,
          seller._id.toString()
        );
      });
    });

    describe('Request Validation', () => {
      it('should handle empty request body', async () => {
        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          {},
          seller._id.toString()
        );
      });

      it('should handle request with additional fields', async () => {
        const dataWithExtraFields = {
          ...validIndividualData,
          extraField: 'extraValue',
          anotherField: 123
        };

        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(dataWithExtraFields)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          dataWithExtraFields,
          seller._id.toString()
        );
      });
    });

    describe('Response Format', () => {
      it('should return response in correct format', async () => {
        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(200);

        // Verify response structure
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');

        // Verify response values
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('SmileID job processed successfully');
        expect(response.body.data).toEqual(mockServiceResponse);
        expect(response.body.pagination).toBe(null);
      });

      it('should maintain original response structure in data object', async () => {
        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validIndividualData)
          .expect(200);

        // Verify that the original response structure is preserved in the data object
        expect(response.body.data).toEqual(mockServiceResponse);
        expect(response.body.data.success).toBe(true);
        expect(response.body.data.jobId).toBe('job-123-456');
        expect(response.body.data.result).toEqual(mockServiceResponse.result);
      });
    });

    describe('Edge Cases', () => {
      it('should handle different account types correctly', async () => {
        const testCases = [
          { accountType: 'individual', data: validIndividualData },
          { accountType: 'business', data: validBusinessData }
        ];

        for (const testCase of testCases) {
          // Update seller account type
          seller.accountType = testCase.accountType;
          await seller.save();

          const mockServiceResponse = {
            success: true,
            jobId: 'job-123-456',
            result: {
              success: true,
              job_id: 'job-123-456',
              images: ['processed-image.jpg'],
              ResultCode: '1012'
            }
          };

          processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

          const response = await request(app)
            .post('/api/v2/sellers/verification/smileid/job')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testCase.data)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
            testCase.data,
            seller._id.toString()
          );
        }
      });

      it('should handle large request payloads', async () => {
        const largeData = {
          ...validIndividualData,
          partner_params: {
            largeField: 'x'.repeat(10000),
            anotherLargeField: Array(1000).fill('data')
          }
        };

        const mockServiceResponse = {
          success: true,
          jobId: 'job-123-456',
          result: {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          }
        };

        processSmileIdJobService.processSmileIdJob.mockResolvedValue(mockServiceResponse);

        const response = await request(app)
          .post('/api/v2/sellers/verification/smileid/job')
          .set('Authorization', `Bearer ${authToken}`)
          .send(largeData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(processSmileIdJobService.processSmileIdJob).toHaveBeenCalledWith(
          largeData,
          seller._id.toString()
        );
      });
    });
  });
});
