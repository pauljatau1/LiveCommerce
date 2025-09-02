const registerService = require('../services/register.service');
const loginService = require('../services/login.service');
const checkTokenService = require('../services/checkToken.service');

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

module.exports = {
  register,
  login,
  checkToken
};
