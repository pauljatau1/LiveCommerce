const verifyPhoneOTPService = require('../../../../src/modules/buyer/services/verifyPhoneOTP.service');
const buyerRepository = require('../../../../src/modules/buyer/repositories/buyer.repository');
const NotFoundException = require('../../../../src/utils/errors/NotFoundException');
const ValidationError = require('../../../../src/utils/errors/ValidationError');

// Mock the repository
jest.mock('../../../../src/modules/buyer/repositories/buyer.repository');

describe('verifyPhoneOTP.service', () => {
  let mockBuyer;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockBuyer = {
      _id: '507f1f77bcf86cd799439011',
      phoneVerification: {
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0
      },
      phoneVerified: false
    };
  });

  describe('verifyPhoneOTP', () => {
    it('should successfully verify phone OTP', async () => {
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        phoneVerified: true,
        phoneVerification: undefined
      });

      const result = await verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '123456');

      expect(result).toEqual({
        message: 'Phone number verified successfully',
        phoneVerified: true
      });

      expect(buyerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(buyerRepository.updateById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        phoneVerified: true,
        phoneVerification: undefined
      });
    });

    it('should throw NotFoundException when buyer not found', async () => {
      buyerRepository.findById.mockResolvedValue(null);

      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '123456')
      ).rejects.toThrow(NotFoundException);

      expect(buyerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw ValidationError when no verification in progress', async () => {
      const buyerWithoutVerification = {
        ...mockBuyer,
        phoneVerification: undefined
      };
      buyerRepository.findById.mockResolvedValue(buyerWithoutVerification);

      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '123456')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw ValidationError when OTP has expired', async () => {
      const buyerWithExpiredOTP = {
        ...mockBuyer,
        phoneVerification: {
          ...mockBuyer.phoneVerification,
          expiresAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        }
      };
      buyerRepository.findById.mockResolvedValue(buyerWithExpiredOTP);
      buyerRepository.updateById.mockResolvedValue({
        ...buyerWithExpiredOTP,
        phoneVerification: undefined
      });

      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '123456')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(buyerRepository.updateById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        phoneVerification: undefined
      });
    });

    it('should throw ValidationError when max attempts exceeded', async () => {
      const buyerWithMaxAttempts = {
        ...mockBuyer,
        phoneVerification: {
          ...mockBuyer.phoneVerification,
          attempts: 3
        }
      };
      buyerRepository.findById.mockResolvedValue(buyerWithMaxAttempts);
      buyerRepository.updateById.mockResolvedValue({
        ...buyerWithMaxAttempts,
        phoneVerification: undefined
      });

      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '123456')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(buyerRepository.updateById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        phoneVerification: undefined
      });
    });

    it('should throw ValidationError for invalid OTP and increment attempts', async () => {
      buyerRepository.findById.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        phoneVerification: {
          ...mockBuyer.phoneVerification,
          attempts: 1
        }
      });

      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '654321')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(buyerRepository.updateById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        phoneVerification: {
          ...mockBuyer.phoneVerification,
          attempts: 1
        }
      });
    });

    it('should throw ValidationError for invalid OTP format', async () => {
      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '12345')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing buyer ID', async () => {
      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('', '123456')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing OTP', async () => {
      await expect(
        verifyPhoneOTPService.verifyPhoneOTP('507f1f77bcf86cd799439011', '')
      ).rejects.toThrow(ValidationError);

      expect(buyerRepository.findById).not.toHaveBeenCalled();
    });
  });
}); 