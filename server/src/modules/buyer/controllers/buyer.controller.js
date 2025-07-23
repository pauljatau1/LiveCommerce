const registerService = require('../services/register.service');
const loginService = require('../services/login.service');
const profileService = require('../services/profile.service');
const updateProfileService = require('../services/updateProfile.service');
const uploadProfileImageService = require('../services/uploadProfileImage.service');
const verifyOTPService = require('../services/verifyOTP.service');
const resendOTPService = require('../services/resendOTP.service');
const checkTokenService = require('../services/checkToken.service');
const updateSelectedCategoriesService = require('../services/updateSelectedCategories.service');
const getSelectedCategoriesService = require('../services/getSelectedCategories.service');
const getOrdersService = require('../services/getOrders.service');
const getOrderDetailsService = require('../services/getOrderDetails.service');
const getAddressesService = require('../services/getAddresses.service');


/**
 * Register a buyer user.
 *
 * This controller handles the registration HTTP request.
 * It delegates the registration logic to the service layer, and sends a success response.
 *
 * @param {Request} req - Express request object containing the buyer's registration data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function register(req, res, next) {
  try {
    // Call the service layer to handle buyer registration logic
    const response = await registerService.register(req.body);

    // Send a 201 Created response with success message and buyer data
    res.success(response, 'Buyer registered successfully', 201);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Authenticate a buyer and return user data with a JWT token.
 *
 * Handles both email/password login and Google login for mobile.
 *
 * @param {Request} req - Express request object containing login data
 * @param {Response} res - Express response object for sending formatted success/error responses
 * @param {Function} next - Express next middleware for error handling
 */
async function login(req, res, next) {
  try {
    const response = await loginService.login(req.body);
    res.success(response, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * Get buyer profile information.
 *
 * This controller handles the profile retrieval HTTP request.
 * It delegates the profile logic to the service layer and returns the enhanced profile data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getProfile(req, res, next) {
  try {
    // Call the service layer to handle profile retrieval logic
    const response = await profileService.getProfile(req.user.id);

    // Send success response with profile data
    res.success(response, 'Profile retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Check and validate JWT token.
 *
 * This controller handles token validation HTTP request.
 * It delegates the token validation logic to the service layer and returns a new token if valid.
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
    res.success(response, 'Token validated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update buyer profile information.
 *
 * This controller handles the profile update HTTP request.
 * It delegates the profile update logic to the service layer and returns the updated profile data.
 *
 * @param {Request} req - Express request object containing the profile update data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateProfile(req, res, next) {
  try {
    // Call the service layer to handle profile update logic
    const response = await updateProfileService.updateProfile(req.user.id, req.body);

    // Send success response with updated profile data
    res.success(response, 'Profile updated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 *
 * Upload buyer profile image.
 *
 * This controller handles the profile image upload HTTP request.
 * It delegates the upload logic to the service layer and returns the updated profile data.
 *
 * @param {Request} req - Express request object containing the uploaded file in `req.file`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadProfileImage(req, res, next) {
  try {
    // Call the service layer to handle profile image upload logic
    const response = await uploadProfileImageService.uploadProfileImage(req.user.id, req.file);

    // Send success response with updated profile data
    res.success(response, 'Profile image uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}
/**    
 * Verify OTP for buyer email verification.
 *
 * This controller handles the OTP verification HTTP request.
 * It delegates the verification logic to the service layer and returns the verification result.
 *
 * @param {Request} req - Express request object containing email and OTP in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function verifyOTP(req, res, next) {
  try {
    // Call the service layer to handle OTP verification logic
    const response = await verifyOTPService.verifyOTP(req.body.email, req.body.otp);

    // Send success response with verification result
    res.success(response, 'OTP verified successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Resend OTP to buyer's email.
 *
 * This controller handles the OTP resend HTTP request.
 * It delegates the OTP resend logic to the service layer and returns a success message.
 *
 * @param {Request} req - Express request object containing the email in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function resendOTP(req, res, next) {
  try {
    // Call the service layer to handle OTP resend logic
    const response = await resendOTPService.resendOTP(req.body.email);

    // Send success response
    res.success(response, 'OTP resent successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update selected categories for a buyer.
 *
 * This controller handles the selected categories update HTTP request.
 * It delegates the update logic to the service layer and returns the updated buyer data.
 *
 * @param {Request} req - Express request object containing the selectedCategories in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateSelectedCategories(req, res, next) {
  try {
    // Call the service layer to handle selected categories update logic
    const response = await updateSelectedCategoriesService.updateSelectedCategories(req.user.id, req.body.selectedCategories);

    // Send success response with updated buyer data
    res.success(response, 'Selected categories updated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get selected categories for a buyer.
 *
 * This controller handles the selected categories retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted categories data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getSelectedCategories(req, res, next) {
  try {
    // Call the service layer to handle selected categories retrieval logic
    const response = await getSelectedCategoriesService.getSelectedCategories(req.user.id);

    // Send success response with categories data
    res.success(response, 'Selected categories retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get orders for a buyer with filtering and pagination.
 *
 * This controller handles the orders retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted orders data.
 *
 * @param {Request} req - Express request object containing query parameters and buyer's ID
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getOrders(req, res, next) {
  try {
    const pagination = getOrdersService.getPaginationOptions(req);
    const filters = getOrdersService.getFilters(req);

    let response = {};
    if (pagination.enabled) {
      const params = { ...pagination, filters: filters };
      response = await getOrdersService.getPaginatedOrders(req.user.id, params);
    } else {
      response = await getOrdersService.getOrders(req.user.id, filters);
    }

    // Send success response with orders data
    res.success(response, 'Orders retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get detailed information about a specific order for a buyer.
 *
 * This controller handles the order details retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted order data.
 *
 * @param {Request} req - Express request object containing the order ID in `req.params.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getOrderDetails(req, res, next) {
  try {
    // Call the service layer to handle order details retrieval logic
    const response = await getOrderDetailsService.getOrderDetails(req.user.id, req.params.id);

    // Send success response with order details
    res.success(response, 'Order details retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get purchase analytics for a buyer.
 *
 * This controller handles the purchase analytics retrieval HTTP request.
 * It delegates the analytics logic to the service layer and returns comprehensive purchase insights.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getPurchaseAnalytics(req, res, next) {
  try {
    // Call the service layer to handle purchase analytics logic
    const response = await getPurchaseAnalyticsService.getPurchaseAnalytics(req.user.id);

    // Send success response with analytics data
    res.success(response, 'Purchase analytics retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get all shipping addresses for a buyer.
 *
 * This controller handles the addresses retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted addresses data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getAddresses(req, res, next) {
  try {
    // Call the service layer to handle addresses retrieval logic
    const response = await getAddressesService.getAddresses(req.user.id);

    // Send success response with addresses data
    res.success(response, 'Addresses retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  checkToken,
  updateProfile,
  uploadProfileImage,
  verifyOTP,
  resendOTP,
  updateSelectedCategories,
  getSelectedCategories,
  getOrders,
  getOrderDetails,
  getPurchaseAnalytics,
  getAddresses,
};