const registerService = require('../services/register.service');
const loginService = require('../services/login.service');
const googleAuthService = require('../services/googleAuth.service');
const checkTokenService = require('../services/checkToken.service');
const resendOTPService = require('../services/resendOTP.service');
const getProfileService = require('../services/getProfile.service');
const selectAccountTypeService = require('../services/selectAccountType.service');
const completeProfileService = require('../services/completeProfile.service');
const addBankDetailsService = require('../services/addBankDetails.service');
const uploadCompanyVerificationService = require('../services/uploadCompanyVerification.service');
const uploadIndividualVerificationService = require('../services/uploadIndividualVerification.service');
const generateSmileIdTokenService = require('../services/generateSmileIdToken.service');
const processSmileIdJobService = require('../services/processSmileIdJob.service');
const saveIndividualSmileIdVerificationService = require('../services/saveIndividualSmileIdVerification.service');
const saveBusinessSmileIdVerificationService = require('../services/saveBusinessSmileIdVerification.service');
const smileIdCallbackService = require('../services/smileIdCallback.service');
const addBusinessDetailsService = require('../services/addBusinessDetails.service');
const addBusinessInformationService = require('../services/addBusinessInformation.service');
const addShippingWarehouseService = require('../services/addShippingWarehouse.service');
const uploadStoreAvatarService = require('../services/uploadStoreAvatar.service');
const uploadStoreBannerService = require('../services/uploadStoreBanner.service');
const deleteStoreAvatarService = require('../services/deleteStoreAvatar.service');
const verifyOTPService = require('../services/verifyOTP.service');
const selectCategoriesService = require('../services/selectCategories.service');
const updateCategoriesService = require('../services/updateCategories.service');
const getTopProductsService = require('../services/getTopProducts.service');
const getStatisticsService = require('../services/getStatistics.service');
const getOrdersService = require('../services/getOrders.service');
const getShippingLabelService = require('../services/getShippingLabel.service');
const sendPhoneVerificationService = require('../services/sendPhoneVerification.service');
const verifyPhoneService = require('../services/verifyPhone.service');
const bankService = require('../../../services/bankService');

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
 * Authenticate seller using Google OAuth.
 *
 * This controller handles Google OAuth authentication HTTP requests.
 * It delegates the Google OAuth authentication logic to the service layer,
 * and sends a success response with user data and JWT token.
 *
 * The controller processes Google ID tokens from the frontend and:
 * - Verifies the token with Google's servers
 * - Creates new seller accounts or links to existing ones
 * - Generates application JWT tokens for session management
 * - Returns authenticated user data
 *
 * @param {Request} req - Express request object containing Google ID token in `req.body.token`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function googleAuth(req, res, next) {
  try {
    // Extract Google ID token from request body
    const googleAuthData = req.body;

    // Call the service layer to handle Google OAuth authentication
    const response = await googleAuthService.authenticateWithGoogle(googleAuthData);

    // Send success response with user data and token
    res.success(response, 'Google authentication successful');
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
 * Complete seller profile by adding phone number and store name.
 *
 * This controller handles the profile completion HTTP request for sellers
 * who registered via Google OAuth and need to add missing required information.
 * It validates the input data and updates the seller's profile with phone number
 * and store name information.
 *
 * Business Logic:
 * - Validates phone number format and store name requirements
 * - Updates seller profile with provided information
 * - Returns updated seller data
 * - Handles validation errors gracefully
 *
 * @param {Request} req - Express request object containing:
 *   - req.user.id: Seller ID from JWT token
 *   - req.body.phoneNumber: Phone number to add
 *   - req.body.storeName: Store name to add
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function completeProfile(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Extract profile completion data from request body
    const { phoneNumber, storeName } = req.body;

    // Validate required fields
    if (!phoneNumber || !storeName) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: !phoneNumber ? 'phoneNumber' : 'storeName',
            message: `${!phoneNumber ? 'Phone number' : 'Store name'} is required`
          }
        ]
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'phoneNumber',
            message: 'Please enter a valid phone number'
          }
        ]
      });
    }

    // Validate store name length
    if (storeName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'storeName',
            message: 'Store name must be at least 2 characters long'
          }
        ]
      });
    }

    // Call the service layer to handle profile completion logic
    const response = await completeProfileService.completeProfile(sellerId, {
      phoneNumber: phoneNumber.trim(),
      storeName: storeName.trim()
    });

    // Send success response
    res.success({ 
      message: 'Profile completed successfully', 
      seller: response 
    }, 'Profile completed successfully');
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

    // Extract bank details and verification status from request body
    const { bankDetails, isVerified } = req.body;

    // Call the service layer to handle bank details addition logic
    // Pass isVerified flag to indicate if Paystack verification was successful
    const response = await addBankDetailsService.addBankDetails(sellerId, bankDetails, isVerified);

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

/**
 * Generate SmileID token for seller verification.
 *
 * This controller handles the SmileID token generation HTTP request.
 * It delegates the token generation logic to the service layer,
 * and sends a success response with the token data.
 *
 * @param {Request} req - Express request object containing the token generation data in `req.body` and seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function generateSmileIdToken(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Extract token generation data from request body
    const tokenData = req.body;

    // Call the service layer to handle SmileID token generation logic
    const response = await generateSmileIdTokenService.generateSmileIdToken(tokenData, sellerId);

    // Send success response with exact same structure as original function in data object
    // Original: { token: result.token, expiresAt: '...', userId: '...', jobId: '...', product: '...', accountType: '...', idType: '...', success: true }
    // New v2: { success: true, message: 'SmileID token generated successfully', data: { token: '...', expiresAt: '...', ... }, pagination: null }
    res.success(response, 'SmileID token generated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Process SmileID job for seller verification.
 *
 * This controller handles the SmileID job processing HTTP request.
 * It delegates the job processing logic to the service layer, and sends a success response.
 *
 * @param {Request} req - Express request object containing the job processing data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function processSmileIdJob(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;
    
    // Extract job processing data from request body
    const jobData = req.body;

    // Call the service layer to handle SmileID job processing logic
    const response = await processSmileIdJobService.processSmileIdJob(jobData, sellerId);

    // Send success response with exact same structure as original function in data object
    // Original: { success: true, jobId: '...', result: {...} }
    // New v2: { success: true, message: 'SmileID job processed successfully', data: { success: true, jobId: '...', result: {...} }, pagination: null }
    res.success(response, 'SmileID job processed successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Save individual SmileID verification result.
 *
 * This controller handles the individual SmileID verification result saving HTTP request.
 * It delegates the verification saving logic to the service layer and sends a success response.
 *
 * @param {Request} req - Express request object containing the verification data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function saveIndividualSmileIdVerification(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;
    
    // Extract verification data from request body
    const verificationData = req.body;

    // Call the service layer to handle individual SmileID verification saving logic
    const response = await saveIndividualSmileIdVerificationService.saveIndividualSmileIdVerification(verificationData, sellerId);

    // Send success response with exact same structure as original function in data object
    // Original: { message: '...', verification: {...}, actuallySuccessful: true/false }
    // New v2: { success: true, message: 'Individual SmileID verification result saved successfully', data: { message: '...', verification: {...}, actuallySuccessful: true/false }, pagination: null }
    res.success(response, 'Individual SmileID verification result saved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Save business SmileID verification result.
 *
 * This controller handles the business SmileID verification result saving HTTP request.
 * It delegates the verification saving logic to the service layer and sends a success response.
 *
 * @param {Request} req - Express request object containing the verification data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function saveBusinessSmileIdVerification(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;
    
    // Extract verification data from request body
    const verificationData = req.body;

    // Call the service layer to handle business SmileID verification saving logic
    const response = await saveBusinessSmileIdVerificationService.saveBusinessSmileIdVerification(verificationData, sellerId);

    // Send success response with exact same structure as original function in data object
    // Original: { message: 'Business SmileID verification result saved successfully', verification: {...}, actuallySuccessful: true/false }
    // New v2: { success: true, message: 'Business SmileID verification result saved successfully', data: { message: 'Business SmileID verification result saved successfully', verification: {...}, actuallySuccessful: true/false }, pagination: null }
    res.success(response, 'Business SmileID verification result saved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Handle SmileID verification callback.
 *
 * This controller handles webhook callbacks from SmileID verification service.
 * It delegates the callback processing logic to the service layer and sends
 * appropriate responses to SmileID.
 *
 * @param {Request} req - Express request object containing the verification callback data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function smileIdCallback(req, res, next) {
  try {
    // Extract verification callback data from request body
    const verificationResult = req.body;

    // Call the service layer to handle SmileID callback processing logic
    const response = await smileIdCallbackService.processSmileIdCallback(verificationResult);

    // Send success response with exact same structure as original function
    // Original: { message: 'Callback received successfully', job_id: ..., processed: true, assessment: {...} }
    // New v2: { success: true, message: 'Callback received successfully', data: { message: 'Callback received successfully', job_id: ..., processed: true, assessment: {...} }, pagination: null }
    res.success(response, 'Callback received successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Add business details to seller profile.
 *
 * This controller handles the HTTP request for adding business details
 * to a seller's profile. It delegates the business logic to the service
 * layer and sends appropriate responses.
 *
 * @param {Request} req - Express request object containing the business details in `req.body` and seller ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function addBusinessDetails(req, res, next) {
  try {
    // Extract business details from request body
    const businessDetails = req.body;
    const sellerId = req.user.id;

    // Call the service layer to handle business details addition logic
    const response = await addBusinessDetailsService.addBusinessDetails(sellerId, businessDetails);

    // Send success response with exact same structure as original function
    // Original: { message: 'Business details added successfully', seller: updatedSeller }
    // New v2: { success: true, message: 'Business details added successfully', data: { message: 'Business details added successfully', seller: updatedSeller }, pagination: null }
    res.success(response, 'Business details added successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Add business information to seller profile.
 *
 * This controller handles the business information addition HTTP request.
 * It delegates the business information addition logic to the service layer,
 * and sends a success response with the same structure as the original API.
 *
 * Business Information includes:
 * - businessEmail: The seller's business email address
 * - businessNumber: The seller's business phone number
 * - businessAddress: The seller's business address details
 *
 * The response maintains the same structure as the original API to ensure
 * compatibility with existing frontend implementations.
 *
 * @param {Request} req - Express request object containing the business information in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function addBusinessInformation(req, res, next) {
  try {
    // Extract business information from request body
    const businessInformation = req.body;
    const sellerId = req.user.id;

    // Call the service layer to handle business information addition logic
    const response = await addBusinessInformationService.addBusinessInformation(sellerId, businessInformation);

    // Send success response with exact same structure as original function
    // Original: { success: true, message: 'Business information added successfully', seller: updatedSeller }
    // New v2: { success: true, message: 'Business information added successfully', data: { message: 'Business information added successfully', seller: updatedSeller }, pagination: null }
    res.success(response, 'Business information added successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Add shipping and warehouse information to seller profile.
 *
 * This controller handles the shipping and warehouse information addition HTTP request.
 * It delegates the shipping and warehouse information addition logic to the service layer,
 * and sends a success response with the same structure as the original API.
 *
 * Shipping and Warehouse Information includes:
 * - shippingOptions: The seller's shipping options (shippingMethod, returnsAndExchangePolicy)
 * - warehouseDetails: The seller's warehouse details (name, contactNumber, address)
 *
 * The response maintains the same structure as the original API to ensure
 * compatibility with existing frontend implementations.
 *
 * @param {Request} req - Express request object containing the shipping and warehouse information in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function addShippingWarehouse(req, res, next) {
  try {
    // Extract shipping and warehouse information from request body
    const shippingWarehouseData = req.body;
    const sellerId = req.user.id;

    // Call the service layer to handle shipping and warehouse information addition logic
    const response = await addShippingWarehouseService.addShippingWarehouse(sellerId, shippingWarehouseData);

    // Send success response with exact same structure as original function
    // Original: { message: 'Shipping and warehouse information added successfully', seller: { shippingOptions, warehouseDetails } }
    // New v2: { success: true, message: 'Shipping and warehouse information added successfully', data: { message: 'Shipping and warehouse information added successfully', seller: { shippingOptions, warehouseDetails } }, pagination: null }
    res.success(response, 'Shipping and warehouse information added successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Upload store avatar to seller profile.
 *
 * This controller handles the store avatar upload HTTP request.
 * It delegates the avatar upload logic to the service layer,
 * and sends a success response with the same structure as the original API.
 *
 * Avatar Upload Process includes:
 * - File validation for security and format requirements
 * - Upload to AWS S3 cloud storage
 * - Update seller profile with new avatar information
 * - Cleanup of previous avatar from storage
 *
 * The response maintains the same structure as the original API to ensure
 * compatibility with existing frontend implementations.
 *
 * @param {Request} req - Express request object containing the uploaded file in `req.file`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadStoreAvatar(req, res, next) {
  try {
    // Extract uploaded file from request
    const avatarFile = req.file;
    const sellerId = req.user.id;

    // Call the service layer to handle store avatar upload logic
    const response = await uploadStoreAvatarService.uploadStoreAvatar(sellerId, avatarFile);

    // Send success response with exact same structure as original function
    // Original: { message: 'Store avatar uploaded successfully', seller: updatedSeller }
    // New v2: { success: true, message: 'Store avatar uploaded successfully', data: { message: 'Store avatar uploaded successfully', seller: updatedSeller }, pagination: null }
    res.success(response, 'Store avatar uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Upload store banner for a seller.
 *
 * This controller handles the HTTP request for uploading a store banner image.
 * It delegates the upload logic to the service layer and sends a success response.
 *
 * Business Logic:
 * - Validates uploaded banner file for security and format requirements
 * - Uploads banner to AWS S3 cloud storage with unique filename
 * - Updates seller profile with new banner URL and metadata
 * - Deletes previous banner from S3 storage to prevent bloat
 * - Ensures data integrity and security standards
 *
 * Security Considerations:
 * - Requires valid authentication token
 * - Validates file type (JPEG, PNG, GIF, WebP only)
 * - Validates file size (max 10MB)
 * - Generates unique filenames to prevent conflicts
 * - Validates seller ownership of the account
 *
 * @param {Request} req - Express request object containing the uploaded banner file in `req.file`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadStoreBanner(req, res, next) {
  try {
    // Extract uploaded file from request
    const bannerFile = req.file;
    const sellerId = req.user.id;

    // Call the service layer to handle store banner upload logic
    const response = await uploadStoreBannerService.uploadStoreBanner(sellerId, bannerFile);

    // Send success response with exact same structure as original function
    // Original: { message: 'Store banner uploaded successfully', seller: updatedSeller }
    // New v2: { success: true, message: 'Store banner uploaded successfully', data: { message: 'Store banner uploaded successfully', seller: updatedSeller }, pagination: null }
    res.success(response, 'Store banner uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Delete store avatar for a seller.
 *
 * This controller removes the seller's current store avatar by delegating to the
 * service layer, which deletes the object from S3 (best-effort) and clears the
 * `storeAvatar` field on the seller document.
 *
 * Why:
 * - Allows sellers to intentionally remove their avatar image
 * - Keeps profile state accurate and storage usage efficient
 *
 * @param {Request} req - Express request object with authenticated seller in `req.user`
 * @param {Response} res - Express response utility (augmented with `success`)
 * @param {Function} next - Express next middleware for centralized error handling
 */
async function deleteStoreAvatar(req, res, next) {
  try {
    const sellerId = req.user.id;
    const response = await deleteStoreAvatarService.deleteStoreAvatar(sellerId);
    res.success(response, 'Store avatar deleted successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Verify OTP for seller email verification.
 *
 * This controller handles the OTP verification HTTP request.
 * It delegates the verification logic to the service layer and returns the verification result.
 *
 * Business Logic:
 * - Validates email and OTP input data
 * - Finds seller by email address
 * - Verifies OTP against stored value
 * - Updates seller verification status
 * - Generates JWT token for authentication
 * - Returns user data and token for immediate access
 *
 * Security Features:
 * - Comprehensive input validation
 * - Secure OTP comparison
 * - Account verification status management
 * - JWT token generation for authenticated access
 * - Error handling without information leakage
 *
 * Response Structure:
 * - Maintains same structure as original API
 * - Includes success status, message, user data, and token
 * - Compatible with existing frontend implementations
 *
 * @param {Request} req - Express request object containing email and OTP in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function verifyOTP(req, res, next) {
  try {
    // Extract email and OTP from request body
    const { email, otp } = req.body;

    // Call the service layer to handle OTP verification logic
    const response = await verifyOTPService.verifyOTP(email, otp);

    // Send success response with exact same structure as original function
    // Original: { success: true, message: 'Email verified successfully.', user: seller, token }
    // New v2: { success: true, message: 'Email verified successfully.', data: { success: true, message: 'Email verified successfully.', user: seller, token }, pagination: null }
    res.success(response, 'Email verified successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Select categories for a seller.
 *
 * This controller handles the category selection HTTP request.
 * It delegates the category selection logic to the service layer, and sends a success response.
 *
 * The controller ensures that:
 * - Request data is properly extracted and validated
 * - Service layer handles all business logic
 * - Response is properly formatted using responseFormatter
 * - Errors are properly handled and forwarded
 *
 * Request Processing:
 * - Extracts seller ID from authenticated user
 * - Extracts categories from request body
 * - Calls service layer for business logic
 * - Formats and sends response
 *
 * Security Features:
 * - Uses authenticated user ID for seller identification
 * - Delegates validation to service layer
 * - Proper error handling without information leakage
 * - Consistent response formatting
 *
 * @param {Request} req - Express request object containing categories in `req.body` and user ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function selectCategories(req, res, next) {
  try {
    // Extract seller ID from authenticated user and categories from request body
    const sellerId = req.user.id;
    const { categories } = req.body;

    // Call the service layer to handle category selection logic
    const response = await selectCategoriesService.selectCategories(sellerId, categories);

    // Send success response with exact same structure as original function
    // Original: { message: 'Categories selected successfully', seller }
    // New v2: { success: true, message: 'Categories selected successfully', data: { message: 'Categories selected successfully', seller }, pagination: null }
    res.success(response, 'Categories selected successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update categories for a seller.
 *
 * This controller handles the HTTP request for updating seller categories.
 * It provides secure category update functionality with proper validation,
 * authentication, and response formatting.
 *
 * The controller ensures that:
 * - Only authenticated sellers can update their categories
 * - Input data is properly validated
 * - Business logic is handled by the service layer
 * - Responses are consistently formatted
 * - Errors are properly handled
 *
 * Request Flow:
 * 1. Extract seller ID from authenticated user
 * 2. Extract categories from request body
 * 3. Call service layer for business logic
 * 4. Return formatted success response
 * 5. Handle any errors through middleware
 *
 * Security Features:
 * - Uses authenticated user ID for seller identification
 * - Delegates validation to service layer
 * - Proper error handling without information leakage
 * - Consistent response formatting
 *
 * @param {Request} req - Express request object containing categories in `req.body` and user ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateCategories(req, res, next) {
  try {
    // Extract seller ID from authenticated user and categories from request body
    const sellerId = req.user.id;
    const { categories } = req.body;

    // Call the service layer to handle category update logic
    const response = await updateCategoriesService.updateCategories(sellerId, categories);

    // Send success response with exact same structure as original function
    // Original: { message: 'Categories updated successfully', seller }
    // New v2: { success: true, message: 'Categories updated successfully', data: { message: 'Categories updated successfully', seller }, pagination: null }
    res.success(response, 'Categories updated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get seller's top selling products.
 *
 * This controller handles the request to retrieve a seller's top performing products.
 * It delegates the business logic to the service layer and returns the top products data.
 *
 * @param {Request} req - Express request object containing authenticated seller information
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getTopProducts(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Call the service layer to handle top products retrieval logic
    const response = await getTopProductsService.getTopProducts(sellerId);

    // Send success response with top products data
    res.success(response, 'Top products retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get comprehensive seller statistics and analytics.
 *
 * This controller handles the statistics retrieval HTTP request.
 * It delegates the analytics logic to the service layer and returns comprehensive
 * seller performance metrics including wallet balance, store visits, orders,
 * conversion rates, and customer acquisition data with week-over-week comparisons.
 *
 * @param {Request} req - Express request object containing the seller's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getStatistics(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Call the service layer to handle statistics retrieval logic
    const response = await getStatisticsService.getStatistics(sellerId);

    // Send success response with statistics data
    res.success(response, 'Statistics retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get orders for a seller with filtering and pagination.
 *
 * This controller handles the HTTP request for retrieving a seller's orders with
 * comprehensive filtering, sorting, and pagination capabilities. It provides functionality
 * to filter orders by status, date range, and other criteria while supporting both
 * paginated and non-paginated responses.
 *
 * The controller extracts the seller ID from the authenticated user and delegates
 * the business logic to the getOrders service, which handles query building,
 * filtering, and data retrieval with proper validation and error handling.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.id - Seller ID from JWT token
 * @param {Object} req.query - Query parameters for filtering and pagination
 * @param {string} req.query.status - Order status filter (optional)
 * @param {string} req.query.startDate - Start date filter (optional)
 * @param {string} req.query.endDate - End date filter (optional)
 * @param {number} req.query.page - Page number for pagination (optional, default: 1)
 * @param {number} req.query.limit - Items per page (optional, default: 10)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with orders data
 * @throws {ValidationError} When seller ID or filter validation fails
 * @throws {NotFoundException} When seller is not found
 * @throws {Error} When service operations fail
 */
async function getOrders(req, res, next) {
  try {
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;
    
    // Get pagination options from request using service method
    const pagination = getOrdersService.getPaginationOptions(req);
    // Get filter options from request using service method
    const filters = getOrdersService.getFilters(req);
    
    let response = {};
    if (pagination.enabled) {
      // Use paginated retrieval with combined pagination and filter parameters
      const params = { ...pagination, filters: filters };
      response = await getOrdersService.getPaginatedOrders(sellerId, params);
    } else {
      // Use non-paginated retrieval with filter parameters only
      response = await getOrdersService.getOrders(sellerId, filters);
    }
    
    // Send success response with orders data
    res.success(response, 'Orders retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Generate shipping label for a specific order item.
 *
 * This controller handles the shipping label generation HTTP request.
 * It delegates the shipping label generation logic to the service layer,
 * and sends a success response with the shipping label details.
 *
 * @param {Request} req - Express request object containing orderId in `req.params` and itemId in `req.query`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getShippingLabel(req, res, next) {
  try {
    // Extract order ID from request parameters and item ID from query parameters
    const { orderId } = req.params;
    const { itemId } = req.query;
    // Extract seller ID from authenticated user
    const sellerId = req.user.id;

    // Prepare data for service layer
    const shippingLabelData = {
      orderId,
      itemId,
      sellerId
    };

    // Call the service layer to handle shipping label generation logic
    const response = await getShippingLabelService.getShippingLabel(shippingLabelData);

    // Send a 200 OK response with success message and shipping label data
    res.success(response, 'Shipping label generated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Send phone verification OTP to seller.
 *
 * This controller handles the HTTP request for sending phone verification OTP.
 * It delegates the logic to the service layer and sends a success response.
 *
 * @param {Request} req - Express request object containing phone number in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function sendPhoneVerification(req, res, next) {
  try {
    const phoneVerificationData = req.body;
    const response = await sendPhoneVerificationService.sendPhoneVerification(phoneVerificationData);
    res.success(response, 'Phone verification code sent successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Verify phone number with OTP.
 *
 * This controller handles the HTTP request for verifying phone number with OTP.
 * It delegates the logic to the service layer and sends a success response.
 *
 * @param {Request} req - Express request object containing phone number and OTP in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function verifyPhone(req, res, next) {
  try {
    const verifyPhoneData = req.body;
    const response = await verifyPhoneService.verifyPhone(verifyPhoneData);
    res.success(response, 'Phone number verified successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Check if a seller's phone number is verified.
 *
 * This controller handles the HTTP request for checking phone verification status.
 * It retrieves the seller by ID and returns the verification status.
 *
 * @param {Request} req - Express request object containing sellerId in `req.params`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function checkPhoneVerificationStatus(req, res, next) {
  try {
    const { sellerId } = req.params;
    const sellerRepository = require('../repositories/seller.repository');
    const NotFoundException = require('../../../utils/errors/NotFoundException');
    
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    
    res.success({ isPhoneVerified: seller.isPhoneVerified || false }, 'Phone verification status retrieved successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Get list of banks from Paystack
 * 
 * This controller fetches the list of Nigerian banks from Paystack's API
 * to allow sellers to select their bank for verification.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function for error handling
 */
async function getBanks(req, res, next) {
  try {
    // Fetch bank list from Paystack via bankService
    const banks = await bankService.getBankList();
    
    // Return success response with banks list
    res.success(banks, 'Banks fetched successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Verify bank account using Paystack
 * 
 * This controller verifies a bank account number with the selected bank
 * using Paystack's account verification API. It ensures the account exists
 * and returns the account holder's name for confirmation.
 * 
 * @param {Request} req - Express request object containing accountNumber and bankCode in body
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function for error handling
 */
async function verifyBankAccount(req, res, next) {
  try {
    const { accountNumber, bankCode } = req.body;
    
    // Validate required fields
    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and bank code are required'
      });
    }
    
    // Validate account number format (should be 10 digits for Nigerian banks)
    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account number format. Must be 10 digits.'
      });
    }
    
    // Call Paystack to verify the bank account
    const verificationResult = await bankService.verifyBankAccount(accountNumber, bankCode);
    
    // Return success response with account details
    res.success({
      accountNumber: verificationResult.account_number,
      accountName: verificationResult.account_name,
      bankId: verificationResult.bank_id
    }, 'Bank account verified successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

module.exports = {
  register,
  login,
  googleAuth,
  checkToken,
  resendOTP,
  verifyOTP,
  getProfile,
  selectAccountType,
  completeProfile,
  addBankDetails,
  uploadCompanyVerification,
  uploadIndividualVerification,
  generateSmileIdToken,
  processSmileIdJob,
  saveIndividualSmileIdVerification,
  saveBusinessSmileIdVerification,
  smileIdCallback,
  addBusinessDetails,
  addBusinessInformation,
  addShippingWarehouse,
  uploadStoreAvatar,
  uploadStoreBanner,
  deleteStoreAvatar,
  selectCategories,
  updateCategories,
  getTopProducts,
  getStatistics,
  getOrders,
  getShippingLabel,
  sendPhoneVerification,
  verifyPhone,
  checkPhoneVerificationStatus,
  getBanks,
  verifyBankAccount
};
