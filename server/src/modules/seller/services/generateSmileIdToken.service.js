/**
 * Generate SmileID Token Service
 *
 * This service handles the business logic for SmileID token generation functionality.
 * It provides comprehensive token generation capabilities including validation,
 * SmileID API integration, and secure token management.
 *
 * The service ensures that:
 * - Token generation data is properly validated
 * - SmileID API integration is configured correctly
 * - Unique tracking IDs are generated for verification
 * - Proper product selection based on account type
 * - Secure token generation with metadata
 * - Error handling for API failures
 *
 * Token Generation Flow:
 * - Input validation and data verification
 * - Seller verification and retrieval
 * - SmileID connection initialization
 * - Unique ID generation for tracking
 * - Product selection based on account type
 * - Request parameter construction
 * - SmileID API token generation
 * - Response validation and formatting
 * - Success response with token data
 *
 * Security Features:
 * - Comprehensive input validation
 * - Seller authentication verification
 * - Secure API key management
 * - Unique tracking ID generation
 * - Proper error handling
 * - Metadata sanitization
 *
 * SmileID Integration:
 * - Web API integration for token generation
 * - Product-specific configuration
 * - Callback URL management
 * - Partner parameter metadata
 * - Sandbox/Production mode support
 *
 * @module generateSmileIdTokenService
 */

const sellerRepository = require('../repositories/seller.repository');
const generateSmileIdTokenValidator = require('../validators/generateSmileIdToken.validator');
const SIDCore = require("smile-identity-core");
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Generates a SmileID token for seller verification - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * SmileID token generation process. It handles validation, seller verification,
 * API integration, and token generation in a secure and efficient manner.
 *
 * Business Logic Flow:
 * 1. Validates the token generation input data
 * 2. Retrieves and verifies the seller exists
 * 3. Initializes SmileID Web API connection
 * 4. Generates unique tracking IDs for verification
 * 5. Selects appropriate product based on account type
 * 6. Constructs request parameters with metadata
 * 7. Generates token via SmileID API
 * 8. Validates and formats the response
 * 9. Returns token data with expiration information
 *
 * SmileID Integration:
 * - Uses SIDWebAPI for token generation
 * - Configures sandbox/production mode
 * - Sets up callback URL for verification
 * - Includes partner parameters for tracking
 * - Handles API response validation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Seller authentication verification
 * - Secure API key management
 * - Unique ID generation for tracking
 * - Proper error handling and logging
 *
 * @param {Object} data - The token generation data object
 * @param {string} data.accountType - Account type (individual or business)
 * @param {string} data.idType - ID type based on account type
 * @param {string} [data.userId] - Optional user ID for tracking
 * @param {string} sellerId - The authenticated seller's ID
 * @returns {Promise<Object>} An object containing the SmileID token and metadata
 *   - token: {string} - The generated SmileID token
 *   - expiresAt: {string} - Token expiration timestamp
 *   - userId: {string} - Unique user ID for tracking
 *   - jobId: {string} - Unique job ID for tracking
 *   - product: {string} - SmileID product used
 *   - accountType: {string} - Account type used
 *   - idType: {string} - ID type used
 *   - success: {boolean} - Success status
 * @throws {ValidationError} If token generation data validation fails
 * @throws {Error} If seller not found or API operations fail
 *
 * @example
 * // Generate token for individual account
 * const result = await generateSmileIdToken({
 *   accountType: 'individual',
 *   idType: 'NIN_SLIP',
 *   userId: 'user123'
 * }, 'sellerId123');
 * // Returns: { token: 'smileid_token_here', expiresAt: '...', ... }
 */
async function generateSmileIdToken(data, sellerId) {
  // Step 1: Validate token generation data using the validator
  // This ensures all required fields are present and valid
  generateSmileIdTokenValidator.validateGenerateSmileIdTokenData(data);

  // Step 2: Retrieve and verify the seller exists
  // This ensures the seller is valid and can proceed with verification
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 3: Initialize SmileID Web API connection
  // This sets up the connection to SmileID services
  const connection = getSmileIdConnection();

  // Step 4: Generate unique tracking IDs for verification
  // This ensures each verification request has unique identifiers
  const trackingIds = generateTrackingIds(sellerId, data.userId);

  // Step 5: Select appropriate product based on account type
  // This ensures the correct SmileID product is used for verification
  const product = selectSmileIdProduct(data.accountType);

  // Step 6: Construct request parameters with metadata
  // This builds the complete request for SmileID API
  const requestParams = buildRequestParams(trackingIds, product, data, seller);

  // Step 7: Generate token via SmileID API
  // This calls the SmileID service to generate the verification token
  const result = await connection.get_web_token(requestParams);

  // Step 8: Validate and format the response
  // This ensures the API response is valid and properly formatted
  validateSmileIdResponse(result);

  // Step 9: Return token data with expiration information
  return formatTokenResponse(result, trackingIds, product, data);
}

/**
 * Initializes and configures the SmileID Web API connection.
 *
 * This function sets up the connection to SmileID services with proper
 * configuration for sandbox or production environments.
 *
 * Configuration Features:
 * - Partner ID configuration
 * - Callback URL setup
 * - API key management
 * - Sandbox/Production mode selection
 *
 * @returns {Object} Configured SmileID Web API connection
 * @throws {Error} If required environment variables are missing
 */
function getSmileIdConnection() {
  // Step 1: Validate required environment variables
  // This ensures all necessary SmileID configuration is present
  const requiredEnvVars = {
    SMILEID_PARTNER_ID: process.env.SMILEID_PARTNER_ID,
    SMILEID_API_KEY: process.env.SMILEID_API_KEY,
    BACKEND_URL: process.env.BACKEND_URL
  };

  // Check for missing environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new ValidationError([{ field: 'environment', message: `Missing required environment variables: ${missingVars.join(', ')}` }]);
  }

  // Step 2: Initialize SmileID Web API connection
  // This creates the connection with proper configuration
  const SIDWebAPI = SIDCore.WebApi;
  
  // Step 3: Configure connection parameters
  // This sets up the connection with environment-specific settings
  const connection = new SIDWebAPI(
    process.env.SMILEID_PARTNER_ID,
    `${process.env.BACKEND_URL}/api/seller/verification/smileid/callback`,
    process.env.SMILEID_API_KEY,
    process.env.SMILEID_SANDBOX_MODE === 'true' ? 0 : 1 // 0 for sandbox, 1 for production
  );

  return connection;
}

/**
 * Generates unique tracking IDs for SmileID verification.
 *
 * This function creates unique identifiers for tracking verification
 * requests and ensuring proper job management.
 *
 * ID Generation Features:
 * - Timestamp-based uniqueness
 * - Seller ID integration
 * - User ID support (optional)
 * - Job ID generation
 *
 * @param {string} sellerId - The seller's ID
 * @param {string} [userId] - Optional user ID
 * @returns {Object} Object containing unique tracking IDs
 *   - uniqueUserId: {string} - Unique user identifier
 *   - uniqueJobId: {string} - Unique job identifier
 */
function generateTrackingIds(sellerId, userId) {
  // Step 1: Generate timestamp for uniqueness
  // This ensures each request has a unique timestamp
  const timestamp = Date.now();

  // Step 2: Generate unique user ID
  // This creates a unique identifier for the user
  const uniqueUserId = userId || `seller-${sellerId}-${timestamp}`;

  // Step 3: Generate unique job ID
  // This creates a unique identifier for the verification job
  const uniqueJobId = `job-${sellerId}-${timestamp}`;

  return {
    uniqueUserId,
    uniqueJobId
  };
}

/**
 * Selects the appropriate SmileID product based on account type.
 *
 * This function determines which SmileID product to use based on the
 * account type for optimal verification flow.
 *
 * Product Selection Logic:
 * - Individual accounts use enhanced_kyc
 * - Business accounts use doc_verification
 * - Ensures proper verification flow
 *
 * @param {string} accountType - The account type (individual or business)
 * @returns {string} The appropriate SmileID product
 */
function selectSmileIdProduct(accountType) {
  // Step 1: Select product based on account type
  // This ensures the correct verification product is used
  if (accountType === 'individual') {
    // For Enhanced KYC with NIN_V2 - use 'enhanced_kyc'
    return 'enhanced_kyc';
  } else {
    // For Business Verification - use 'doc_verification'
    return 'doc_verification';
  }
}

/**
 * Builds request parameters for SmileID API call.
 *
 * This function constructs the complete request parameters including
 * metadata and partner parameters for SmileID verification.
 *
 * Parameter Construction:
 * - User and job ID setup
 * - Product configuration
 * - Callback URL setup
 * - Partner parameter metadata
 * - Seller information inclusion
 *
 * @param {Object} trackingIds - The tracking IDs object
 * @param {string} product - The SmileID product to use
 * @param {Object} data - The token generation data
 * @param {Object} seller - The seller object
 * @returns {Object} Complete request parameters for SmileID API
 */
function buildRequestParams(trackingIds, product, data, seller) {
  // Step 1: Build base request parameters
  // This sets up the core parameters for SmileID API
  const requestParams = {
    user_id: trackingIds.uniqueUserId,
    job_id: trackingIds.uniqueJobId,
    product: product, // CRITICAL: Use 'product' not 'job_type' for get_web_token
    callback_url: `${process.env.BACKEND_URL}/api/seller/verification/smileid/callback`,
    // Step 2: Add partner parameters for metadata
    // This includes additional information for tracking and verification
    partner_params: {
      seller_id: seller._id.toString(),
      account_type: data.accountType,
      id_type: data.idType,
      verification_timestamp: new Date().toISOString(),
      seller_email: seller.email,
      seller_name: `${seller.firstName} ${seller.lastName}`
    }
  };

  return requestParams;
}

/**
 * Validates the SmileID API response.
 *
 * This function ensures the API response is valid and contains
 * the required token information.
 *
 * Validation Features:
 * - Response existence check
 * - Token presence validation
 * - Error handling for invalid responses
 *
 * @param {Object} result - The SmileID API response
 * @throws {Error} If response is invalid or missing token
 */
function validateSmileIdResponse(result) {
  // Step 1: Validate response existence
  // This ensures the API returned a valid response
  if (!result || !result.token) {
    throw new Error('Invalid token response from SmileID');
  }
}

/**
 * Formats the token response with expiration and metadata.
 *
 * This function creates the final response object with token data,
 * expiration information, and verification metadata.
 *
 * Response Formatting:
 * - Token inclusion
 * - Expiration timestamp calculation
 * - Tracking ID inclusion
 * - Product and account type metadata
 * - Success status indication
 *
 * @param {Object} result - The SmileID API response
 * @param {Object} trackingIds - The tracking IDs object
 * @param {string} product - The SmileID product used
 * @param {Object} data - The token generation data
 * @returns {Object} Formatted token response
 */
function formatTokenResponse(result, trackingIds, product, data) {
  // Step 1: Calculate token expiration (1 hour from now)
  // This sets the token expiration time
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  // Step 2: Build complete response object
  // This includes all necessary information for the client
  return {
    token: result.token,
    expiresAt: expiresAt,
    userId: trackingIds.uniqueUserId,
    jobId: trackingIds.uniqueJobId,
    product: product,
    accountType: data.accountType,
    idType: data.idType,
    success: result.success || true
  };
}

module.exports = {
  generateSmileIdToken
};
