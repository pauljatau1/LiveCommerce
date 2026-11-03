/**
 * SmileID Callback Validator Tests
 *
 * This test suite validates the smileIdCallback validator functionality.
 * It ensures that the validator properly validates input data and throws appropriate errors.
 *
 * Test Coverage:
 * - Valid data validation
 * - Required field validation
 * - Data type validation
 * - Business rule validation
 * - Error message validation
 * - Edge case handling
 *
 * @module smileIdCallbackValidatorTests
 */

const { validateSmileIdCallbackData } = require('@modules/seller/validators/smileIdCallback.validator');
const ValidationError = require('@utils/errors/ValidationError');

describe('SmileID Callback Validator', () => {
  let validData;

  beforeEach(() => {
    // Valid callback data
    validData = {
      job_id: 'job_123456789',
      user_id: 'user_123456789',
      partner_params: {
        seller_id: '507f1f77bcf86cd799439011',
        account_type: 'business'
      },
      ResultCode: '1012',
      ResultText: 'Success',
      job_complete: true,
      success: true,
      Images: ['image1.jpg', 'image2.jpg']
    };
  });

  describe('Valid data validation', () => {
    it('should pass validation with valid business callback data', () => {
      // Act & Assert
      expect(() => validateSmileIdCallbackData(validData)).not.toThrow();
    });

    it('should pass validation with valid individual callback data', () => {
      // Arrange
      const individualData = {
        ...validData,
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'individual'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(individualData)).not.toThrow();
    });

    it('should pass validation with alternative field names', () => {
      // Arrange
      const alternativeData = {
        job_id: 'job_123456789',
        user_id: 'user_123456789',
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business'
        },
        result_code: '1020',
        result_text: 'Success',
        job_complete: true,
        success: true,
        images: ['image1.jpg', 'image2.jpg']
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(alternativeData)).not.toThrow();
    });

    it('should pass validation with minimal required data', () => {
      // Arrange
      const minimalData = {
        job_id: 'job_123456789',
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business'
        },
        ResultCode: '1012',
        ResultText: 'Success',
        job_complete: true
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(minimalData)).not.toThrow();
    });
  });

  describe('job_id validation', () => {
    it('should throw error when job_id is missing', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.job_id;

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'job_id', message: 'Job ID is required' }
          ]
        }));
    });

    it('should throw error when job_id is null', () => {
      // Arrange
      const invalidData = { ...validData, job_id: null };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'job_id', message: 'Job ID is required' }
          ]
        }));
    });

    it('should throw error when job_id is not a string or number', () => {
      // Arrange
      const invalidData = { ...validData, job_id: {} };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'job_id', message: 'Job ID must be a string or number' }
          ]
        }));
    });

    it('should pass validation with string job_id', () => {
      // Arrange
      const stringJobIdData = { ...validData, job_id: 'job_123456789' };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(stringJobIdData)).not.toThrow();
    });

    it('should pass validation with number job_id', () => {
      // Arrange
      const numberJobIdData = { ...validData, job_id: 123456789 };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(numberJobIdData)).not.toThrow();
    });
  });

  describe('partner_params validation', () => {
    it('should throw error when partner_params is missing', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.partner_params;

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'partner_params', message: 'Partner parameters are required' }
          ]
        }));
    });

    it('should throw error when partner_params is null', () => {
      // Arrange
      const invalidData = { ...validData, partner_params: null };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'partner_params', message: 'Partner parameters are required' }
          ]
        }));
    });

    it('should throw error when partner_params is not an object', () => {
      // Arrange
      const invalidData = { ...validData, partner_params: 'not an object' };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'partner_params', message: 'Partner parameters must be an object' }
          ]
        }));
    });

    it('should throw error when seller_id is missing in partner_params', () => {
      // Arrange
      const invalidData = {
        ...validData,
        partner_params: {
          account_type: 'business'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'partner_params.seller_id', message: 'Seller ID is required in partner parameters' }
          ]
        }));
    });

    it('should throw error when account_type is missing in partner_params', () => {
      // Arrange
      const invalidData = {
        ...validData,
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'partner_params.account_type', message: 'Account type is required in partner parameters' }
          ]
        }));
    });

    it('should throw error when account_type is not valid', () => {
      // Arrange
      const invalidData = {
        ...validData,
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'invalid_type'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'partner_params.account_type', message: 'Account type must be either "business" or "individual"' }
          ]
        }));
    });

    it('should pass validation with business account_type', () => {
      // Arrange
      const businessData = {
        ...validData,
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(businessData)).not.toThrow();
    });

    it('should pass validation with individual account_type', () => {
      // Arrange
      const individualData = {
        ...validData,
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'individual'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(individualData)).not.toThrow();
    });
  });

  describe('verification result validation', () => {
    it('should throw error when no result code is provided', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.ResultCode;
      delete invalidData.result_code;

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'result_code', message: 'Result code is required (ResultCode or result_code)' }
          ]
        }));
    });

    it('should throw error when no result text is provided', () => {
      // Arrange
      const invalidData = { ...validData };
      delete invalidData.ResultText;
      delete invalidData.result_text;

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'result_text', message: 'Result text is required (ResultText or result_text)' }
          ]
        }));
    });

    it('should throw error when no images or completion status is provided', () => {
      // Arrange
      const invalidData = {
        ...validData,
        Images: [],
        images: [],
        job_complete: undefined,
        success: undefined
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'verification_data', message: 'Verification result must include either: (1) Images array with at least one image, OR (2) job_complete: true/false, OR (3) success: true/false. Currently missing all three.' }
          ]
        }));
    });

    it('should pass validation with ResultCode and ResultText', () => {
      // Arrange
      const resultCodeData = {
        ...validData,
        ResultCode: '1012',
        ResultText: 'Success'
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(resultCodeData)).not.toThrow();
    });

    it('should pass validation with result_code and result_text', () => {
      // Arrange
      const resultCodeData = {
        ...validData,
        result_code: '1020',
        result_text: 'Success'
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(resultCodeData)).not.toThrow();
    });

    it('should pass validation with Images array', () => {
      // Arrange
      const imagesData = {
        ...validData,
        Images: ['image1.jpg', 'image2.jpg']
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(imagesData)).not.toThrow();
    });

    it('should pass validation with images array', () => {
      // Arrange
      const imagesData = {
        ...validData,
        images: ['image1.jpg', 'image2.jpg']
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(imagesData)).not.toThrow();
    });

    it('should pass validation with job_complete status', () => {
      // Arrange
      const completionData = {
        ...validData,
        job_complete: true
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(completionData)).not.toThrow();
    });

    it('should pass validation with success status', () => {
      // Arrange
      const successData = {
        ...validData,
        success: true
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(successData)).not.toThrow();
    });
  });

  describe('multiple validation errors', () => {
    it('should collect multiple validation errors', () => {
      // Arrange
      const invalidData = {
        job_id: null,
        partner_params: 'not an object',
        ResultCode: null,
        ResultText: null,
        Images: [],
        images: [],
        job_complete: undefined,
        success: undefined
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(invalidData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'job_id', message: 'Job ID is required' },
            { field: 'partner_params', message: 'Partner parameters must be an object' },
            { field: 'result_code', message: 'Result code is required (ResultCode or result_code)' },
            { field: 'result_text', message: 'Result text is required (ResultText or result_text)' },
            { field: 'verification_data', message: 'Verification result must include either: (1) Images array with at least one image, OR (2) job_complete: true/false, OR (3) success: true/false. Currently missing all three.' }
          ]
        }));
    });

    it('should collect all validation errors for empty data', () => {
      // Arrange
      const emptyData = {};

      // Act & Assert
      expect(() => validateSmileIdCallbackData(emptyData))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(emptyData))
        .toThrow(expect.objectContaining({
          errors: [
            { field: 'job_id', message: 'Job ID is required' },
            { field: 'partner_params', message: 'Partner parameters are required' },
            { field: 'result_code', message: 'Result code is required (ResultCode or result_code)' },
            { field: 'result_text', message: 'Result text is required (ResultText or result_text)' },
            { field: 'verification_data', message: 'Verification result must include either: (1) Images array with at least one image, OR (2) job_complete: true/false, OR (3) success: true/false. Currently missing all three.' }
          ]
        }));
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data', () => {
      // Act & Assert
      expect(() => validateSmileIdCallbackData(undefined))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(undefined))
        .toThrow(expect.objectContaining({
          errors: [{ field: 'data', message: 'Callback data is required' }]
        }));
    });

    it('should handle null data', () => {
      // Act & Assert
      expect(() => validateSmileIdCallbackData(null))
        .toThrow(ValidationError);

      expect(() => validateSmileIdCallbackData(null))
        .toThrow(expect.objectContaining({
          errors: [{ field: 'data', message: 'Callback data is required' }]
        }));
    });

    it('should handle data with extra properties', () => {
      // Arrange
      const dataWithExtra = {
        ...validData,
        extra_field: 'extra_value',
        nested_extra: {
          value: 'test'
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(dataWithExtra)).not.toThrow();
    });

    it('should handle callback with all valid properties', () => {
      // Arrange
      const completeData = {
        job_id: 'job_123456789',
        user_id: 'user_123456789',
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business'
        },
        ResultCode: '1012',
        result_code: '1012',
        ResultText: 'Success',
        result_text: 'Success',
        job_complete: true,
        success: true,
        Images: ['image1.jpg', 'image2.jpg'],
        images: ['image1.jpg', 'image2.jpg']
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(completeData)).not.toThrow();
    });

    it('should handle callback with complex nested partner_params', () => {
      // Arrange
      const complexData = {
        ...validData,
        partner_params: {
          seller_id: '507f1f77bcf86cd799439011',
          account_type: 'business',
          custom_field: 'custom_value',
          nested: {
            value: 'test'
          }
        }
      };

      // Act & Assert
      expect(() => validateSmileIdCallbackData(complexData)).not.toThrow();
    });
  });
});
