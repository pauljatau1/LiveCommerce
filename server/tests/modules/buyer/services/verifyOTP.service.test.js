const verifyOTPService = require('@modules/buyer/services/verifyOTP.service');
const Buyer = require('@models/Buyer');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the agenda
jest.mock('@config/agenda', () => ({
  agenda: {
    schedule: jest.fn()
  }
}));

// Mock the Buyer model
jest.mock('@models/Buyer');

describe('verifyOTP Service', () => {
  let mockBuyer;
  let mockAgenda;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockBuyer = {
      _id: 'buyer123',
      email: 'test@example.com',
      otp: '1234',
      emailVerified: false,
      save: jest.fn().mockResolvedValue(true)
    };

    mockAgenda = require('@config/agenda').agenda;
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      // Arrange
      Buyer.findOne = jest.fn().mockResolvedValue(mockBuyer);
      mockAgenda.schedule = jest.fn().mockResolvedValue(true);

      // Act
      const result = await verifyOTPService.verifyOTP('test@example.com', '1234');

      // Assert
      expect(Buyer.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockBuyer.emailVerified).toBe(true);
      expect(mockBuyer.otp).toBeUndefined();
      expect(mockBuyer.save).toHaveBeenCalled();
      expect(mockAgenda.schedule).toHaveBeenCalledWith('in 10 seconds', 'credit_welcome_bonus', { buyerId: 'buyer123' });
      
      expect(result).toEqual({
        message: 'Email verified successfully.',
        bonus: {
          coming: true,
          amount: 500,
          currency: 'NGN',
          timeToCredit: '10 seconds'
        }
      });
    });

    it('should verify OTP successfully with numeric input', async () => {
      // Arrange
      Buyer.findOne = jest.fn().mockResolvedValue(mockBuyer);
      mockAgenda.schedule = jest.fn().mockResolvedValue(true);

      // Act - Test with numeric OTP (1234 as number)
      const result = await verifyOTPService.verifyOTP('test@example.com', 1234);

      // Assert
      expect(Buyer.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockBuyer.emailVerified).toBe(true);
      expect(mockBuyer.otp).toBeUndefined();
      expect(mockBuyer.save).toHaveBeenCalled();
      expect(mockAgenda.schedule).toHaveBeenCalledWith('in 10 seconds', 'credit_welcome_bonus', { buyerId: 'buyer123' });
      
      expect(result).toEqual({
        message: 'Email verified successfully.',
        bonus: {
          coming: true,
          amount: 500,
          currency: 'NGN',
          timeToCredit: '10 seconds'
        }
      });
    });

    it('should throw ValidationError for missing email', async () => {
      // Act & Assert
      await expect(verifyOTPService.verifyOTP('', '1234')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing OTP', async () => {
      // Act & Assert
      await expect(verifyOTPService.verifyOTP('test@example.com', '')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email format', async () => {
      // Act & Assert
      await expect(verifyOTPService.verifyOTP('invalid-email', '1234')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid OTP length', async () => {
      // Act & Assert
      await expect(verifyOTPService.verifyOTP('test@example.com', '123')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Arrange
      Buyer.findOne = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(verifyOTPService.verifyOTP('test@example.com', '1234')).rejects.toThrow(NotFoundException);
    });

    it('should throw ValidationError for invalid OTP', async () => {
      // Arrange
      Buyer.findOne = jest.fn().mockResolvedValue(mockBuyer);

      // Act & Assert
      await expect(verifyOTPService.verifyOTP('test@example.com', '5678')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid numeric OTP', async () => {
      // Arrange
      Buyer.findOne = jest.fn().mockResolvedValue(mockBuyer);

      // Act & Assert - Test with numeric OTP that doesn't match
      await expect(verifyOTPService.verifyOTP('test@example.com', 5678)).rejects.toThrow(ValidationError);
    });

    it('should handle database errors', async () => {
      // Arrange
      Buyer.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(verifyOTPService.verifyOTP('test@example.com', '1234')).rejects.toThrow('Database error');
    });
  });
}); 