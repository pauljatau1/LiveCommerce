const registerService = require('../services/register.service');
const loginService = require('../services/login.service');
const checkTokenService = require('../services/checkToken.service');
const resendOTPService = require('../services/resendOTP.service');
const getProfileService = require('../services/getProfile.service');
const selectAccountTypeService = require('../services/selectAccountType.service');
const addBankDetailsService = require('../services/addBankDetails.service');
const uploadCompanyVerificationService = require('../services/uploadCompanyVerification.service');
const uploadIndividualVerificationService = require('../services/uploadIndividualVerification.service');

/**
 * Register a seller user.
 *
 * This controller handles the registration HTTP request.
 * It delegates the registration logic to the service layer, and sends a success response.
 *
 * @param {Request} req - Express request object containing the seller's registration data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function register(req, res, next) {
  try {
    // Extract registration data from request body
    const registrationData = req.body;

    // Call the service layer to handle seller registration logic
    const response = await registerService.register(registrationData);

    // Send a 201 Created response with success message and seller data
    res.success(response, 'Seller registered successfully', 201);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Login a seller user.
 *
 * This controller handles the login HTTP request.
 * It delegates the authentication logic to the service layer, and sends a success response.
 *
 * @param {Request} req - Express request object containing the seller's login credentials in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function login(req, res, next) {
  try {
    // Extract login credentials from request body
    const loginData = req.body;

    // Call the service layer to handle seller authentication
    const response = await loginService.login(loginData);

    // Send success response with user data and token
    res.success(response, 'Login successful');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Check and validate JWT token for seller authentication.
 *
 * This controller handles the token validation HTTP request.
 * It delegates the token validation logic to the service layer and returns a new token.
 *
 * @param {Request} req - Express request object containing the token in `req.headers.authorization`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function checkToken(req, res, next) {
  try {
    // Extract token from authorization header
    const token = req.headers['authorization']?.split(' ')[1];
    
    // Call the service layer to handle token validation logic
    const response = await checkTokenService.checkToken(token);

    // Send success response with new token
    res.success(response, 'Token renewed successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Resend OTP to seller's email for verification.
 *
 * This controller handles the OTP resend HTTP request.
 * It delegates the OTP resend logic to the service layer and returns a success response.
 *
 * @param {Request} req - Express request object containing the seller's email in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function resendOTP(req, res, next) {
  try {
    // Extract email from request body
    const { email } = req.body;

    // Call the service layer to handle OTP resend logic
    const response = await resendOTPService.resendOTP(email);

    // Send success response
    res.success(response, 'OTP resent successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get seller profile information.
 *
 * This controller handles the profile retrieval HTTP request.
 * It delegates the profile logic to the service layer and returns the enhanced profile data.
 *
 * @param {Request} req - Express request object containing the seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getProfile(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Call the service layer to handle profile retrieval logic
    const response = await getProfileService.getProfile(sellerId);

    // Send success response with profile data
    res.success(response, 'Profile retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Select account type for a seller.
 *
 * This controller handles the account type selection HTTP request.
 * It delegates the account type selection logic to the service layer,
 * and sends a success response with the updated seller data.
 *
 * @param {Request} req - Express request object containing the account type in `req.body` and seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function selectAccountType(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Extract account type data from request body
    const accountTypeData = req.body;

    // Call the service layer to handle account type selection logic
    const response = await selectAccountTypeService.selectAccountType(sellerId, accountTypeData);

    // Send success response with exact same structure as original function in data object
    // Original: { message: 'Account type selected successfully', seller: updatedSeller }
    // New v2: { success: true, message: 'Account type selected successfully', data: { message: 'Account type selected successfully', seller: updatedSeller }, pagination: null }
    res.success({ 
      message: 'Account type selected successfully', 
      seller: response 
    }, 'Account type selected successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Add bank details to a seller's account.
 *
 * This controller handles the bank details addition HTTP request.
 * It delegates the bank details logic to the service layer,
 * and sends a success response with the updated seller data.
 *
 * @param {Request} req - Express request object containing the bank details in `req.body` and seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function addBankDetails(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Extract bank details from request body
    const { bankDetails } = req.body;

    // Call the service layer to handle bank details addition logic
    const response = await addBankDetailsService.addBankDetails(sellerId, bankDetails);

    // Send success response with exact same structure as original function in data object
    // Original: { message: 'Bank details added successfully', seller: updatedSeller }
    // New v2: { success: true, message: 'Bank details added successfully', data: { message: 'Bank details added successfully', seller: updatedSeller }, pagination: null }
    res.success({ 
      message: 'Bank details added successfully', 
      seller: response 
    }, 'Bank details added successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Upload company verification documents for a seller.
 *
 * This controller handles the company verification document upload HTTP request.
 * It delegates the document upload logic to the service layer,
 * and sends a success response with the updated seller data.
 *
 * @param {Request} req - Express request object containing the uploaded files in `req.files` and seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadCompanyVerification(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Extract uploaded files from request
    const files = req.files;

    // Call the service layer to handle company verification document upload logic
    const response = await uploadCompanyVerificationService.uploadCompanyVerification(sellerId, files);

    // Send success response with exact same structure as original function in data object
    // Original: { message: 'Company verification documents uploaded successfully', documents: seller.verificationDocuments }
    // New v2: { success: true, message: 'Company verification documents uploaded successfully', data: { message: 'Company verification documents uploaded successfully', documents: seller.verificationDocuments }, pagination: null }
    res.success({ 
      message: 'Company verification documents uploaded successfully', 
      documents: response.verificationDocuments 
    }, 'Company verification documents uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Upload individual verification documents for a seller.
 *
 * This controller handles the individual verification document upload HTTP request.
 * It delegates the document upload logic to the service layer,
 * and sends a success response with the updated seller data.
 *
 * @param {Request} req - Express request object containing the uploaded files in `req.files` and seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadIndividualVerification(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Extract uploaded files from request
    const files = req.files;

    // Call the service layer to handle individual verification document upload logic
    const response = await uploadIndividualVerificationService.uploadIndividualVerification(sellerId, files);

    // Send success response with exact same structure as original function in data object
    // Original: { message: 'Individual verification documents uploaded successfully', documents: seller.verificationDocuments }
    // New v2: { success: true, message: 'Individual verification documents uploaded successfully', data: { message: 'Individual verification documents uploaded successfully', documents: seller.verificationDocuments }, pagination: null }
    res.success({ 
      message: 'Individual verification documents uploaded successfully', 
      documents: response.verificationDocuments 
    }, 'Individual verification documents uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

module.exports = {
  register,
  login,
  checkToken,
  resendOTP,
  getProfile,
  selectAccountType,
  addBankDetails,
  uploadCompanyVerification,
  uploadIndividualVerification
};
