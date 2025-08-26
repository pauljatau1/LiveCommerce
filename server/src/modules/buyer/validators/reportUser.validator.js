/**
 * Report User Validator
 *
 * This validator handles input validation for user reporting functionality.
 * It provides comprehensive validation for the complete user reporting process,
 * ensuring data integrity, security, and proper business logic enforcement.
 *
 * The validator ensures that:
 * - All input data is properly formatted and validated
 * - User IDs are valid MongoDB ObjectId format
 * - Both reporter and reported user exist in the system
 * - Self-reporting is prevented
 * - Report content meets length and format requirements
 * - User types are valid and supported
 * - All validation errors are collected and reported together
 *
 * Validation Features:
 * - MongoDB ObjectId format validation
 * - User existence verification against database
 * - Self-reporting prevention
 * - Content length and format validation
 * - User type validation
 * - Comprehensive error collection
 *
 * Security Considerations:
 * - Prevents self-reporting attacks
 * - Validates user existence before processing
 * - Ensures proper data types and formats
 * - Maintains data integrity throughout validation
 *
 * @module reportUserValidator
 */

// External dependencies
const mongoose = require('mongoose');

// Internal dependencies - utilities and repositories
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

// Import models for user validation
const Seller = require('../../../models/Seller');

/**
 * Validates buyer ID format and adds any validation errors to the errors array.
 * 
 * This function performs basic format validation for buyer IDs, ensuring they
 * are provided and follow the MongoDB ObjectId format.
 *
 * Validation Checks:
 * - Buyer ID is provided (not null/undefined/empty)
 * - Buyer ID follows MongoDB ObjectId format
 * - Uses mongoose validation for format checking
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBuyerIdFormat(buyerId, errors) {
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
}

/**
 * Validates user ID format and adds any validation errors to the errors array.
 * 
 * This function performs basic format validation for user IDs, ensuring they
 * are provided and follow the MongoDB ObjectId format.
 *
 * Validation Checks:
 * - User ID is provided (not null/undefined/empty)
 * - User ID follows MongoDB ObjectId format
 * - Uses mongoose validation for format checking
 *
 * @param {string} userId - The user ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUserIdFormat(userId, errors) {
  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push({ field: 'userId', message: 'Invalid user ID format' });
  }
}

/**
 * Validates the buyer ID format and existence.
 * 
 * This function checks if the reporter (buyer) exists in the system.
 * It performs both format validation and database existence verification.
 *
 * Validation Flow:
 * 1. Validates buyer ID format using mongoose
 * 2. If format is valid, checks existence in database
 * 3. Stops validation early if format is invalid
 *
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
async function validateBuyerId(buyerId, errors) {
  // Step 1: Validate format first
  validateBuyerIdFormat(buyerId, errors);
  if (errors.length > 0) {
    return;
  }
  
  // Step 2: Check if buyer exists
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
  }
}

/**
 * Validates the reported user ID format and existence.
 * 
 * This function checks if the reported user exists based on userType.
 * It supports validation for both buyer and seller user types.
 *
 * Validation Flow:
 * 1. Validates user ID format using mongoose
 * 2. If format is valid, checks existence based on userType
 * 3. Uses repository method for type-specific user lookup
 * 4. Stops validation early if format is invalid
 *
 * @param {string} userId - The reported user ID to validate
 * @param {string} userType - The type of user ('buyer' or 'seller')
 * @param {Array} errors - Array to collect validation errors
 */
async function validateReportedUser(userId, userType, errors) {
  // Step 1: Validate format first
  validateUserIdFormat(userId, errors);
  if (errors.length > 0) {
    return;
  }
  
  // Step 2: Find the reported user based on userType using repository
  const reportedUser = await buyerRepository.findUserById(userId, userType);
  if (!reportedUser) {
    errors.push({ field: 'userId', message: 'Reported user not found' });
  }
}

/**
 * Validates userType field and adds any validation errors to the errors array.
 * 
 * This function ensures the userType is valid and supported by the system.
 * It checks for required field, data type, and allowed values.
 *
 * Validation Checks:
 * - UserType is provided (not null/undefined/empty)
 * - UserType is a string data type
 * - UserType is one of the allowed values ('buyer', 'seller')
 * - Case-insensitive comparison for user convenience
 *
 * Allowed User Types:
 * - 'buyer': Regular buyer accounts
 * - 'seller': Seller accounts
 *
 * @param {string} userType - The user type to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUserType(userType, errors) {
  if (!userType) {
    errors.push({ field: 'userType', message: 'User type is required' });
  } else if (typeof userType !== 'string') {
    errors.push({ field: 'userType', message: 'User type must be a string' });
  } else {
    const allowedTypes = ['buyer', 'seller'];
    if (!allowedTypes.includes(userType.toLowerCase())) {
      errors.push({ field: 'userType', message: 'User type must be either "buyer" or "seller"' });
    }
  }
}

/**
 * Validates reason field and adds any validation errors to the errors array.
 * 
 * This function ensures the report reason meets content and length requirements.
 * It validates the reason field for proper reporting functionality.
 *
 * Validation Checks:
 * - Reason is provided (not null/undefined/empty)
 * - Reason is a string data type
 * - Reason is at least 3 characters long (after trimming)
 * - Reason does not exceed 100 characters (after trimming)
 * - Trims whitespace for accurate length calculation
 *
 * Content Requirements:
 * - Minimum 3 characters for meaningful reason
 * - Maximum 100 characters for concise reporting
 * - String type for proper data handling
 *
 * @param {string} reason - The reason to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateReason(reason, errors) {
  if (!reason) {
    errors.push({ field: 'reason', message: 'Reason is required' });
  } else if (typeof reason !== 'string') {
    errors.push({ field: 'reason', message: 'Reason must be a string' });
  } else if (reason.trim().length < 3) {
    errors.push({ field: 'reason', message: 'Reason must be at least 3 characters long' });
  } else if (reason.trim().length > 100) {
    errors.push({ field: 'reason', message: 'Reason must not exceed 100 characters' });
  }
}

/**
 * Validates description field and adds any validation errors to the errors array.
 * 
 * This function ensures the report description meets content and length requirements.
 * It validates the description field for comprehensive reporting functionality.
 *
 * Validation Checks:
 * - Description is provided (not null/undefined/empty)
 * - Description is a string data type
 * - Description is at least 10 characters long (after trimming)
 * - Description does not exceed 500 characters (after trimming)
 * - Trims whitespace for accurate length calculation
 *
 * Content Requirements:
 * - Minimum 10 characters for detailed description
 * - Maximum 500 characters for manageable reports
 * - String type for proper data handling
 * - Allows for comprehensive incident reporting
 *
 * @param {string} description - The description to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateDescription(description, errors) {
  if (!description) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  } else if (description.trim().length < 10) {
    errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
  } else if (description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
  }
}

/**
 * Validates userId field and adds any validation errors to the errors array.
 * 
 * This function performs comprehensive validation for user IDs in report data.
 * It ensures proper format and data type for user identification.
 *
 * Validation Checks:
 * - User ID is provided (not null/undefined/empty)
 * - User ID is a string data type
 * - User ID follows MongoDB ObjectId format
 * - Uses mongoose validation for format checking
 *
 * @param {string} userId - The user ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUserId(userId, errors) {
  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (typeof userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push({ field: 'userId', message: 'Invalid user ID format' });
  }
}

/**
 * Validates basic fields in the report data and adds any validation errors to the errors array.
 * 
 * This function orchestrates validation for all basic report fields.
 * It calls individual validation functions for each field to ensure comprehensive validation.
 *
 * Fields Validated:
 * - userId: User being reported
 * - userType: Type of user being reported
 * - reason: Reason for the report
 * - description: Detailed description of the report
 *
 * @param {Object} reportData - The report data to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBasicFields(reportData, errors) {
  validateUserId(reportData.userId, errors);
  validateUserType(reportData.userType, errors);
  validateReason(reportData.reason, errors);
  validateDescription(reportData.description, errors);
}

/**
 * Validates that a user is not reporting themselves and adds any validation errors to the errors array.
 * 
 * This function prevents self-reporting by comparing the reporter ID with the reported user ID.
 * It's a critical security measure to prevent abuse of the reporting system.
 *
 * Security Feature:
 * - Prevents users from reporting themselves
 * - Stops potential abuse of reporting system
 * - Ensures reporting integrity
 * - Provides clear error message for self-reports
 *
 * @param {string} reporterId - The ID of the user making the report
 * @param {string} reportedUserId - The ID of the user being reported
 * @param {string} userType - The type of user being reported
 * @param {Array} errors - Array to collect validation errors
 */
function validateSelfReport(reporterId, reportedUserId, userType, errors) {
  if (reporterId === reportedUserId) {
    errors.push({ 
      field: 'userId', 
      message: 'You cannot report yourself' 
    });
  }
}

/**
 * Validates the complete report user data - Main validation function.
 *
 * This is the primary validation function that orchestrates all validation steps
 * for reporting a user. It ensures comprehensive validation before allowing
 * the reporting process to proceed.
 *
 * Validation Process:
 * 1. Validates basic fields (userId, userType, reason, description)
 * 2. Validates self-reporting prevention
 * 3. If basic validation passes, validates user existence
 * 4. Collects all validation errors and throws ValidationError if any exist
 *
 * Validation Strategy:
 * - Performs format validation first (fast, no database calls)
 * - Validates business logic (self-reporting prevention)
 * - Performs existence validation last (requires database calls)
 * - Stops validation early if format validation fails
 * - Collects all errors before throwing exception
 *
 * Error Handling:
 * - Collects all validation errors in a single array
 * - Throws ValidationError with all errors at once
 * - Provides comprehensive feedback to users
 * - Maintains validation efficiency
 *
 * @param {string} reporterId - The ID of the user making the report
 * @param {Object} reportData - The report data object
 * @param {string} reportData.userId - The ID of the user being reported
 * @param {string} reportData.userType - The type of user being reported ('buyer' or 'seller')
 * @param {string} reportData.reason - The reason for the report
 * @param {string} reportData.description - The detailed description of the report
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid report data
 * await validateReportUserData('507f1f77bcf86cd799439011', {
 *   userId: '507f1f77bcf86cd799439012',
 *   userType: 'seller',
 *   reason: 'Inappropriate behavior',
 *   description: 'User sent offensive messages in chat'
 * });
 * // No error thrown
 *
 * @example
 * // Invalid report data - self-reporting
 * try {
 *   await validateReportUserData('507f1f77bcf86cd799439011', {
 *     userId: '507f1f77bcf86cd799439011', // Same as reporterId
 *     userType: 'buyer',
 *     reason: 'Test',
 *     description: 'Test description'
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 */
async function validateReportUserData(reporterId, reportData) {
  const errors = [];

  // Step 1: Validate basic fields
  // This includes format validation for all required fields
  validateBasicFields(reportData, errors);
  
  // Step 2: Validate self-report
  // This prevents users from reporting themselves
  validateSelfReport(reporterId, reportData.userId, reportData.userType, errors);

  // Step 3: If basic validation passes, validate existence
  // Only perform database operations if format validation succeeds
  if (errors.length === 0) {
    // Step 3a: Validate reporter (buyer) exists
    await validateBuyerId(reporterId, errors);
    
    // Step 3b: Validate reported user exists
    await validateReportedUser(reportData.userId, reportData.userType, errors);
  }

  // Step 4: Throw ValidationError if any validation failed
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateReportUserData
};