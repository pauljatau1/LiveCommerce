const reportUserValidator = require('@modules/buyer/validators/reportUser.validator');
const { ObjectId } = require('mongodb');

// Mock the repository
jest.mock('@modules/buyer/repositories/buyer.repository');

const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

describe('reportUser.validator', () => {
  let reporterId;
  let reportedUserId;

  beforeEach(() => {
    // Use ObjectId for testing instead of actual database operations
    reporterId = new ObjectId().toString();
    reportedUserId = new ObjectId().toString();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateReportUserData', () => {
    it('should validate successfully with valid data for reporting seller', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      // Mock repository calls
      buyerRepository.findById.mockResolvedValue({ _id: reporterId });
      buyerRepository.findUserById.mockResolvedValue({ _id: reportedUserId });

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).resolves.not.toThrow();
    });

    it('should validate successfully with valid data for reporting buyer', async () => {
      // Arrange
      const anotherBuyerId = new ObjectId().toString();
      const reportData = {
        userId: anotherBuyerId,
        userType: 'buyer',
        reason: 'Inappropriate behavior',
        description: 'This buyer is sending offensive messages to sellers and causing disruption.'
      };

      // Mock repository calls
      buyerRepository.findById.mockResolvedValue({ _id: reporterId });
      buyerRepository.findUserById.mockResolvedValue({ _id: anotherBuyerId });

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError when userId is missing', async () => {
      // Arrange
      const reportData = {
        // userId missing
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'userId',
            message: 'User ID is required'
          }
        ]
      });
    });

    it('should throw ValidationError when userId is invalid format', async () => {
      // Arrange
      const reportData = {
        userId: 'invalid-id',
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'userId',
            message: 'Invalid user ID format'
          }
        ]
      });
    });

    it('should throw ValidationError when userType is missing', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        // userType missing
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'userType',
            message: 'User type is required'
          }
        ]
      });
    });

    it('should throw ValidationError when userType is invalid', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'invalid-type',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'userType',
            message: 'User type must be either "buyer" or "seller"'
          }
        ]
      });
    });

    it('should throw ValidationError when reason is missing', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        // reason missing
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'reason',
            message: 'Reason is required'
          }
        ]
      });
    });

    it('should throw ValidationError when reason is empty', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: '',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'reason',
            message: 'Reason is required'
          }
        ]
      });
    });

    it('should throw ValidationError when description is missing', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior'
        // description missing
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'description',
            message: 'Description is required'
          }
        ]
      });
    });

    it('should throw ValidationError when description is empty', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: ''
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'description',
            message: 'Description is required'
          }
        ]
      });
    });

    it('should throw ValidationError when reporter tries to report themselves', async () => {
      // Arrange
      const reportData = {
        userId: reporterId, // Same as reporter
        userType: 'buyer',
        reason: 'Fraudulent behavior',
        description: 'This buyer is fraudulent.'
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'userId',
            message: 'You cannot report yourself'
          }
        ]
      });
    });

    it('should throw ValidationError when reporter does not exist', async () => {
      // Arrange
      const nonExistentReporterId = new ObjectId().toString();
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Mock repository to return null for non-existent reporter
      buyerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(nonExistentReporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyerId',
            message: 'Buyer not found'
          }
        ]
      });
    });

    it('should throw ValidationError when reported user does not exist', async () => {
      // Arrange
      const nonExistentUserId = new ObjectId().toString();
      const reportData = {
        userId: nonExistentUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Mock repository calls
      buyerRepository.findById.mockResolvedValue({ _id: reporterId });
      buyerRepository.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'userId',
            message: 'Reported user not found'
          }
        ]
      });
    });

    it('should throw ValidationError with multiple errors for multiple validation failures', async () => {
      // Arrange
      const reportData = {
        // Missing userId, userType, reason, and description
      };

      // Act & Assert
      await expect(
        reportUserValidator.validateReportUserData(reporterId, reportData)
      ).rejects.toMatchObject({
        errors: expect.arrayContaining([
          { field: 'userId', message: 'User ID is required' },
          { field: 'userType', message: 'User type is required' },
          { field: 'reason', message: 'Reason is required' },
          { field: 'description', message: 'Description is required' }
        ])
      });
    });

    describe('Specific Error Messages', () => {
      it('should include specific error message for missing userId', async () => {
        await expect(
          reportUserValidator.validateReportUserData(reporterId, { userType: 'seller' })
        ).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'userId', message: 'User ID is required' },
            { field: 'reason', message: 'Reason is required' },
            { field: 'description', message: 'Description is required' }
          ])
        });
      });

      it('should include specific error message for missing userType', async () => {
        await expect(
          reportUserValidator.validateReportUserData(reporterId, { userId: reportedUserId })
        ).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'userType', message: 'User type is required' },
            { field: 'reason', message: 'Reason is required' },
            { field: 'description', message: 'Description is required' }
          ])
        });
      });

      it('should include specific error message for missing reason', async () => {
        await expect(
          reportUserValidator.validateReportUserData(reporterId, { 
            userId: reportedUserId, 
            userType: 'seller' 
          })
        ).rejects.toMatchObject({
          errors: expect.arrayContaining([
            { field: 'reason', message: 'Reason is required' },
            { field: 'description', message: 'Description is required' }
          ])
        });
      });

      it('should include specific error message for missing description', async () => {
        await expect(
          reportUserValidator.validateReportUserData(reporterId, { 
            userId: reportedUserId, 
            userType: 'seller',
            reason: 'Fraudulent behavior'
          })
        ).rejects.toMatchObject({
          errors: [{ field: 'description', message: 'Description is required' }]
        });
      });

      it('should include specific error message for invalid userType', async () => {
        await expect(
          reportUserValidator.validateReportUserData(reporterId, { 
            userId: reportedUserId, 
            userType: 'invalid',
            reason: 'Fraudulent behavior',
            description: 'Test description'
          })
        ).rejects.toMatchObject({
          errors: [{ field: 'userType', message: 'User type must be either "buyer" or "seller"' }]
        });
      });

      it('should include specific error message for self-reporting', async () => {
        await expect(
          reportUserValidator.validateReportUserData(reporterId, { 
            userId: reporterId, 
            userType: 'buyer',
            reason: 'Fraudulent behavior',
            description: 'Test description'
          })
        ).rejects.toMatchObject({
          errors: [{ field: 'userId', message: 'You cannot report yourself' }]
        });
      });

      it('should include specific error message for non-existent reporter', async () => {
        // Mock repository to return null for non-existent reporter
        buyerRepository.findById.mockResolvedValue(null);

        await expect(
          reportUserValidator.validateReportUserData(new ObjectId().toString(), { 
            userId: reportedUserId, 
            userType: 'seller',
            reason: 'Fraudulent behavior',
            description: 'Test description'
          })
        ).rejects.toMatchObject({
          errors: [{ field: 'buyerId', message: 'Buyer not found' }]
        });
      });

      it('should include specific error message for non-existent reported user', async () => {
        // Mock repository calls
        buyerRepository.findById.mockResolvedValue({ _id: reporterId });
        buyerRepository.findUserById.mockResolvedValue(null);

        await expect(
          reportUserValidator.validateReportUserData(reporterId, { 
            userId: new ObjectId().toString(), 
            userType: 'seller',
            reason: 'Fraudulent behavior',
            description: 'Test description'
          })
        ).rejects.toMatchObject({
          errors: [{ field: 'userId', message: 'Reported user not found' }]
        });
      });
    });
  });
});