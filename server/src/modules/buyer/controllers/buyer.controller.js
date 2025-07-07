const registerService = require('../services/register.service');
const loginService = require('../services/login.service');
const profileService = require('../services/profile.service');
const updateProfileService = require('../services/updateProfile.service');
const checkTokenService = require('../services/checkToken.service');

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

module.exports = {
  register,
  login,
  getProfile,
  checkToken,
  updateProfile,
};