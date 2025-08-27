const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const updateAddressValidator = require('@modules/buyer/validators/updateAddress.validator');
const Buyer = require('@models/Buyer');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');

// Mock the buyer repository
jest.mock('@modules/buyer/repositories/buyer.repository');

describe('Update Address Validator', () => {
  let mongoServer;

  beforeAll(async () => {
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
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('validateUpdateAddressData', () => {
    let testBuyer;
    let testAddressId;

         beforeEach(async () => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      
      testBuyer = new Buyer({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123',
        shippingAddresses: [{
          addressType: 'home',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          addressLine1: '123 Main Street',
          zipCode: '100001'
        }]
      });
      await testBuyer.save();
      testAddressId = testBuyer.shippingAddresses[0]._id.toString();
      
      // Mock the repository to return the testBuyer for all tests
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(testBuyer);
    });

    it('should validate valid address update data', async () => {
      // Arrange
      const validData = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        validData, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

         it('should throw ValidationError when buyer not found', async () => {
       // Arrange
       const nonExistentBuyerId = new mongoose.Types.ObjectId().toString();
       const validData = {
         addressType: 'work',
         country: 'Nigeria',
         state: 'Lagos',
         city: 'Victoria Island',
         addressLine1: '456 Business Avenue',
         zipCode: '100002'
       };

       // Mock the repository to return null for non-existent buyer
       buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(null);

       // Act & Assert
       await expect(updateAddressValidator.validateUpdateAddressData(
         validData, 
         nonExistentBuyerId, 
         testAddressId
       )).rejects.toMatchObject({
         errors: [
           {
             field: 'buyer',
             message: 'Buyer not found'
           }
         ]
       });
     });

    it('should throw ValidationError when address not found', async () => {
      // Arrange
      const nonExistentAddressId = new mongoose.Types.ObjectId().toString();
      const validData = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        validData, 
        testBuyer._id.toString(), 
        nonExistentAddressId
      )).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address not found'
          }
        ]
      });
    });

    it('should throw ValidationError when address type is invalid', async () => {
      // Arrange
      const invalidData = {
        addressType: 'invalid',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        invalidData, 
        testBuyer._id.toString(), 
        testAddressId
      )).rejects.toMatchObject({
        errors: [
          {
            field: 'addressType',
            message: 'Invalid address type'
          }
        ]
      });
    });

    it('should throw ValidationError when address type conflicts with existing address', async () => {
      // Arrange - Add another address with 'work' type to create conflict
      testBuyer.shippingAddresses.push({
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      });
      await testBuyer.save();
      
      // Update the mock to return the updated buyer
      buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(testBuyer);

      const conflictingData = {
        addressType: 'work', // Try to change 'home' address to 'work' which conflicts
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '789 Another Street',
        zipCode: '100003'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        conflictingData, 
        testBuyer._id.toString(), 
        testAddressId
      )).rejects.toMatchObject({
        errors: [
          {
            field: 'addressType',
            message: "Address type 'work' already exists"
          }
        ]
      });
    });

    it('should allow updating address type when no conflict exists', async () => {
      // Arrange
      const validData = {
        addressType: 'work',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        validData, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

    it('should allow updating the same address type for the same address', async () => {
      // Arrange
      const validData = {
        addressType: 'home',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Victoria Island',
        addressLine1: '456 Business Avenue',
        zipCode: '100002'
      };

      // Act & Assert
      await expect(updateAddressValidator.validateUpdateAddressData(
        validData, 
        testBuyer._id.toString(), 
        testAddressId
      )).resolves.not.toThrow();
    });

         it('should throw ValidationError for invalid zip code format', async () => {
       const data = {
         addressType: 'home',
         country: 'Nigeria',
         state: 'Lagos',
         city: 'Lagos',
         addressLine1: '123 Main St',
         zipCode: ''
       };

       await expect(updateAddressValidator.validateUpdateAddressData(data, testBuyer._id.toString(), testAddressId))
         .rejects.toMatchObject({
           errors: [
             {
               field: 'zipCode',
               message: 'Zip code must be a valid string'
             }
           ]
         });
     });

    it('should throw ValidationError for missing buyer ID', async () => {
      // Mock the repository to return null for null buyer ID
      buyerRepository.findByIdWithShippingAddresses.mockImplementation((buyerId) => {
        if (buyerId === null) {
          return Promise.resolve(null);
        }
        return Promise.resolve(testBuyer);
      });
      
      await expect(
        updateAddressValidator.validateUpdateAddressData({
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          zipCode: '100002'
        }, null, testAddressId)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyer',
            message: 'Buyer not found'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid buyer ID format', async () => {
      // Mock the repository to return null for invalid buyer ID
      buyerRepository.findByIdWithShippingAddresses.mockImplementation((buyerId) => {
        if (buyerId === 'invalid-id') {
          return Promise.resolve(null);
        }
        return Promise.resolve(testBuyer);
      });
      
      await expect(
        updateAddressValidator.validateUpdateAddressData({
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          zipCode: '100002'
        }, 'invalid-id', testAddressId)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'buyer',
            message: 'Buyer not found'
          }
        ]
      });
    });

    it('should throw ValidationError for missing address ID', async () => {
      await expect(
        updateAddressValidator.validateUpdateAddressData({
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          zipCode: '100002'
        }, testBuyer._id.toString(), null)
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address not found'
          }
        ]
      });
    });

    it('should throw ValidationError for invalid address ID format', async () => {
      await expect(
        updateAddressValidator.validateUpdateAddressData({
          addressType: 'work',
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Victoria Island',
          addressLine1: '456 Business Avenue',
          zipCode: '100002'
        }, testBuyer._id.toString(), 'invalid-id')
      ).rejects.toMatchObject({
        errors: [
          {
            field: 'addressId',
            message: 'Address not found'
          }
        ]
      });
    });

    it('should throw ValidationError for missing address data', async () => {
      await expect(
        updateAddressValidator.validateUpdateAddressData(null, testBuyer._id.toString(), testAddressId)
      ).rejects.toThrow(TypeError);
    });

    describe('Specific Error Messages', () => {
      beforeEach(() => {
        // Mock the repository to return the testBuyer for findByIdWithShippingAddresses
        buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(testBuyer);
      });

           it('should include specific error message for buyer not found', async () => {
         buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(null);

         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'work',
           country: 'Nigeria',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'buyer',
               message: 'Buyer not found'
             }
           ]
         });
       });

      it('should include specific error message for address not found', async () => {
         const buyerWithoutAddress = {
           ...testBuyer,
           shippingAddresses: []
         };
         buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(buyerWithoutAddress);

         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'work',
           country: 'Nigeria',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'addressId',
               message: 'Address not found'
             }
           ]
         });
       });

             it('should include specific error message for invalid address type', async () => {
         // Ensure the mock returns the testBuyer with the correct structure
         buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(testBuyer);
         
         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'invalid',
           country: 'Nigeria',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'addressType',
               message: 'Invalid address type'
             }
           ]
         });
       });

             it('should include specific error message for duplicate address type', async () => {
         const buyerWithDuplicateAddress = {
           ...testBuyer,
           shippingAddresses: [
             { _id: 'address1', addressType: 'home' },
             { _id: 'address2', addressType: 'work' }
           ]
         };
         buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(buyerWithDuplicateAddress);

         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'home',
           country: 'Nigeria',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), 'address2')).rejects.toMatchObject({
           errors: [
             {
               field: 'addressType',
               message: "Address type 'home' already exists"
             }
           ]
         });
       });

             it('should include specific error message for invalid country', async () => {
         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'home',
           country: '',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'country',
               message: 'Country must be a valid string'
             }
           ]
         });
       });

             it('should include specific error message for invalid state', async () => {
         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'home',
           country: 'Nigeria',
           state: '',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'state',
               message: 'State must be a valid string'
             }
           ]
         });
       });

             it('should include specific error message for invalid city', async () => {
         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'home',
           country: 'Nigeria',
           state: 'Lagos',
           city: '',
           addressLine1: '456 Business Avenue',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'city',
               message: 'City must be a valid string'
             }
           ]
         });
       });

             it('should include specific error message for invalid address line 1', async () => {
         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'home',
           country: 'Nigeria',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '',
           zipCode: '100002'
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'addressLine1',
               message: 'Address line 1 must be a valid string'
             }
           ]
         });
       });

             it('should include specific error message for invalid zip code', async () => {
         await expect(updateAddressValidator.validateUpdateAddressData({
           addressType: 'home',
           country: 'Nigeria',
           state: 'Lagos',
           city: 'Victoria Island',
           addressLine1: '456 Business Avenue',
           zipCode: ''
         }, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'zipCode',
               message: 'Zip code must be a valid string'
             }
           ]
         });
       });

             it('should include multiple error messages for multiple validation failures', async () => {
         // Ensure the mock returns the testBuyer with the correct structure
         buyerRepository.findByIdWithShippingAddresses.mockResolvedValue(testBuyer);
         
         const dataWithMultipleErrors = {
           addressType: 'invalid',
           country: '',
           state: '',
           city: '',
           addressLine1: '',
           zipCode: ''
         };

         await expect(updateAddressValidator.validateUpdateAddressData(dataWithMultipleErrors, testBuyer._id.toString(), testAddressId)).rejects.toMatchObject({
           errors: [
             {
               field: 'addressType',
               message: 'Invalid address type'
             },
             {
               field: 'country',
               message: 'Country must be a valid string'
             },
             {
               field: 'state',
               message: 'State must be a valid string'
             },
             {
               field: 'city',
               message: 'City must be a valid string'
             },
             {
               field: 'addressLine1',
               message: 'Address line 1 must be a valid string'
             },
             {
               field: 'zipCode',
               message: 'Zip code must be a valid string'
             }
           ]
         });
       });
    });
  });
}); 