// External dependencies
const mongoose = require('mongoose');

// Internal dependencies - utilities and repositories
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

// Import models for user validation
const Seller = require('../../../models/Seller');

/**
 * Validates buyer ID format and returns any validation errors.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateBuyerIdFormat(buyerId) {
  const errors = [];
  
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
  
  return errors;
}

/**
 * Validates user ID format and returns any validation errors.
 * 
 * @param {string} userId - The user ID to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateUserIdFormat(userId) {
  const errors = [];
  
  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push({ field: 'userId', message: 'Invalid user ID format' });
  }
  
  return errors;
}

/**
 * Finds a user by ID based on userType.
 * 
 * @param {string} userId - The user ID to find
 * @param {string} userType - The type of user ('buyer' or 'seller')
 * @returns {Promise<Object|null>} The found user or null
 */
async function findUserById(userId, userType) {
  if (userType === 'seller') {
    return await Seller.findById(userId);
  } else if (userType === 'buyer') {
    return await buyerRepository.findById(userId);
  }
  return null;
}

/**
 * Validates the buyer ID format and existence in the database.
 * This function ensures that the reporting buyer exists and is valid.
 * 
 * @param {string} buyerId - The buyer ID to validate (should be a valid ObjectId string)
 * @returns {Promise<Object>} The buyer object if validation passes
 * @throws {ValidationError} If buyer ID is invalid or buyer doesn't exist
 */
async function validateBuyerId(buyerId) {
  // Validate format first
  const formatErrors = validateBuyerIdFormat(buyerId);
  if (formatErrors.length > 0) {
    throw new ValidationError(formatErrors);
  }
  
  // Check if buyer exists
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    throw new ValidationError([{ field: 'buyerId', message: 'Buyer not found' }]);
  }
  
  return buyer;
}

/**
 * Validates the reported user ID format and existence.
 * This function checks if the reported user exists based on userType.
 * 
 * @param {string} userId - The reported user ID to validate
 * @param {string} userType - The type of user ('buyer' or 'seller')
 * @returns {Promise<Object>} The reported user object if validation passes
 * @throws {ValidationError} If user ID is invalid or user doesn't exist
 */
async function validateReportedUser(userId, userType) {
  // Validate format first
  const formatErrors = validateUserIdFormat(userId);
  if (formatErrors.length > 0) {
    throw new ValidationError(formatErrors);
  }
  
  // Find the reported user based on userType
  const reportedUser = await findUserById(userId, userType);
  if (!reportedUser) {
    throw new ValidationError([{ field: 'userId', message: 'Reported user not found' }]);
  }
  
  return reportedUser;
}



/**
 * Validates userType field and returns any validation errors.
 * 
 * @param {string} userType - The user type to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateUserType(userType) {
  const errors = [];
  
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
  
  return errors;
}

/**
 * Validates reason field and returns any validation errors.
 * 
 * @param {string} reason - The reason to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateReason(reason) {
  const errors = [];
  
  if (!reason) {
    errors.push({ field: 'reason', message: 'Reason is required' });
  } else if (typeof reason !== 'string') {
    errors.push({ field: 'reason', message: 'Reason must be a string' });
  } else if (reason.trim().length < 3) {
    errors.push({ field: 'reason', message: 'Reason must be at least 3 characters long' });
  } else if (reason.trim().length > 100) {
    errors.push({ field: 'reason', message: 'Reason must not exceed 100 characters' });
  }
  
  return errors;
}

/**
 * Validates description field and returns any validation errors.
 * 
 * @param {string} description - The description to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateDescription(description) {
  const errors = [];
  
  if (!description) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  } else if (description.trim().length < 10) {
    errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
  } else if (description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
  }
  
  return errors;
}

/**
 * Validates userId field and returns any validation errors.
 * 
 * @param {string} userId - The user ID to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateUserId(userId) {
  const errors = [];
  
  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push({ field: 'userId', message: 'Invalid user ID format' });
  }
  
  return errors;
}

/**
 * Validates basic input fields and returns any validation errors.
 * This function orchestrates validation of userType, reason, description, and userId.
 * 
 * @param {Object} reportData - The report data object
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateBasicFields(reportData) {
  const { userId, userType, reason, description } = reportData;
  
  // Collect validation errors from each field
  const userTypeErrors = validateUserType(userType);
  const reasonErrors = validateReason(reason);
  const descriptionErrors = validateDescription(description);
  const userIdErrors = validateUserId(userId);
  
  // Combine all errors
  return [...userTypeErrors, ...reasonErrors, ...descriptionErrors, ...userIdErrors];
}

/**
 * Validates self-report prevention.
 * 
 * @param {string} reporterId - The ID of the reporter
 * @param {string} reportedUserId - The ID of the reported user
 * @param {string} userType - The type of user being reported
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateSelfReport(reporterId, reportedUserId, userType) {
  const errors = [];
  
  // Check if user is trying to report themselves when userType is buyer
  if (userType === 'buyer' && reporterId === reportedUserId) {
    errors.push({ field: 'userId', message: 'You cannot report yourself' });
  }
  
  return errors;
}

/**
 * Validates the complete report user request data.
 * This is the main validation function that orchestrates all validation steps:
 * 1. Input field validation (userType, reason, description)
 * 2. Reporter validation (buyer exists)
 * 3. Reported user validation (user exists)
 * 4. Self-report prevention
 * 
 * @param {string} reporterId - The ID of the buyer making the report
 * @param {Object} reportData - The report data object
 * @param {string} reportData.userId - The ID of the user being reported
 * @param {string} reportData.userType - The type of user being reported
 * @param {string} reportData.reason - The reason for the report
 * @param {string} reportData.description - The detailed description of the report
 * @returns {Promise<Object>} Object containing validated reporter and reported user
 * @throws {ValidationError} If any validation step fails
 */
async function validateReportUserData(reporterId, reportData) {
  // Step 1: Validate basic input fields
  const basicErrors = validateBasicFields(reportData);
  
  // Step 2: Validate self-report prevention
  const selfReportErrors = validateSelfReport(reporterId, reportData.userId, reportData.userType);
  
  // Combine all validation errors
  const allErrors = [...basicErrors, ...selfReportErrors];
  
  // If there are validation errors, throw them now before database calls
  if (allErrors.length > 0) {
    throw new ValidationError(allErrors);
  }
  
  // Step 3: Validate reporter (buyer) exists and is accessible
  const reporter = await validateBuyerId(reporterId);
  
  // Step 4: Validate reported user exists based on userType
  const reportedUser = await validateReportedUser(reportData.userId, reportData.userType);
  
  // Return validated objects for use in service layer
  return {
    reporter,
    reportedUser
  };
}

module.exports = {
  validateReportUserData
};