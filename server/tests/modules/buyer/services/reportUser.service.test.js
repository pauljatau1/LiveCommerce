const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const reportUserService = require('@modules/buyer/services/reportUser.service');
const Buyer = require('@models/Buyer');
const Seller = require('@models/Seller');
const ValidationError = require('@utils/errors/ValidationError');

// Mock SendGrid
jest.mock('@sendgrid/mail');
const sgMail = require('@sendgrid/mail');

let mongoServer;

describe('reportUser.service', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.3'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Buyer.deleteMany({});
    await Seller.deleteMany({});
    
    // Reset mocks
    jest.clearAllMocks();
  });

  const mockBuyerData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    country: 'NG',
    phoneNumber: '+2348012345678',
    password: 'hashedPassword123',
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    isNewBuyer: true,
    isIdentityVerified: false,
    preferredCurrency: 'NGN',
    preferredLanguage: 'en',
    authProvider: 'local'
  };

  const mockSellerData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '+2348012345679',
    password: 'hashedPassword456',
    businessName: 'Jane Store',
    storeName: 'janestore',
    country: 'NG',
    isVerified: false,
    accountType: 'individual'
  };

  describe('getEmailContent', () => {
    it('should return HTML content with populated data', async () => {
      // Arrange
      const reportData = {
        reporter: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        reportedUserId: '60f5e8b3e1b2c3d4e5f6g7h8',
        reportedUserType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.',
        reportId: 'RPT-1234567890-ABCDEF'
      };

      // Act
      const result = await reportUserService.getEmailContent(reportData);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('John Doe');
      expect(result).toContain('john.doe@example.com');
      expect(result).toContain('60f5e8b3e1b2c3d4e5f6g7h8');
      expect(result).toContain('seller');
      expect(result).toContain('Fraudulent behavior');
      expect(result).toContain('This seller is selling counterfeit products.');
      expect(result).toContain('RPT-1234567890-ABCDEF');
      expect(result).toContain(new Date().getFullYear().toString());
    });
  });

  describe('reportUser', () => {
    let reporterId;
    let reportedUserId;

    beforeEach(async () => {
      // Create reporter (buyer)
      const reporter = new Buyer(mockBuyerData);
      const savedReporter = await reporter.save();
      reporterId = savedReporter._id.toString();

      // Create reported user (seller)
      const reportedUser = new Seller(mockSellerData);
      const savedReportedUser = await reportedUser.save();
      reportedUserId = savedReportedUser._id.toString();

      // Mock SendGrid send method
      sgMail.send = jest.fn().mockResolvedValue([{
        statusCode: 202,
        body: 'Email sent successfully'
      }]);
    });

    it('should successfully submit report for seller', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      // Act
      const result = await reportUserService.reportUser(reporterId, reportData);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Report submitted successfully');
      expect(result.report).toBeDefined();
      expect(result.report._id).toBeDefined();
      expect(result.report.reportedUser.userId.toString()).toBe(reportedUserId);
      expect(result.report.reportedUser.userType).toBe('seller');
      expect(result.report.reason).toBe('Fraudulent behavior');
      expect(result.report.description).toBe('This seller is selling counterfeit products and refusing refunds to customers.');
      expect(result.report.status).toBe('pending');
      expect(result.report.createdAt).toBeDefined();
    });

    it('should successfully submit report for buyer', async () => {
      // Arrange
      // Create another buyer to be reported
      const anotherBuyer = new Buyer({
        ...mockBuyerData,
        email: 'another@example.com',
        username: 'anotherdoe'
      });
      const savedAnotherBuyer = await anotherBuyer.save();

      const reportData = {
        userId: savedAnotherBuyer._id.toString(),
        userType: 'buyer',
        reason: 'Inappropriate behavior',
        description: 'This buyer is sending offensive messages to sellers and causing disruption.'
      };

      // Act
      const result = await reportUserService.reportUser(reporterId, reportData);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Report submitted successfully');
      expect(result.report).toBeDefined();
      expect(result.report.reportedUser.userId.toString()).toBe(savedAnotherBuyer._id.toString());
      expect(result.report.reportedUser.userType).toBe('buyer');
      expect(result.report.reason).toBe('Inappropriate behavior');
      expect(result.report.description).toBe('This buyer is sending offensive messages to sellers and causing disruption.');
    });

    it('should send email notification to administrators', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      // Act
      await reportUserService.reportUser(reporterId, reportData);

      // Assert
      expect(sgMail.send).toHaveBeenCalledTimes(1);
      
      const emailCall = sgMail.send.mock.calls[0][0];
      expect(emailCall.to).toEqual(['admin@auqli.com', 'bolu@auqli.com']);
      expect(emailCall.from).toBe('Auqli Platform <support@auqli.com>');
      expect(emailCall.subject).toContain('Fraudulent behavior');
      expect(emailCall.html).toBeDefined();
      expect(emailCall.html).toContain('John Doe');
      expect(emailCall.html).toContain('Fraudulent behavior');
      expect(emailCall.html).toContain('This seller is selling counterfeit products');
    });

    it('should add report to buyer\'s reports array', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      // Act
      await reportUserService.reportUser(reporterId, reportData);

      // Assert
      const updatedBuyer = await Buyer.findById(reporterId);
      expect(updatedBuyer.reports).toHaveLength(1);
      expect(updatedBuyer.reports[0].reportedUser.userId.toString()).toBe(reportedUserId);
      expect(updatedBuyer.reports[0].reportedUser.userType).toBe('seller');
      expect(updatedBuyer.reports[0].reason).toBe('Fraudulent behavior');
      expect(updatedBuyer.reports[0].description).toBe('This seller is selling counterfeit products and refusing refunds to customers.');
      expect(updatedBuyer.reports[0].status).toBe('pending');
      expect(updatedBuyer.reports[0].createdAt).toBeDefined();
    });

    it('should handle multiple reports from same buyer', async () => {
      // Arrange
      // Create another seller to report
      const anotherSeller = new Seller({
        ...mockSellerData,
        email: 'another.seller@example.com',
        businessName: 'Another Store',
        storeName: 'anotherstore'
      });
      const savedAnotherSeller = await anotherSeller.save();

      const firstReportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'First report description.'
      };

      const secondReportData = {
        userId: savedAnotherSeller._id.toString(),
        userType: 'seller',
        reason: 'Poor service',
        description: 'Second report description.'
      };

      // Act
      await reportUserService.reportUser(reporterId, firstReportData);
      await reportUserService.reportUser(reporterId, secondReportData);

      // Assert
      const updatedBuyer = await Buyer.findById(reporterId);
      expect(updatedBuyer.reports).toHaveLength(2);
      expect(updatedBuyer.reports[0].reason).toBe('Fraudulent behavior');
      expect(updatedBuyer.reports[1].reason).toBe('Poor service');
    });

    it('should trim whitespace from reason and description', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: '   Fraudulent behavior   ',
        description: '   This seller is selling counterfeit products.   '
      };

      // Act
      const result = await reportUserService.reportUser(reporterId, reportData);

      // Assert
      expect(result.report.reason).toBe('Fraudulent behavior');
      expect(result.report.description).toBe('This seller is selling counterfeit products.');
    });

    it('should throw ValidationError when reporter does not exist', async () => {
      // Arrange
      const nonExistentReporterId = new mongoose.Types.ObjectId().toString();
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserService.reportUser(nonExistentReporterId, reportData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when reported user does not exist', async () => {
      // Arrange
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const reportData = {
        userId: nonExistentUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserService.reportUser(reporterId, reportData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when user tries to report themselves', async () => {
      // Arrange
      const reportData = {
        userId: reporterId,
        userType: 'buyer',
        reason: 'Self-report test',
        description: 'This is a test of self-reporting prevention.'
      };

      // Act & Assert
      await expect(
        reportUserService.reportUser(reporterId, reportData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with invalid input data', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'invalid-type',
        reason: 'ab', // too short
        description: 'short' // too short
      };

      // Act & Assert
      await expect(
        reportUserService.reportUser(reporterId, reportData)
      ).rejects.toThrow(ValidationError);
    });

    it('should handle SendGrid email sending failure', async () => {
      // Arrange
      sgMail.send = jest.fn().mockRejectedValue(new Error('SendGrid error'));
      
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserService.reportUser(reporterId, reportData)
      ).rejects.toThrow('SendGrid error');
    });

    it('should handle file reading errors for email template', async () => {
      // Arrange
      // Mock fs.readFileSync to throw an error
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act & Assert
      await expect(
        reportUserService.reportUser(reporterId, reportData)
      ).rejects.toThrow('File not found');

      // Restore the original implementation
      require('fs').readFileSync.mockRestore();
    });

    it('should return report with correct data structure', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products and refusing refunds to customers.'
      };

      // Act
      const result = await reportUserService.reportUser(reporterId, reportData);

      // Assert
      expect(result).toMatchObject({
        message: 'Report submitted successfully',
        report: {
          _id: expect.any(mongoose.Types.ObjectId),
          reportedUser: {
            userId: expect.any(mongoose.Types.ObjectId), // ObjectId gets stored as ObjectId
            userType: 'seller'
          },
          reason: 'Fraudulent behavior',
          description: 'This seller is selling counterfeit products and refusing refunds to customers.',
          status: 'pending',
          createdAt: expect.any(Date)
        }
      });
      
      // Additional assertion to check the string representation
      expect(result.report.reportedUser.userId.toString()).toBe(reportedUserId);
    });

    it('should handle large number of concurrent reports', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Create multiple reporters
      const reporters = [];
      for (let i = 0; i < 5; i++) {
        const reporter = new Buyer({
          ...mockBuyerData,
          email: `reporter${i}@example.com`,
          username: `reporter${i}`
        });
        const savedReporter = await reporter.save();
        reporters.push(savedReporter._id.toString());
      }

      // Act
      const promises = reporters.map(id => 
        reportUserService.reportUser(id, reportData)
      );
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.message).toBe('Report submitted successfully');
        expect(result.report).toBeDefined();
      });

      // Verify each reporter has the report in their array
      for (const reporterId of reporters) {
        const buyer = await Buyer.findById(reporterId);
        expect(buyer.reports).toHaveLength(1);
      }
    });

    it('should preserve original data types in database', async () => {
      // Arrange
      const reportData = {
        userId: reportedUserId,
        userType: 'seller',
        reason: 'Fraudulent behavior',
        description: 'This seller is selling counterfeit products.'
      };

      // Act
      await reportUserService.reportUser(reporterId, reportData);

      // Assert
      const updatedBuyer = await Buyer.findById(reporterId).lean();
      const report = updatedBuyer.reports[0];
      
      expect(typeof report.reportedUser.userId).toBe('object'); // ObjectId
      expect(typeof report.reportedUser.userType).toBe('string');
      expect(typeof report.reason).toBe('string');
      expect(typeof report.description).toBe('string');
      expect(typeof report.status).toBe('string');
      expect(report.createdAt).toBeInstanceOf(Date);
    });
  });
});