/**
 * Process SmileID Job Service
 *
 * This service handles the business logic for SmileID job processing functionality.
 * It provides comprehensive job processing capabilities including validation,
 * SmileID API integration, and secure job management.
 *
 * The service ensures that:
 * - Job processing data is properly validated
 * - SmileID API integration is configured correctly
 * - Unique tracking IDs are generated for verification
 * - Proper job type selection based on account type
 * - Secure job processing with metadata
 * - Error handling for API failures
 *
 * Job Processing Flow:
 * - Input validation and data verification
 * - Seller verification and retrieval
 * - SmileID connection initialization
 * - Unique ID generation for tracking
 * - Job type selection based on account type
 * - Request parameter construction
 * - SmileID API job submission
 * - Response validation and formatting
 * - Success response with job data
 *
 * Security Features:
 * - Comprehensive input validation
 * - Seller authentication verification
 * - Secure API key management
 * - Environment variable validation
 * - Sandbox/Production mode support
 *
 * @module processSmileIdJobService
 */

const sellerRepository = require('../repositories/seller.repository');
const processSmileIdJobValidator = require('../validators/processSmileIdJob.validator');
const SIDCore = require("smile-identity-core");
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Process SmileID job for seller verification.
 *
 * This function handles the complete SmileID job processing workflow,
 * including validation, API integration, and result handling.
 *
 * Business Logic Flow:
 * 1. Validate job processing data using the validator
 * 2. Retrieve and verify the seller exists
 * 3. Initialize appropriate SmileID connection based on account type
 * 4. Generate unique tracking IDs for verification
 * 5. Select appropriate job type based on account type
 * 6. Construct request parameters with metadata
 * 7. Submit job via SmileID API
 * 8. Validate and format the response
 * 9. Return job data with tracking information
 *
 * @param {Object} data - The job processing data object
 * @param {Object} [data.idInfo] - ID information for individual accounts
 * @param {Array} [data.images] - Images array for business accounts
 * @param {Object} [data.partner_params] - Partner parameters object
 * @param {string} sellerId - The authenticated seller's ID
 * @returns {Promise<Object>} An object containing the job processing result and metadata
 *   - success: {boolean} - Success status
 *   - jobId: {string} - Unique job ID for tracking
 *   - result: {Object} - SmileID API response
 * @throws {ValidationError} If job processing data validation fails
 * @throws {Error} If seller not found or API operations fail
 *
 * @example
 * // Process job for individual account
 * const result = await processSmileIdJob({
 *   idInfo: {
 *     first_name: 'John',
 *     last_name: 'Doe',
 *     id_number: '12345678901'
 *   },
 *   partner_params: {}
 * }, 'sellerId123');
 * // Returns: { success: true, jobId: 'job-123-456', result: {...} }
 */
async function processSmileIdJob(data, sellerId) {
  // Step 1: Retrieve and verify the seller exists
  // This ensures the seller is valid and can proceed with verification
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 2: Validate job processing data using the validator
  // This ensures all required fields are present and valid
  processSmileIdJobValidator.validateProcessSmileIdJobData(data, seller.accountType);

  // Step 3: Process job based on account type
  // This ensures the correct verification flow is used
  if (seller.accountType === 'individual') {
    return await processIndividualJob(data, seller);
  } else {
    return await processBusinessJob(data, seller);
  }
}

/**
 * Process individual account verification job.
 *
 * This function handles Enhanced KYC verification for individual accounts
 * using SmileID IDApi.
 *
 * @param {Object} data - The job processing data object
 * @param {Object} seller - The seller object
 * @returns {Promise<Object>} Job processing result
 */
async function processIndividualJob(data, seller) {
  // Step 1: Initialize IDApi for Enhanced KYC
  // This sets up the connection for individual verification
  const connection = getIDApiConnection();

  // Step 2: Generate unique tracking IDs for verification
  // This ensures each verification request has unique identifiers
  const trackingIds = generateTrackingIds(seller._id.toString());

  // Step 3: Construct partner parameters with metadata
  // This builds the complete request for SmileID API
  const partnerParams = buildIndividualPartnerParams(trackingIds, data, seller);

  // Step 4: Prepare ID information for Enhanced KYC
  // This formats the ID information according to SmileID requirements
  const idInfo = buildIdInfo(data.idInfo);

  // Step 5: Set options for Enhanced KYC
  // This configures the job processing options
  const options = getIndividualJobOptions();

  // Step 6: Submit Enhanced KYC job using IDApi
  // This calls the SmileID service to process the verification
  const result = await connection.submit_job(
    partnerParams,
    idInfo,
    options
  );

  // Step 7: Save the job result if successful
  // This stores the verification result for future reference
  if (result && result.success !== false) {
    await saveVerificationResult(seller._id.toString(), result, seller.accountType);
  }

  // Step 8: Return job data with tracking information
  return {
    success: true,
    jobId: trackingIds.uniqueJobId,
    result: result
  };
}

/**
 * Process business account verification job.
 *
 * This function handles business verification for business accounts
 * using SmileID SIDWebAPI.
 *
 * @param {Object} data - The job processing data object
 * @param {Object} seller - The seller object
 * @returns {Promise<Object>} Job processing result
 */
async function processBusinessJob(data, seller) {
  // Step 1: Initialize SIDWebAPI for Business Verification
  // This sets up the connection for business verification
  const connection = getSIDWebAPIConnection();

  // Step 2: Generate unique tracking IDs for verification
  // This ensures each verification request has unique identifiers
  const trackingIds = generateTrackingIds(seller._id.toString());

  // Step 3: Construct job parameters with metadata
  // This builds the complete request for SmileID API
  const jobParams = buildBusinessJobParams(trackingIds, data, seller);

  // Step 4: Set options for business verification
  // This configures the job processing options
  const options = getBusinessJobOptions();

  // Step 5: Submit business verification job
  // This calls the SmileID service to process the verification
  const result = await connection.submit_job(
    jobParams,
    data.images,
    data.idInfo || {},
    options
  );

  // Step 6: Save the job result if successful
  // This stores the verification result for future reference
  if (result && result.success !== false) {
    await saveVerificationResult(seller._id.toString(), result, seller.accountType);
  }

  // Step 7: Return job data with tracking information
  return {
    success: true,
    jobId: trackingIds.uniqueJobId,
    result: result
  };
}

/**
 * Initializes and configures the SmileID IDApi connection.
 *
 * This function sets up the connection to SmileID IDApi services with proper
 * configuration for sandbox or production environments.
 *
 * Configuration Features:
 * - Partner ID configuration
 * - API key management
 * - Sandbox/Production mode selection
 *
 * @returns {Object} Configured SmileID IDApi connection
 * @throws {Error} If required environment variables are missing
 */
function getIDApiConnection() {
  // Step 1: Validate required environment variables
  // This ensures all necessary SmileID configuration is present
  const requiredEnvVars = {
    SMILEID_PARTNER_ID: process.env.SMILEID_PARTNER_ID,
    SMILEID_API_KEY: process.env.SMILEID_API_KEY
  };

  // Check for missing environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new ValidationError([{ field: 'environment', message: `Missing required environment variables: ${missingVars.join(', ')}` }]);
  }

  // Step 2: Initialize SmileID IDApi connection
  // This creates the connection with proper configuration
  const IDApi = SIDCore.IDApi;
  
  // Step 3: Configure connection parameters
  // This sets up the connection with environment-specific settings
  const connection = new IDApi(
    process.env.SMILEID_PARTNER_ID,
    process.env.SMILEID_API_KEY,
    process.env.SMILEID_SANDBOX_MODE === 'true' ? 0 : 1 // 0 for sandbox, 1 for production
  );

  return connection;
}

/**
 * Initializes and configures the SmileID SIDWebAPI connection.
 *
 * This function sets up the connection to SmileID SIDWebAPI services with proper
 * configuration for sandbox or production environments.
 *
 * Configuration Features:
 * - Partner ID configuration
 * - Callback URL setup
 * - API key management
 * - Sandbox/Production mode selection
 *
 * @returns {Object} Configured SmileID SIDWebAPI connection
 * @throws {Error} If required environment variables are missing
 */
function getSIDWebAPIConnection() {
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

  // Step 2: Initialize SmileID SIDWebAPI connection
  // This creates the connection with proper configuration
  const SIDWebAPI = SIDCore.WebApi;
  
  // Step 3: Configure connection parameters
  // This sets up the connection with environment-specific settings
  const connection = new SIDWebAPI(
    process.env.SMILEID_PARTNER_ID,
    process.env.SMILEID_CALLBACK_URL || `${process.env.BACKEND_URL}/api/seller/verification/smileid/callback`,
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
 * - Job ID generation
 *
 * @param {string} sellerId - The seller's ID
 * @returns {Object} Object containing unique tracking IDs
 *   - uniqueUserId: {string} - Unique user identifier
 *   - uniqueJobId: {string} - Unique job identifier
 */
function generateTrackingIds(sellerId) {
  // Step 1: Generate timestamp for uniqueness
  // This ensures each request has a unique timestamp
  const timestamp = Date.now();

  // Step 2: Generate unique user ID
  // This creates a unique identifier for the user
  const uniqueUserId = `seller-${sellerId}-${timestamp}`;

  // Step 3: Generate unique job ID
  // This creates a unique identifier for the verification job
  const uniqueJobId = `job-${sellerId}-${timestamp}`;

  return {
    uniqueUserId,
    uniqueJobId
  };
}

/**
 * Builds partner parameters for individual account verification.
 *
 * This function constructs the complete partner parameters including
 * metadata and partner parameters for individual verification.
 *
 * @param {Object} trackingIds - Object containing unique tracking IDs
 * @param {Object} data - The job processing data object
 * @param {Object} seller - The seller object
 * @returns {Object} Complete partner parameters object
 */
function buildIndividualPartnerParams(trackingIds, data, seller) {
  // Step 1: Build base partner parameters
  // This creates the core parameters for the job
  const partnerParams = {
    job_id: trackingIds.uniqueJobId,
    user_id: trackingIds.uniqueUserId,
    job_type: 5, // Enhanced KYC
    seller_id: seller._id.toString(),
    account_type: seller.accountType,
    verification_timestamp: new Date().toISOString(),
    seller_email: seller.email,
    seller_name: `${seller.firstName} ${seller.lastName}`
  };

  // Step 2: Merge with provided partner parameters
  // This allows for additional custom parameters
  return {
    ...partnerParams,
    ...data.partner_params
  };
}

/**
 * Builds ID information for Enhanced KYC verification.
 *
 * This function formats the ID information according to SmileID
 * Enhanced KYC documentation requirements.
 *
 * @param {Object} idInfo - The ID information object
 * @returns {Object} Formatted ID information object
 */
function buildIdInfo(idInfo) {
  // Step 1: Build base ID information
  // This creates the core ID information for verification
  const formattedIdInfo = {
    first_name: idInfo.first_name,
    last_name: idInfo.last_name,
    country: idInfo.country || 'NG',
    id_type: idInfo.id_type || 'NIN_SLIP',
    id_number: idInfo.id_number,
    phone_number: idInfo.phone_number
  };

  // Step 2: Add optional date of birth if provided
  // This includes additional information if available
  if (idInfo.dob) {
    formattedIdInfo.dob = idInfo.dob;
  }

  return formattedIdInfo;
}

/**
 * Builds job parameters for business account verification.
 *
 * This function constructs the complete job parameters including
 * metadata and partner parameters for business verification.
 *
 * @param {Object} trackingIds - Object containing unique tracking IDs
 * @param {Object} data - The job processing data object
 * @param {Object} seller - The seller object
 * @returns {Object} Complete job parameters object
 */
function buildBusinessJobParams(trackingIds, data, seller) {
  // Step 1: Build base job parameters
  // This creates the core parameters for the job
  const jobParams = {
    user_id: trackingIds.uniqueUserId,
    job_id: trackingIds.uniqueJobId,
    job_type: 7, // Business Verification
    partner_params: {
      seller_id: seller._id.toString(),
      account_type: seller.accountType,
      verification_timestamp: new Date().toISOString(),
      seller_email: seller.email,
      seller_name: `${seller.firstName} ${seller.lastName}`
    }
  };

  // Step 2: Merge with provided partner parameters
  // This allows for additional custom parameters
  jobParams.partner_params = {
    ...jobParams.partner_params,
    ...data.partner_params
  };

  return jobParams;
}

/**
 * Gets job processing options for individual account verification.
 *
 * This function returns the appropriate options for Enhanced KYC
 * job processing.
 *
 * @returns {Object} Job processing options
 */
function getIndividualJobOptions() {
  return {
    signature: true,
    return_job_status: true,
    return_history: true,
    return_images: true
  };
}

/**
 * Gets job processing options for business account verification.
 *
 * This function returns the appropriate options for business
 * verification job processing.
 *
 * @returns {Object} Job processing options
 */
function getBusinessJobOptions() {
  return {
    return_job_status: true,
    return_history: true,
    return_images: true
  };
}

/**
 * Check if SmileID result has images.
 *
 * This function validates that the SmileID result contains images.
 *
 * @param {Object} smileIdResult - The SmileID verification result
 * @returns {boolean} True if images are present and not empty
 */
function hasVerificationImages(smileIdResult) {
  return smileIdResult.images && smileIdResult.images.length > 0;
}

/**
 * Check if SmileID result has successful result codes.
 *
 * This function validates that the SmileID result has successful result codes.
 *
 * @param {Object} smileIdResult - The SmileID verification result
 * @returns {boolean} True if result code indicates success
 */
function hasSuccessfulResultCode(smileIdResult) {
  const successCodes = ['1012', '1020', '1021'];
  return smileIdResult.ResultCode && successCodes.includes(smileIdResult.ResultCode.toString());
}

/**
 * Determine if verification was actually successful.
 *
 * This function combines multiple success criteria to determine
 * if the verification should be considered successful.
 *
 * @param {Object} smileIdResult - The SmileID verification result
 * @returns {boolean} True if verification is successful
 */
function isVerificationSuccessful(smileIdResult) {
  const hasImages = hasVerificationImages(smileIdResult);
  const hasSuccessCode = hasSuccessfulResultCode(smileIdResult);
  return hasImages && (hasSuccessCode || smileIdResult.success === true);
}

/**
 * Saves verification result to seller record.
 *
 * This function stores the SmileID verification result in the seller's
 * record for future reference and status tracking.
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} smileIdResult - The SmileID API response
 * @param {string} accountType - The account type (individual or business)
 */
async function saveVerificationResult(sellerId, smileIdResult, accountType) {
  // Step 1: Retrieve the seller record
  // This ensures we have the latest seller information
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    return;
  }

  // Step 2: Determine if verification was successful
  // This ensures we only mark as verified if truly successful
  const isActuallySuccessful = isVerificationSuccessful(smileIdResult);

  // Step 3: Store SmileID verification result
  // This saves the verification result for future reference
  seller.smileIdVerification = {
    type: accountType,
    provider: 'SmileID',
    result: smileIdResult,
    verifiedAt: new Date(),
    status: isActuallySuccessful ? 'verified' : 'failed'
  };

  // Step 4: Set verification documents as filled
  // This marks that verification documents have been submitted
  seller.hasFilledVerificationDocuments = true;
  
  // Step 5: Only set verified if actually successful
  // This ensures verification status is accurate
  if (isActuallySuccessful) {
    seller.isVerified = true;
  }

  // Step 6: Save the updated seller record
  // This persists the verification result
  await sellerRepository.updateById(sellerId, seller);
}

module.exports = {
  processSmileIdJob,
};
