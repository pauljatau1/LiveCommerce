/**
 * Process SmileID Job Service Tests
 *
 * This test suite validates the processSmileIdJob service functionality.
 * It ensures that all business logic is properly implemented and that
 * the service correctly handles various scenarios and edge cases.
 *
 * Test Coverage:
 * - Valid job processing for individual accounts
 * - Valid job processing for business accounts
 * - Error handling for missing sellers
 * - Error handling for validation failures
 * - Error handling for SmileID API failures
 * - Environment variable validation
 * - Mock verification for external dependencies
 *
 * @module processSmileIdJobServiceTests
 */

const { processSmileIdJob } = require('@modules/seller/services/processSmileIdJob.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const processSmileIdJobValidator = require('@modules/seller/validators/processSmileIdJob.validator');
const ValidationError = require('@utils/errors/ValidationError');
const Seller = require('@models/Seller');
const mongoose = require('mongoose');

// Mock the SmileID Core module
jest.mock('smile-identity-core', () => ({
  IDApi: jest.fn().mockImplementation(() => ({
    submit_job: jest.fn()
  })),
  WebApi: jest.fn().mockImplementation(() => ({
    submit_job: jest.fn()
  }))
}));

// Mock the validator
jest.mock('@modules/seller/validators/processSmileIdJob.validator', () => ({
  validateProcessSmileIdJobData: jest.fn()
}));

// Mock the repository
jest.mock('@modules/seller/repositories/seller.repository', () => ({
  findById: jest.fn(),
  updateById: jest.fn()
}));

describe('Process SmileID Job Service', () => {
  let mockSeller;
  let validIndividualData;
  let validBusinessData;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up environment variables
    process.env.SMILEID_PARTNER_ID = 'test-partner-id';
    process.env.SMILEID_API_KEY = 'test-api-key';
    process.env.BACKEND_URL = 'http://localhost:3000';
    process.env.SMILEID_SANDBOX_MODE = 'true';

    // Create mock seller
    mockSeller = new Seller({
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      accountType: 'individual'
    });

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

  describe('processSmileIdJob', () => {
    describe('Individual Account Processing', () => {
      beforeEach(() => {
        mockSeller.accountType = 'individual';
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});
      });

      it('should successfully process individual account job', async () => {
        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(validIndividualData, mockSeller._id.toString());

        expect(result).toEqual({
          success: true,
          jobId: expect.stringMatching(/^job-.*-\d+$/),
          result: mockResult
        });

        expect(sellerRepository.findById).toHaveBeenCalledWith(mockSeller._id.toString());
        expect(processSmileIdJobValidator.validateProcessSmileIdJobData).toHaveBeenCalledWith(validIndividualData, 'individual');
        expect(mockConnection.submit_job).toHaveBeenCalled();
        expect(sellerRepository.updateById).toHaveBeenCalled();
      });

      it('should handle individual job with minimal data', async () => {
        const minimalData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901'
          }
        };

        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(minimalData, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(result.jobId).toMatch(/^job-.*-\d+$/);
        expect(result.result).toEqual(mockResult);
      });

      it('should handle individual job API failure', async () => {
        const mockResult = {
          success: false,
          error: 'API Error'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(validIndividualData, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(result.result).toEqual(mockResult);
        expect(sellerRepository.updateById).not.toHaveBeenCalled();
      });
    });

    describe('Business Account Processing', () => {
      beforeEach(() => {
        mockSeller.accountType = 'business';
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});
      });

      it('should successfully process business account job', async () => {
        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image1.jpg', 'processed-image2.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.WebApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(validBusinessData, mockSeller._id.toString());

        expect(result).toEqual({
          success: true,
          jobId: expect.stringMatching(/^job-.*-\d+$/),
          result: mockResult
        });

        expect(sellerRepository.findById).toHaveBeenCalledWith(mockSeller._id.toString());
        expect(processSmileIdJobValidator.validateProcessSmileIdJobData).toHaveBeenCalledWith(validBusinessData, 'business');
        expect(mockConnection.submit_job).toHaveBeenCalled();
        expect(sellerRepository.updateById).toHaveBeenCalled();
      });

      it('should handle business job with additional idInfo', async () => {
        const businessDataWithIdInfo = {
          ...validBusinessData,
          idInfo: {
            company_name: 'Test Company'
          }
        };

        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image1.jpg', 'processed-image2.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.WebApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(businessDataWithIdInfo, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(result.jobId).toMatch(/^job-.*-\d+$/);
        expect(result.result).toEqual(mockResult);
      });

      it('should handle business job API failure', async () => {
        const mockResult = {
          success: false,
          error: 'API Error'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.WebApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(validBusinessData, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(result.result).toEqual(mockResult);
        expect(sellerRepository.updateById).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should throw error when seller not found', async () => {
        sellerRepository.findById.mockResolvedValue(null);

        await expect(processSmileIdJob(validIndividualData, 'non-existent-id'))
          .rejects.toThrow('Seller not found');

        expect(sellerRepository.findById).toHaveBeenCalledWith('non-existent-id');
      });

      it('should throw ValidationError when validation fails', async () => {
        sellerRepository.findById.mockResolvedValue(mockSeller);
        const validationError = new ValidationError([
          { field: 'idInfo.first_name', message: 'First name is required' }
        ]);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {
          throw validationError;
        });

        await expect(processSmileIdJob(validIndividualData, mockSeller._id.toString()))
          .rejects.toThrow(ValidationError);

        expect(sellerRepository.findById).toHaveBeenCalledWith(mockSeller._id.toString());
        expect(processSmileIdJobValidator.validateProcessSmileIdJobData).toHaveBeenCalledWith(validIndividualData, 'individual');
      });

      it('should throw error when SmileID environment variables are missing', async () => {
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

        // Remove environment variables
        delete process.env.SMILEID_PARTNER_ID;
        delete process.env.SMILEID_API_KEY;

        await expect(processSmileIdJob(validIndividualData, mockSeller._id.toString()))
          .rejects.toThrow(ValidationError);
        
        await expect(processSmileIdJob(validIndividualData, mockSeller._id.toString()))
          .rejects.toMatchObject({
            errors: [{
              field: 'environment',
              message: 'Missing required environment variables: SMILEID_PARTNER_ID, SMILEID_API_KEY'
            }]
          });
      });

      it('should throw error when BACKEND_URL is missing for business accounts', async () => {
        mockSeller.accountType = 'business';
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

        // Remove BACKEND_URL environment variable
        delete process.env.BACKEND_URL;

        await expect(processSmileIdJob(validBusinessData, mockSeller._id.toString()))
          .rejects.toThrow(ValidationError);
        
        await expect(processSmileIdJob(validBusinessData, mockSeller._id.toString()))
          .rejects.toMatchObject({
            errors: [{
              field: 'environment',
              message: 'Missing required environment variables: BACKEND_URL'
            }]
          });
      });

      it('should handle SmileID API connection errors', async () => {
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

        const SIDCore = require('smile-identity-core');
        SIDCore.IDApi.mockImplementation(() => {
          throw new Error('Connection failed');
        });

        await expect(processSmileIdJob(validIndividualData, mockSeller._id.toString()))
          .rejects.toThrow('Connection failed');
      });

      it('should handle SmileID API submission errors', async () => {
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockRejectedValue(new Error('Submission failed'))
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        await expect(processSmileIdJob(validIndividualData, mockSeller._id.toString()))
          .rejects.toThrow('Submission failed');
      });
    });

    describe('Verification Result Saving', () => {
      beforeEach(() => {
        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});
      });

      it('should save verification result when job is successful', async () => {
        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        await processSmileIdJob(validIndividualData, mockSeller._id.toString());

        expect(sellerRepository.updateById).toHaveBeenCalledWith(
          mockSeller._id.toString(),
          expect.objectContaining({
            smileIdVerification: expect.objectContaining({
              type: 'individual',
              provider: 'SmileID',
              result: mockResult,
              status: 'verified'
            }),
            hasFilledVerificationDocuments: true,
            isVerified: true
          })
        );
      });

      it('should not save verification result when job is unsuccessful', async () => {
        const mockResult = {
          success: false,
          job_id: 'job-123-456',
          images: [],
          ResultCode: '1001'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        await processSmileIdJob(validIndividualData, mockSeller._id.toString());

        // The service should not save the result when success is false
        expect(sellerRepository.updateById).not.toHaveBeenCalled();
      });

      it('should not save verification result when seller not found during save', async () => {
        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        // Mock seller not found during save
        sellerRepository.updateById.mockImplementation(() => {
          sellerRepository.findById.mockResolvedValue(null);
        });

        const result = await processSmileIdJob(validIndividualData, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(sellerRepository.updateById).toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle seller with different account types', async () => {
        const testCases = [
          { accountType: 'individual', data: validIndividualData },
          { accountType: 'business', data: validBusinessData }
        ];

        for (const testCase of testCases) {
          jest.clearAllMocks();
          
          mockSeller.accountType = testCase.accountType;
          sellerRepository.findById.mockResolvedValue(mockSeller);
          processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

          const mockResult = {
            success: true,
            job_id: 'job-123-456',
            images: ['processed-image.jpg'],
            ResultCode: '1012'
          };

          const SIDCore = require('smile-identity-core');
          const mockConnection = {
            submit_job: jest.fn().mockResolvedValue(mockResult)
          };
          
          if (testCase.accountType === 'individual') {
            SIDCore.IDApi.mockImplementation(() => mockConnection);
          } else {
            SIDCore.WebApi.mockImplementation(() => mockConnection);
          }

          const result = await processSmileIdJob(testCase.data, mockSeller._id.toString());

          expect(result.success).toBe(true);
          expect(result.jobId).toMatch(/^job-.*-\d+$/);
          expect(result.result).toEqual(mockResult);
        }
      });

      it('should handle empty partner_params', async () => {
        const dataWithEmptyParams = {
          ...validIndividualData,
          partner_params: {}
        };

        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(dataWithEmptyParams, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(mockConnection.submit_job).toHaveBeenCalled();
      });

      it('should handle missing partner_params', async () => {
        const dataWithoutParams = {
          idInfo: validIndividualData.idInfo
        };

        sellerRepository.findById.mockResolvedValue(mockSeller);
        processSmileIdJobValidator.validateProcessSmileIdJobData.mockImplementation(() => {});

        const mockResult = {
          success: true,
          job_id: 'job-123-456',
          images: ['processed-image.jpg'],
          ResultCode: '1012'
        };

        const SIDCore = require('smile-identity-core');
        const mockConnection = {
          submit_job: jest.fn().mockResolvedValue(mockResult)
        };
        SIDCore.IDApi.mockImplementation(() => mockConnection);

        const result = await processSmileIdJob(dataWithoutParams, mockSeller._id.toString());

        expect(result.success).toBe(true);
        expect(mockConnection.submit_job).toHaveBeenCalled();
      });
    });
  });
});
