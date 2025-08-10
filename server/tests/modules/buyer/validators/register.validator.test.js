const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ValidationError = require('@utils/errors/ValidationError');

// Import the validator
const registerValidator = require('@modules/buyer/validators/register.validator');
const buyerRepository = require('@modules/buyer/repositories/buyer.repository');
const { validateXSS, validateEmailFormat } = require('@utils/validator');

// Mock dependencies
jest.mock('@modules/buyer/repositories/buyer.repository');
jest.mock('@utils/validator');

let mongoServer;

describe('Register Validator', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validRegistrationData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    phoneNumber: '+2348012345678',
    password: 'password123'
  };

  describe('validateRegisterData', () => {
    it('should pass validation for valid registration data', async () => {
      // Mock repository to return empty results (no existing users)
      buyerRepository.findAll.mockResolvedValue([]);
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .resolves.toBeUndefined();

      // Verify all validation functions were called
      expect(buyerRepository.findAll).toHaveBeenCalledTimes(3); // email, username, phoneNumber
    });

    it('should throw ValidationError when any validation fails', async () => {
      // Mock email validation to fail
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('validateFirstName', () => {
    it('should pass validation for valid firstName', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: 'John'
      })).resolves.toBeUndefined();
    });

    it('should throw error when firstName is missing', async () => {
      const dataWithoutFirstName = { ...validRegistrationData };
      delete dataWithoutFirstName.firstName;

      await expect(registerValidator.validateRegisterData(dataWithoutFirstName))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'firstName',
              message: 'firstName is required'
            }
          ]
        });
    });

    it('should throw error when firstName is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: ''
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'firstName',
            message: 'firstName is required'
          }
        ]
      });
    });

    it('should throw error when firstName is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: null
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'firstName',
            message: 'firstName is required'
          }
        ]
      });
    });

    it('should throw error when firstName is undefined', async () => {
      const dataWithoutFirstName = { ...validRegistrationData };
      dataWithoutFirstName.firstName = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutFirstName))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'firstName',
              message: 'firstName is required'
            }
          ]
        });
    });

    it('should throw error when firstName contains XSS patterns', async () => {
      // Mock XSS validation to return error only for firstName
      validateXSS.mockImplementation((value, field) => {
        if (field === 'firstName') {
          return {
            field: 'firstName',
            message: 'Invalid characters detected in firstName'
          };
        }
        return null;
      });
      
      // Mock repository to return empty results for other validations
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: '<script>alert("xss")</script>'
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'firstName',
            message: 'Invalid characters detected in firstName'
          }
        ]
      });
    });

    it('should throw error when firstName exceeds 100 characters', async () => {
      validateXSS.mockReturnValue(null);

      const longFirstName = 'a'.repeat(101);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: longFirstName
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'firstName',
            message: 'firstName must not exceed 100 characters'
          }
        ]
      });
    });

    it('should pass validation when firstName is exactly 100 characters', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      const exactFirstName = 'a'.repeat(100);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: exactFirstName
      })).resolves.toBeUndefined();
    });
  });

  describe('validateLastName', () => {
    it('should pass validation for valid lastName', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: 'Doe'
      })).resolves.toBeUndefined();
    });

    it('should throw error when lastName is missing', async () => {
      const dataWithoutLastName = { ...validRegistrationData };
      delete dataWithoutLastName.lastName;

      await expect(registerValidator.validateRegisterData(dataWithoutLastName))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'lastName',
              message: 'lastName is required'
            }
          ]
        });
    });

    it('should throw error when lastName is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: ''
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'lastName',
            message: 'lastName is required'
          }
        ]
      });
    });

    it('should throw error when lastName is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: null
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'lastName',
            message: 'lastName is required'
          }
        ]
      });
    });

    it('should throw error when lastName is undefined', async () => {
      const dataWithoutLastName = { ...validRegistrationData };
      dataWithoutLastName.lastName = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutLastName))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'lastName',
              message: 'lastName is required'
            }
          ]
        });
    });

    it('should throw error when lastName contains XSS patterns', async () => {
      // Mock XSS validation to return error only for lastName
      validateXSS.mockImplementation((value, field) => {
        if (field === 'lastName') {
          return {
            field: 'lastName',
            message: 'Invalid characters detected in lastName'
          };
        }
        return null;
      });
      
      // Mock repository to return empty results for other validations
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: '<script>alert("xss")</script>'
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'lastName',
            message: 'Invalid characters detected in lastName'
          }
        ]
      });
    });

    it('should throw error when lastName exceeds 100 characters', async () => {
      validateXSS.mockReturnValue(null);

      const longLastName = 'a'.repeat(101);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: longLastName
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'lastName',
            message: 'lastName must not exceed 100 characters'
          }
        ]
      });
    });

    it('should pass validation when lastName is exactly 100 characters', async () => {
      validateXSS.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      const exactLastName = 'a'.repeat(100);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: exactLastName
      })).resolves.toBeUndefined();
    });
  });

  describe('validateEmail', () => {
    it('should pass validation for valid email', async () => {
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: 'john.doe@example.com'
      })).resolves.toBeUndefined();
    });

    it('should throw error when email is missing', async () => {
      const dataWithoutEmail = { ...validRegistrationData };
      delete dataWithoutEmail.email;

      await expect(registerValidator.validateRegisterData(dataWithoutEmail))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when email is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: ''
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'email',
            message: 'Email is required'
          }
        ]
      });
    });

    it('should throw error when email is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: null
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'email',
            message: 'Email is required'
          }
        ]
      });
    });

    it('should throw error when email is undefined', async () => {
      const dataWithoutEmail = { ...validRegistrationData };
      dataWithoutEmail.email = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutEmail))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            }
          ]
        });
    });

    it('should throw error when email format is invalid', async () => {
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: 'invalid-email'
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'email',
            message: 'Invalid email format for email'
          }
        ]
      });
    });

    it('should throw error when email already exists', async () => {
      // Mock repository to return existing email
      buyerRepository.findAll
        .mockResolvedValueOnce([{ email: 'john.doe@example.com' }]) // email check
        .mockResolvedValueOnce([]) // phoneNumber check
        .mockResolvedValueOnce([]); // username check
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Email is already registered'
            }
          ]
        });
    });

    it('should pass validation for various valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'test.user@example.com',
        'test+user@example.com',
        'test123@example.com',
        'test@subdomain.example.com',
        'test@example.co.uk'
      ];

      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      for (const email of validEmails) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          email
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('validatePhoneNumber', () => {
    it('should pass validation for valid phone number', async () => {
      buyerRepository.findAll.mockResolvedValue([]);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        phoneNumber: '+2348012345678'
      })).resolves.toBeUndefined();
    });

    it('should throw error when phoneNumber is missing', async () => {
      const dataWithoutPhone = { ...validRegistrationData };
      delete dataWithoutPhone.phoneNumber;

      await expect(registerValidator.validateRegisterData(dataWithoutPhone))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            }
          ]
        });
    });

    it('should throw error when phoneNumber is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        phoneNumber: ''
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });
    });

    it('should throw error when phoneNumber is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        phoneNumber: null
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number is required'
          }
        ]
      });
    });

    it('should throw error when phoneNumber is undefined', async () => {
      const dataWithoutPhone = { ...validRegistrationData };
      dataWithoutPhone.phoneNumber = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutPhone))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            }
          ]
        });
    });

    it('should throw error when phoneNumber already exists', async () => {
      // Mock repository to return existing phoneNumber
      buyerRepository.findAll
        .mockResolvedValueOnce([]) // email check
        .mockResolvedValueOnce([{ phoneNumber: '+2348012345678' }]) // phoneNumber check
        .mockResolvedValueOnce([]); // username check
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is already registered'
            }
          ]
        });
    });

    it('should pass validation for various phone number formats', async () => {
      const validPhoneNumbers = [
        '+2348012345678',
        '+1234567890',
        '+44123456789',
        '08012345678',
        '1234567890'
      ];

      buyerRepository.findAll.mockResolvedValue([]);

      for (const phoneNumber of validPhoneNumbers) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          phoneNumber
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('validateUsername', () => {
    it('should pass validation for valid username', async () => {
      buyerRepository.findAll.mockResolvedValue([]);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: 'johndoe'
      })).resolves.toBeUndefined();
    });

    it('should throw error when username is missing', async () => {
      const dataWithoutUsername = { ...validRegistrationData };
      delete dataWithoutUsername.username;

      await expect(registerValidator.validateRegisterData(dataWithoutUsername))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'username',
              message: 'Username is required'
            }
          ]
        });
    });

    it('should throw error when username is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: ''
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'username',
            message: 'Username is required'
          }
        ]
      });
    });

    it('should throw error when username is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: null
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'username',
            message: 'Username is required'
          }
        ]
      });
    });

    it('should throw error when username is undefined', async () => {
      const dataWithoutUsername = { ...validRegistrationData };
      dataWithoutUsername.username = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutUsername))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'username',
              message: 'Username is required'
            }
          ]
        });
    });

    it('should throw error when username contains spaces', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: 'john doe'
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'username',
            message: 'Username cannot contain spaces'
          }
        ]
      });
    });

    it('should throw error when username already exists', async () => {
      // Mock repository to return existing username
      buyerRepository.findAll
        .mockResolvedValueOnce([]) // email check
        .mockResolvedValueOnce([]) // phoneNumber check
        .mockResolvedValueOnce([{ username: 'johndoe' }]); // username check
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'username',
              message: 'Username is already registered'
            }
          ]
        });
    });

    it('should pass validation for various valid username formats', async () => {
      const validUsernames = [
        'johndoe',
        'john_doe',
        'john123',
        'john.doe',
        'john-doe',
        'johndoe123'
      ];

      buyerRepository.findAll.mockResolvedValue([]);

      for (const username of validUsernames) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          username
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('validatePassword', () => {
    it('should pass validation for valid password', async () => {
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        password: 'password123'
      })).resolves.toBeUndefined();
    });

    it('should throw error when password is missing', async () => {
      const dataWithoutPassword = { ...validRegistrationData };
      delete dataWithoutPassword.password;

      await expect(registerValidator.validateRegisterData(dataWithoutPassword))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'password',
              message: 'Password is required'
            }
          ]
        });
    });

    it('should throw error when password is empty string', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        password: ''
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'password',
            message: 'Password is required'
          }
        ]
      });
    });

    it('should throw error when password is null', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        password: null
      })).rejects.toMatchObject({
        errors: [
          {
            field: 'password',
            message: 'Password is required'
          }
        ]
      });
    });

    it('should throw error when password is undefined', async () => {
      const dataWithoutPassword = { ...validRegistrationData };
      dataWithoutPassword.password = undefined;

      await expect(registerValidator.validateRegisterData(dataWithoutPassword))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'password',
              message: 'Password is required'
            }
          ]
        });
    });

    it('should pass validation for various password formats', async () => {
      const validPasswords = [
        'password123',
        'P@ssw0rd!',
        'password with spaces',
        '123456789',
        'a',
        'verylongpasswordwithspecialcharacters!@#$%^&*()'
      ];

      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      for (const password of validPasswords) {
        await expect(registerValidator.validateRegisterData({
          ...validRegistrationData,
          password
        })).resolves.toBeUndefined();
      }
    });
  });

  describe('Multiple validation errors', () => {
    it('should throw ValidationError with multiple errors', async () => {
      // Mock multiple validation failures
      validateXSS.mockReturnValue({
        field: 'firstName',
        message: 'Invalid characters detected in firstName'
      });
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });
      buyerRepository.findAll.mockResolvedValue([{ username: 'johndoe' }]);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: '<script>alert("xss")</script>',
        email: 'invalid-email'
      })).rejects.toMatchObject({
        errors: expect.arrayContaining([
          {
            field: 'firstName',
            message: 'Invalid characters detected in firstName'
          },
          {
            field: 'email',
            message: 'Invalid email format for email'
          },
          {
            field: 'username',
            message: 'Username is already registered'
          }
        ])
      });
    });
  });

  describe('Repository interaction', () => {
    it('should call repository with correct queries', async () => {
      // Mock all validation functions to pass
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);

      await registerValidator.validateRegisterData(validRegistrationData);

      expect(buyerRepository.findAll).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
      expect(buyerRepository.findAll).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(buyerRepository.findAll).toHaveBeenCalledWith({ phoneNumber: '+2348012345678' });
    });

    it('should handle repository errors gracefully', async () => {
      // Mock all validation functions to pass
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);
      
      // Mock repository to throw error
      buyerRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('Specific Error Messages', () => {
    beforeEach(() => {
      // Mock all validation functions to pass by default
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);
      buyerRepository.findAll.mockResolvedValue([]);
    });

    it('should include specific error message for missing firstName', async () => {
      const dataWithoutFirstName = { ...validRegistrationData };
      delete dataWithoutFirstName.firstName;

      await expect(registerValidator.validateRegisterData(dataWithoutFirstName))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'firstName',
              message: 'firstName is required'
            }
          ]
        });
    });

    it('should include specific error message for missing lastName', async () => {
      const dataWithoutLastName = { ...validRegistrationData };
      delete dataWithoutLastName.lastName;

      await expect(registerValidator.validateRegisterData(dataWithoutLastName))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'lastName',
              message: 'lastName is required'
            }
          ]
        });
    });

    it('should include specific error message for missing email', async () => {
      const dataWithoutEmail = { ...validRegistrationData };
      delete dataWithoutEmail.email;

      await expect(registerValidator.validateRegisterData(dataWithoutEmail))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Email is required'
            }
          ]
        });
    });

    it('should include specific error message for missing phoneNumber', async () => {
      const dataWithoutPhone = { ...validRegistrationData };
      delete dataWithoutPhone.phoneNumber;

      await expect(registerValidator.validateRegisterData(dataWithoutPhone))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            }
          ]
        });
    });

    it('should include specific error message for missing username', async () => {
      const dataWithoutUsername = { ...validRegistrationData };
      delete dataWithoutUsername.username;

      await expect(registerValidator.validateRegisterData(dataWithoutUsername))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'username',
              message: 'Username is required'
            }
          ]
        });
    });

    it('should include specific error message for missing password', async () => {
      const dataWithoutPassword = { ...validRegistrationData };
      delete dataWithoutPassword.password;

      await expect(registerValidator.validateRegisterData(dataWithoutPassword))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'password',
              message: 'Password is required'
            }
          ]
        });
    });

    it('should include specific error message for username with spaces', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        username: 'john doe'
      }))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'username',
              message: 'Username cannot contain spaces'
            }
          ]
        });
    });

    it('should include specific error message for existing username', async () => {
      // Mock repository to return existing username
      buyerRepository.findAll
        .mockResolvedValueOnce([]) // email check
        .mockResolvedValueOnce([]) // phoneNumber check
        .mockResolvedValueOnce([{ username: 'johndoe' }]); // username check
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'username',
              message: 'Username is already registered'
            }
          ]
        });
    });

    it('should include specific error message for existing email', async () => {
      // Mock repository to return existing email
      buyerRepository.findAll
        .mockResolvedValueOnce([{ email: 'john.doe@example.com' }]) // email check
        .mockResolvedValueOnce([]) // phoneNumber check
        .mockResolvedValueOnce([]); // username check
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Email is already registered'
            }
          ]
        });
    });

    it('should include specific error message for existing phone number', async () => {
      // Mock repository to return existing phoneNumber
      buyerRepository.findAll
        .mockResolvedValueOnce([]) // email check
        .mockResolvedValueOnce([{ phoneNumber: '+2348012345678' }]) // phoneNumber check
        .mockResolvedValueOnce([]); // username check
      
      // Mock validator functions
      validateXSS.mockReturnValue(null);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData(validRegistrationData))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'phoneNumber',
              message: 'Phone number is already registered'
            }
          ]
        });
    });

    it('should include specific error message for firstName with XSS', async () => {
      // Mock XSS validation to return error only for firstName
      validateXSS.mockImplementation((value, field) => {
        if (field === 'firstName') {
          return {
            field: 'firstName',
            message: 'Invalid characters detected in firstName'
          };
        }
        return null;
      });
      
      // Mock repository to return empty results for other validations
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: '<script>alert("xss")</script>'
      }))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'firstName',
              message: 'Invalid characters detected in firstName'
            }
          ]
        });
    });

    it('should include specific error message for lastName with XSS', async () => {
      // Mock XSS validation to return error only for lastName
      validateXSS.mockImplementation((value, field) => {
        if (field === 'lastName') {
          return {
            field: 'lastName',
            message: 'Invalid characters detected in lastName'
          };
        }
        return null;
      });
      
      // Mock repository to return empty results for other validations
      buyerRepository.findAll.mockResolvedValue([]);
      validateEmailFormat.mockReturnValue(null);

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: '<script>alert("xss")</script>'
      }))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'lastName',
              message: 'Invalid characters detected in lastName'
            }
          ]
        });
    });

    it('should include specific error message for invalid email format', async () => {
      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });

      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        email: 'invalid-email'
      }))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'email',
              message: 'Invalid email format for email'
            }
          ]
        });
    });

    it('should include specific error message for firstName exceeding length limit', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        firstName: 'A'.repeat(101)
      }))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'firstName',
              message: 'firstName must not exceed 100 characters'
            }
          ]
        });
    });

    it('should include specific error message for lastName exceeding length limit', async () => {
      await expect(registerValidator.validateRegisterData({
        ...validRegistrationData,
        lastName: 'A'.repeat(101)
      }))
        .rejects
        .toMatchObject({
          errors: [
            {
              field: 'lastName',
              message: 'lastName must not exceed 100 characters'
            }
          ]
        });
    });

    it('should include multiple error messages for multiple validation failures', async () => {
      const dataWithMultipleErrors = {
        email: 'invalid-email',
        username: 'john doe'
      };

      validateEmailFormat.mockReturnValue({
        field: 'email',
        message: 'Invalid email format for email'
      });

      await expect(registerValidator.validateRegisterData(dataWithMultipleErrors))
        .rejects
        .toMatchObject({
          errors: expect.arrayContaining([
            {
              field: 'firstName',
              message: 'firstName is required'
            },
            {
              field: 'lastName',
              message: 'lastName is required'
            },
            {
              field: 'email',
              message: 'Invalid email format for email'
            },
            {
              field: 'phoneNumber',
              message: 'Phone number is required'
            },
            {
              field: 'username',
              message: 'Username cannot contain spaces'
            },
            {
              field: 'password',
              message: 'Password is required'
            }
          ])
        });
    });
  });
}); 