const updateProfileService = require('@modules/buyer/services/updateProfile.service');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const NotFoundException = require('@utils/errors/NotFoundException');
const ValidationError = require('@utils/errors/ValidationError');

// Mock the dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@modules/buyer/validators/updateProfile.validator');

const { validateUpdateProfileData } = require('@modules/buyer/validators/updateProfile.validator');

describe('updateProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const mockBuyerId = '507f1f77bcf86cd799439011';
    const mockBuyer = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      country: 'Nigeria',
      phoneNumber: '+2341234567890',
      bio: 'Test bio',
      notificationPreferences: { email: true, push: true },
      preferredLanguage: 'en',
      preferredCurrency: 'NGN'
    };

    it('should update profile successfully with valid data', async () => {
      // Mock validation
      validateUpdateProfileData.mockResolvedValue();

      // Mock repository methods
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.findByUsername.mockResolvedValue(null);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        firstName: 'Jane',
        lastName: 'Smith'
      });

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const result = await updateProfileService.updateProfile(mockBuyerId, updateData);

      expect(validateUpdateProfileData).toHaveBeenCalledWith(updateData);
      expect(buyerRepository.findByIdWithFields).toHaveBeenCalledWith(mockBuyerId, {
        firstName: 1,
        lastName: 1,
        username: 1,
        email: 1,
        country: 1,
        phoneNumber: 1,
        bio: 1,
        notificationPreferences: 1,
        preferredLanguage: 1,
        preferredCurrency: 1
      });
      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, updateData);
      expect(result).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'johndoe',
        email: 'john@example.com',
        country: 'Nigeria',
        phoneNumber: '+2341234567890',
        bio: 'Test bio',
        notificationPreferences: { email: true, push: true },
        preferredLanguage: 'en',
        preferredCurrency: 'NGN'
      });
    });

    it('should throw NotFoundException when buyer not found', async () => {
      // Mock validation
      validateUpdateProfileData.mockResolvedValue();

      // Mock repository to return null
      buyerRepository.findByIdWithFields.mockResolvedValue(null);

      const updateData = { firstName: 'Jane' };

      await expect(updateProfileService.updateProfile(mockBuyerId, updateData))
        .rejects.toThrow(NotFoundException);
      await expect(updateProfileService.updateProfile(mockBuyerId, updateData))
        .rejects.toThrow('Buyer not found');
    });

    it('should throw ValidationError when username is already taken', async () => {
      // Mock validation
      validateUpdateProfileData.mockResolvedValue();

      // Mock repository methods
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.findByUsername.mockResolvedValue({ _id: 'different-id' });

      const updateData = { username: 'existinguser' };

      await expect(updateProfileService.updateProfile(mockBuyerId, updateData))
        .rejects.toThrow(ValidationError);
    });

    it('should not check username uniqueness when username is not being changed', async () => {
      // Mock validation
      validateUpdateProfileData.mockResolvedValue();

      // Mock repository methods
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.updateById.mockResolvedValue(mockBuyer);

      const updateData = { firstName: 'Jane' };

      await updateProfileService.updateProfile(mockBuyerId, updateData);

      expect(buyerRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('should merge notification preferences correctly', async () => {
      // Mock validation
      validateUpdateProfileData.mockResolvedValue();

      // Mock repository methods
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.findByUsername.mockResolvedValue(null);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        notificationPreferences: { email: true, push: false, sms: true }
      });

      const updateData = {
        notificationPreferences: { push: false, sms: true }
      };

      const result = await updateProfileService.updateProfile(mockBuyerId, updateData);

      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, {
        notificationPreferences: { email: true, push: false, sms: true }
      });
    });

    it('should handle empty string values correctly', async () => {
      // Mock validation
      validateUpdateProfileData.mockResolvedValue();

      // Mock repository methods
      buyerRepository.findByIdWithFields.mockResolvedValue(mockBuyer);
      buyerRepository.findByUsername.mockResolvedValue(null);
      buyerRepository.updateById.mockResolvedValue({
        ...mockBuyer,
        bio: ''
      });

      const updateData = { bio: '' };

      const result = await updateProfileService.updateProfile(mockBuyerId, updateData);

      expect(buyerRepository.updateById).toHaveBeenCalledWith(mockBuyerId, { bio: '' });
      expect(result.bio).toBe('');
    });
  });

  describe('addFieldIfProvided', () => {
    it('should add field when provided', () => {
      const updateObject = {};
      const updateData = { firstName: 'Jane' };
      
      updateProfileService.addFieldIfProvided(updateObject, updateData, 'firstName');
      
      expect(updateObject.firstName).toBe('Jane');
    });

    it('should not add field when undefined', () => {
      const updateObject = {};
      const updateData = { firstName: undefined };
      
      updateProfileService.addFieldIfProvided(updateObject, updateData, 'firstName');
      
      expect(updateObject.firstName).toBeUndefined();
    });

    it('should add field when null', () => {
      const updateObject = {};
      const updateData = { firstName: null };
      
      updateProfileService.addFieldIfProvided(updateObject, updateData, 'firstName');
      
      expect(updateObject.firstName).toBeNull();
    });

    it('should add field when empty string', () => {
      const updateObject = {};
      const updateData = { firstName: '' };
      
      updateProfileService.addFieldIfProvided(updateObject, updateData, 'firstName');
      
      expect(updateObject.firstName).toBe('');
    });
  });

  describe('handleNotificationPreferences', () => {
    const mockBuyer = {
      notificationPreferences: { email: true, push: true }
    };

    it('should merge notification preferences when provided', () => {
      const updateObject = {};
      const updateData = { notificationPreferences: { push: false, sms: true } };
      
      updateProfileService.handleNotificationPreferences(updateObject, updateData, mockBuyer);
      
      expect(updateObject.notificationPreferences).toEqual({
        email: true,
        push: false,
        sms: true
      });
    });

    it('should not add notification preferences when not provided', () => {
      const updateObject = {};
      const updateData = {};
      
      updateProfileService.handleNotificationPreferences(updateObject, updateData, mockBuyer);
      
      expect(updateObject.notificationPreferences).toBeUndefined();
    });

    it('should handle empty notification preferences', () => {
      const updateObject = {};
      const updateData = { notificationPreferences: {} };
      
      updateProfileService.handleNotificationPreferences(updateObject, updateData, mockBuyer);
      
      expect(updateObject.notificationPreferences).toEqual({
        email: true,
        push: true
      });
    });
  });

  describe('prepareUpdateObject', () => {
    const mockBuyer = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      country: 'Nigeria',
      phoneNumber: '+2341234567890',
      bio: 'Test bio',
      notificationPreferences: { email: true, push: true },
      preferredLanguage: 'en',
      preferredCurrency: 'NGN'
    };

    it('should prepare update object with only provided fields', () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({
        firstName: 'Jane',
        lastName: 'Smith'
      });
    });

    it('should handle notification preferences merge', () => {
      const updateData = {
        notificationPreferences: { push: false, sms: true }
      };

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({
        notificationPreferences: {
          email: true,
          push: false,
          sms: true
        }
      });
    });

    it('should handle empty string values', () => {
      const updateData = {
        bio: '',
        preferredLanguage: ''
      };

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({
        bio: '',
        preferredLanguage: ''
      });
    });

    it('should handle null values', () => {
      const updateData = {
        bio: null,
        preferredLanguage: null
      };

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({
        bio: null,
        preferredLanguage: null
      });
    });

    it('should return empty object when no fields provided', () => {
      const updateData = {};

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({});
    });

    it('should handle undefined values', () => {
      const updateData = {
        firstName: undefined,
        lastName: undefined
      };

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({});
    });

    it('should handle all fields at once', () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        country: 'USA',
        phoneNumber: '+1234567890',
        bio: 'New bio',
        preferredLanguage: 'es',
        preferredCurrency: 'USD',
        notificationPreferences: { email: false }
      };

      const result = updateProfileService.prepareUpdateObject(updateData, mockBuyer);

      expect(result).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        country: 'USA',
        phoneNumber: '+1234567890',
        bio: 'New bio',
        preferredLanguage: 'es',
        preferredCurrency: 'USD',
        notificationPreferences: {
          email: false,
          push: true
        }
      });
    });
  });

  describe('validateUsernameUniqueness', () => {
    it('should not throw error when username is not being changed', async () => {
      const updateData = { firstName: 'Jane' };
      const buyer = { username: 'johndoe' };
      
      buyerRepository.findByUsername.mockResolvedValue(null);
      
      await expect(updateProfileService.validateUsernameUniqueness(updateData, buyer))
        .resolves.not.toThrow();
      
      expect(buyerRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('should not throw error when username is the same', async () => {
      const updateData = { username: 'johndoe' };
      const buyer = { username: 'johndoe' };
      
      buyerRepository.findByUsername.mockResolvedValue(null);
      
      await expect(updateProfileService.validateUsernameUniqueness(updateData, buyer))
        .resolves.not.toThrow();
      
      expect(buyerRepository.findByUsername).not.toHaveBeenCalled();
    });

    it('should not throw error when new username is available', async () => {
      const updateData = { username: 'newusername' };
      const buyer = { username: 'johndoe' };
      
      buyerRepository.findByUsername.mockResolvedValue(null);
      
      await expect(updateProfileService.validateUsernameUniqueness(updateData, buyer))
        .resolves.not.toThrow();
      
      expect(buyerRepository.findByUsername).toHaveBeenCalledWith('newusername');
    });

    it('should throw ValidationError when username is already taken', async () => {
      const updateData = { username: 'existinguser' };
      const buyer = { username: 'johndoe' };
      
      buyerRepository.findByUsername.mockResolvedValue({ _id: 'different-id' });
      
      await expect(updateProfileService.validateUsernameUniqueness(updateData, buyer))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('createResponseObject', () => {
    it('should create response object with all fields', () => {
      const updatedBuyer = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        country: 'USA',
        phoneNumber: '+1234567890',
        bio: 'New bio',
        notificationPreferences: { email: true, push: false },
        preferredLanguage: 'es',
        preferredCurrency: 'USD'
      };

      const result = updateProfileService.createResponseObject(updatedBuyer);

      expect(result).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        country: 'USA',
        phoneNumber: '+1234567890',
        bio: 'New bio',
        notificationPreferences: { email: true, push: false },
        preferredLanguage: 'es',
        preferredCurrency: 'USD'
      });
    });

    it('should handle null values in response object', () => {
      const updatedBuyer = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        country: null,
        phoneNumber: null,
        bio: null,
        notificationPreferences: null,
        preferredLanguage: null,
        preferredCurrency: null
      };

      const result = updateProfileService.createResponseObject(updatedBuyer);

      expect(result).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        country: null,
        phoneNumber: null,
        bio: null,
        notificationPreferences: null,
        preferredLanguage: null,
        preferredCurrency: null
      });
    });
  });
}); 