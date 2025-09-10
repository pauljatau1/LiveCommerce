const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const selectAccountTypeService = require('@modules/seller/services/selectAccountType.service');
const sellerRepository = require('@modules/seller/repositories/seller.repository');
const ValidationError = require('@utils/errors/ValidationError');
const NotFoundException = require('@utils/errors/NotFoundException');

// Mock the validator
jest.mock('@modules/seller/validators/selectAccountType.validator');

describe('Select Account Type Service', () => {
  let mongoServer;
  let mockValidator;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.3' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Get the mocked validator
    mockValidator = require('@modules/seller/validators/selectAccountType.validator');
  });

  describe('selectAccountType', () => {
    const sellerId = '507f1f77bcf86cd799439011';
    const validData = {
      accountType: 'business'
    };

    it('should successfully select business account type', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller with a proper save method
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [{ name: 'Electronics' }],
        shippingOptions: { standard: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockImplementation(function() {
          // Return the updated seller object
          return Promise.resolve({
            _id: this._id,
            accountType: this.accountType,
            isProfileComplete: this.isProfileComplete,
            businessName: this.businessName,
            businessAddress: this.businessAddress,
            bankDetails: this.bankDetails,
            categories: this.categories,
            shippingOptions: this.shippingOptions,
            warehouseAddress: this.warehouseAddress,
            storeName: this.storeName
          });
        })
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service
      const result = await selectAccountTypeService.selectAccountType(sellerId, validData);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(validData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify seller was updated
      expect(mockSeller.accountType).toBe('business');
      expect(mockSeller.isProfileComplete).toBe(true);

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();

      // Verify result
      expect(result.accountType).toBe('business');
      expect(result.isProfileComplete).toBe(true);
    });

    it('should successfully select individual account type', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller with a proper save method
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [{ name: 'Electronics' }],
        shippingOptions: { standard: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockImplementation(function() {
          // Return the updated seller object
          return Promise.resolve({
            _id: this._id,
            accountType: this.accountType,
            isProfileComplete: this.isProfileComplete,
            businessName: this.businessName,
            businessAddress: this.businessAddress,
            bankDetails: this.bankDetails,
            categories: this.categories,
            shippingOptions: this.shippingOptions,
            warehouseAddress: this.warehouseAddress,
            storeName: this.storeName
          });
        })
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service with individual account type
      const individualData = { accountType: 'individual' };
      const result = await selectAccountTypeService.selectAccountType(sellerId, individualData);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(individualData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify seller was updated
      expect(mockSeller.accountType).toBe('individual');
      expect(mockSeller.isProfileComplete).toBe(true);

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();

      // Verify result
      expect(result.accountType).toBe('individual');
      expect(result.isProfileComplete).toBe(true);
    });

    it('should handle uppercase account type input', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller with a proper save method
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [{ name: 'Electronics' }],
        shippingOptions: { standard: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockImplementation(function() {
          // Return the updated seller object
          return Promise.resolve({
            _id: this._id,
            accountType: this.accountType,
            isProfileComplete: this.isProfileComplete,
            businessName: this.businessName,
            businessAddress: this.businessAddress,
            bankDetails: this.bankDetails,
            categories: this.categories,
            shippingOptions: this.shippingOptions,
            warehouseAddress: this.warehouseAddress,
            storeName: this.storeName
          });
        })
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service with uppercase account type
      const uppercaseData = { accountType: 'BUSINESS' };
      const result = await selectAccountTypeService.selectAccountType(sellerId, uppercaseData);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(uppercaseData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify seller was updated with lowercase
      expect(mockSeller.accountType).toBe('business');
      expect(mockSeller.isProfileComplete).toBe(true);

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();

      // Verify result
      expect(result.accountType).toBe('business');
      expect(result.isProfileComplete).toBe(true);
    });

    it('should handle mixed case account type input', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller with a proper save method
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [{ name: 'Electronics' }],
        shippingOptions: { standard: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockImplementation(function() {
          // Return the updated seller object
          return Promise.resolve({
            _id: this._id,
            accountType: this.accountType,
            isProfileComplete: this.isProfileComplete,
            businessName: this.businessName,
            businessAddress: this.businessAddress,
            bankDetails: this.bankDetails,
            categories: this.categories,
            shippingOptions: this.shippingOptions,
            warehouseAddress: this.warehouseAddress,
            storeName: this.storeName
          });
        })
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service with mixed case account type
      const mixedCaseData = { accountType: 'BuSiNeSs' };
      const result = await selectAccountTypeService.selectAccountType(sellerId, mixedCaseData);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(mixedCaseData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify seller was updated with lowercase
      expect(mockSeller.accountType).toBe('business');
      expect(mockSeller.isProfileComplete).toBe(true);

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();

      // Verify result
      expect(result.accountType).toBe('business');
      expect(result.isProfileComplete).toBe(true);
    });

    it('should set isProfileComplete to false when profile is incomplete', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller with incomplete profile
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: null, // Missing business name
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [], // Empty categories
        shippingOptions: { standard: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockImplementation(function() {
          // Return the updated seller object
          return Promise.resolve({
            _id: this._id,
            accountType: this.accountType,
            isProfileComplete: this.isProfileComplete,
            businessName: this.businessName,
            businessAddress: this.businessAddress,
            bankDetails: this.bankDetails,
            categories: this.categories,
            shippingOptions: this.shippingOptions,
            warehouseAddress: this.warehouseAddress,
            storeName: this.storeName
          });
        })
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service
      const result = await selectAccountTypeService.selectAccountType(sellerId, validData);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(validData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify seller was updated
      expect(mockSeller.accountType).toBe('business');
      expect(mockSeller.isProfileComplete).toBe(false); // Should be false due to incomplete profile

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();

      // Verify result
      expect(result.accountType).toBe('business');
      expect(result.isProfileComplete).toBe(false);
    });

    it('should throw ValidationError when validator fails', async () => {
      // Mock validator to throw ValidationError
      const validationError = new ValidationError([
        { field: 'accountType', message: 'Invalid account type' }
      ]);
      mockValidator.validateSelectAccountTypeData.mockImplementation(() => {
        throw validationError;
      });

      // Call the service and expect it to throw
      await expect(
        selectAccountTypeService.selectAccountType(sellerId, validData)
      ).rejects.toThrow(ValidationError);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(validData);

      // Verify repository was not called
      expect(sellerRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when seller is not found', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Mock repository to return null (seller not found)
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(null);

      // Call the service and expect it to throw
      await expect(
        selectAccountTypeService.selectAccountType(sellerId, validData)
      ).rejects.toThrow(NotFoundException);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(validData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
    });

    it('should handle database save errors', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [{ name: 'Electronics' }],
        shippingOptions: { standard: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service and expect it to throw
      await expect(
        selectAccountTypeService.selectAccountType(sellerId, validData)
      ).rejects.toThrow('Database connection failed');

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(validData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();
    });

    it('should handle profile completion check correctly', async () => {
      // Mock validator to pass
      mockValidator.validateSelectAccountTypeData.mockReturnValue();

      // Create a mock seller with complete profile
      const mockSeller = {
        _id: sellerId,
        accountType: null,
        isProfileComplete: false,
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        bankDetails: { accountNumber: '1234567890' },
        categories: [{ name: 'Electronics' }, { name: 'Clothing' }], // Multiple categories
        shippingOptions: { standard: true, express: true },
        warehouseAddress: '456 Warehouse St',
        storeName: 'Test Store',
        save: jest.fn().mockImplementation(function() {
          // Return the updated seller object
          return Promise.resolve({
            _id: this._id,
            accountType: this.accountType,
            isProfileComplete: this.isProfileComplete,
            businessName: this.businessName,
            businessAddress: this.businessAddress,
            bankDetails: this.bankDetails,
            categories: this.categories,
            shippingOptions: this.shippingOptions,
            warehouseAddress: this.warehouseAddress,
            storeName: this.storeName
          });
        })
      };

      // Mock repository to return seller
      jest.spyOn(sellerRepository, 'findById').mockResolvedValue(mockSeller);

      // Call the service
      const result = await selectAccountTypeService.selectAccountType(sellerId, validData);

      // Verify validator was called
      expect(mockValidator.validateSelectAccountTypeData).toHaveBeenCalledWith(validData);

      // Verify repository was called
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);

      // Verify seller was updated
      expect(mockSeller.accountType).toBe('business');
      expect(mockSeller.isProfileComplete).toBe(true); // Should be true due to complete profile

      // Verify save was called
      expect(mockSeller.save).toHaveBeenCalled();

      // Verify result
      expect(result.accountType).toBe('business');
      expect(result.isProfileComplete).toBe(true);
    });
  });
});
