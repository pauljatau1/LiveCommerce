/**
 * Process SmileID Job Validator Tests
 *
 * This test suite validates the processSmileIdJob validator functionality.
 * It ensures that all validation rules are properly enforced and that
 * appropriate error messages are returned for invalid inputs.
 *
 * Test Coverage:
 * - Valid data validation for individual accounts
 * - Valid data validation for business accounts
 * - Invalid data validation with specific error messages
 * - Edge cases and boundary conditions
 * - Error message accuracy and completeness
 *
 * @module processSmileIdJobValidatorTests
 */

const { validateProcessSmileIdJobData } = require('@modules/seller/validators/processSmileIdJob.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('Process SmileID Job Validator', () => {
  describe('validateProcessSmileIdJobData', () => {
    describe('Individual Account Validation', () => {
      it('should pass validation with valid individual account data', () => {
        const validData = {
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

        expect(() => validateProcessSmileIdJobData(validData, 'individual')).not.toThrow();
      });

      it('should pass validation with minimal required individual account data', () => {
        const validData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901'
          }
        };

        expect(() => validateProcessSmileIdJobData(validData, 'individual')).not.toThrow();
      });

      it('should throw ValidationError when idInfo is missing for individual account', () => {
        const invalidData = {
          partner_params: {}
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo', message: 'ID information is required for individual account verification' }
          ]);
        }
      });

      it('should throw ValidationError when first_name is missing', () => {
        const invalidData = {
          idInfo: {
            last_name: 'Doe',
            id_number: '12345678901'
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.first_name', message: 'First name is required for Enhanced KYC verification' }
          ]);
        }
      });

      it('should throw ValidationError when last_name is missing', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            id_number: '12345678901'
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.last_name', message: 'Last name is required for Enhanced KYC verification' }
          ]);
        }
      });

      it('should throw ValidationError when id_number is missing', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe'
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.id_number', message: 'ID number is required for Enhanced KYC verification' }
          ]);
        }
      });

      it('should throw ValidationError with multiple missing required fields', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John'
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.last_name', message: 'Last name is required for Enhanced KYC verification' },
            { field: 'idInfo.id_number', message: 'ID number is required for Enhanced KYC verification' }
          ]);
        }
      });

      it('should throw ValidationError when country is not a string', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901',
            country: 123
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.country', message: 'Country must be a string' }
          ]);
        }
      });

      it('should throw ValidationError when id_type is not a string', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901',
            id_type: 123
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.id_type', message: 'ID type must be a string' }
          ]);
        }
      });

      it('should throw ValidationError when phone_number is not a string', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901',
            phone_number: 123
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.phone_number', message: 'Phone number must be a string' }
          ]);
        }
      });

      it('should throw ValidationError when dob is not a string', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901',
            dob: 123
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.dob', message: 'Date of birth must be a string' }
          ]);
        }
      });
    });

    describe('Business Account Validation', () => {
      it('should pass validation with valid business account data', () => {
        const validData = {
          images: ['image1.jpg', 'image2.jpg'],
          partner_params: {}
        };

        expect(() => validateProcessSmileIdJobData(validData, 'business')).not.toThrow();
      });

      it('should pass validation with minimal required business account data', () => {
        const validData = {
          images: ['image1.jpg']
        };

        expect(() => validateProcessSmileIdJobData(validData, 'business')).not.toThrow();
      });

      it('should throw ValidationError when images is missing for business account', () => {
        const invalidData = {
          partner_params: {}
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'business')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'business');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'images', message: 'Images are required for business account verification' }
          ]);
        }
      });

      it('should throw ValidationError when images is not an array', () => {
        const invalidData = {
          images: 'not-an-array'
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'business')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'business');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'images', message: 'Images must be an array' }
          ]);
        }
      });

      it('should throw ValidationError when images array is empty', () => {
        const invalidData = {
          images: []
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'business')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'business');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'images', message: 'At least one image is required for business verification' }
          ]);
        }
      });
    });

    describe('Partner Parameters Validation', () => {
      it('should pass validation with valid partner_params object', () => {
        const validData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901'
          },
          partner_params: {
            custom_field: 'custom_value'
          }
        };

        expect(() => validateProcessSmileIdJobData(validData, 'individual')).not.toThrow();
      });

      it('should pass validation when partner_params is not provided', () => {
        const validData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901'
          }
        };

        expect(() => validateProcessSmileIdJobData(validData, 'individual')).not.toThrow();
      });

      it('should throw ValidationError when partner_params is not an object', () => {
        const invalidData = {
          idInfo: {
            first_name: 'John',
            last_name: 'Doe',
            id_number: '12345678901'
          },
          partner_params: 'not-an-object'
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'partner_params', message: 'Partner parameters must be an object' }
          ]);
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle null values gracefully', () => {
        const invalidData = {
          idInfo: null,
          images: null,
          partner_params: null
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo', message: 'ID information is required for individual account verification' }
          ]);
        }
      });

      it('should handle undefined values gracefully', () => {
        const invalidData = {
          idInfo: undefined,
          images: undefined,
          partner_params: undefined
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'business')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'business');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'images', message: 'Images are required for business account verification' }
          ]);
        }
      });

      it('should handle empty string values for required fields', () => {
        const invalidData = {
          idInfo: {
            first_name: '',
            last_name: '',
            id_number: ''
          }
        };

        expect(() => validateProcessSmileIdJobData(invalidData, 'individual')).toThrow(ValidationError);
        
        try {
          validateProcessSmileIdJobData(invalidData, 'individual');
        } catch (error) {
          expect(error.errors).toEqual([
            { field: 'idInfo.first_name', message: 'First name is required for Enhanced KYC verification' },
            { field: 'idInfo.last_name', message: 'Last name is required for Enhanced KYC verification' },
            { field: 'idInfo.id_number', message: 'ID number is required for Enhanced KYC verification' }
          ]);
        }
      });
    });
  });
});
