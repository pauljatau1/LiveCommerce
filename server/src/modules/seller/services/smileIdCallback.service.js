/**
 * SmileID Callback Service
 *
 * This service handles the business logic for processing SmileID verification callbacks.
 * It processes webhook callbacks from SmileID, determines verification success,
 * updates seller records, and sends confirmation emails.
 *
 * Business Logic:
 * - Validates callback data structure
 * - Extracts verification result information
 * - Determines verification success based on images and result codes
 * - Updates seller verification status and documents
 * - Tracks verification completion with analytics
 * - Sends confirmation email to seller
 *
 * Success Criteria:
 * - Must have images in the result
 * - Must have successful result codes (1012, 1020, 1021) or success flag
 * - Only marks as verified if both criteria are met
 *
 * @module smileIdCallbackService
 */

const sellerRepository = require('../repositories/seller.repository');
const smileIdCallbackValidator = require('../validators/smileIdCallback.validator');
const mixpanel = require('../../../config/mixpanel');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');

/**
 * Check if verification result has images.
 *
 * This function validates that the verification result contains images
 * from either Images or images field.
 *
 * @param {Object} verificationResult - The verification result object
 * @returns {boolean} True if images are present and not empty
 */
function hasVerificationImages(verificationResult) {
  const images = verificationResult.Images || verificationResult.images;
  return !!(images && images.length > 0);
}

/**
 * Check if verification result has successful result codes.
 *
 * This function validates that the verification result has successful result codes.
 *
 * @param {string} resultCode - The result code to validate
 * @returns {boolean} True if result code indicates success
 */
function hasSuccessfulResultCode(resultCode) {
  const successCodes = ['1012', '1020', '1021'];
  return !!(resultCode && successCodes.includes(resultCode.toString()));
}

/**
 * Determine if verification was actually successful.
 *
 * This function combines multiple success criteria to determine
 * if the verification should be considered successful.
 *
 * @param {Object} verificationResult - The verification result object
 * @returns {boolean} True if verification is successful
 */
function isVerificationSuccessful(verificationResult) {
  const hasImages = hasVerificationImages(verificationResult);
  const resultCode = verificationResult.ResultCode || verificationResult.result_code;
  const hasSuccessCode = hasSuccessfulResultCode(resultCode);
  const jobComplete = verificationResult.job_complete === true;
  const success = verificationResult.success === true;
  
  return hasImages && (hasSuccessCode || jobComplete || success);
}

/**
 * Track verification completion with Mixpanel.
 *
 * This function sends analytics data to Mixpanel for tracking
 * verification completion events from webhook callbacks.
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} seller - The seller object
 * @param {string} accountType - The account type (business/individual)
 * @param {string} resultCode - The verification result code
 * @param {string} jobId - The SmileID job ID
 */
function trackVerificationCompletion(sellerId, seller, accountType, resultCode, jobId) {
  mixpanel.track(`seller_${accountType}_smileid_verification_webhook`, {
    distinct_id: sellerId,
    sellerId: sellerId,
    sellerName: `${seller.firstName} ${seller.lastName}`,
    email: seller.email,
    storeName: seller.storeName,
    verificationProvider: 'SmileID',
    verificationStatus: 'verified',
    source: 'webhook',
    resultCode: resultCode,
    jobId: jobId
  });
}

/**
 * Send verification confirmation email.
 *
 * This function sends a confirmation email to the seller
 * about their verification status using the exact same template
 * as the original implementation loaded from template file.
 *
 * @param {Object} seller - The seller object
 * @param {string} accountType - The account type (business/individual)
 * @param {string} jobId - The SmileID job ID
 * @param {string} resultCode - The verification result code
 */
async function sendVerificationEmail(seller, accountType, jobId, resultCode) {
  // Step 1: Get the email content with processed HTML template
  const emailContent = getVerificationEmailContent(seller, accountType, jobId, resultCode);

  // Step 2: Send the email using SendGrid service
  await sgMail.send(emailContent);
}

/**
 * Constructs the verification email content for sellers.
 *
 * This function reads the HTML email template and replaces dynamic placeholders
 * with actual values to create personalized verification emails for sellers.
 * Uses the exact same template as the original implementation.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{firstName}}: The seller's first name
 * - {{businessText}}: Business-specific verification text
 * - {{jobId}}: The SmileID job ID
 * - {{resultCode}}: The verification result code
 * - {{completedAt}}: The completion timestamp
 * - {{year}}: Current year for copyright and branding
 *
 * @param {Object} seller - The seller object
 * @param {string} accountType - The account type (business/individual)
 * @param {string} jobId - The SmileID job ID
 * @param {string} resultCode - The verification result code
 * @returns {Object} SendGrid-compatible email content object
 *   - to: recipient email address
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
function getVerificationEmailContent(seller, accountType, jobId, resultCode) {
  // Step 1: Construct the path to the SmileID callback verification email template
  const filePath = __dirname + '/../../../templates/smileid-callback-verification-email.html';
  
  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Prepare email subject and business text based on account type
  const emailSubject = accountType === 'business' ? 'Business Verification Completed' : 'Identity Verification Completed';
  const businessText = accountType === 'business' ? 
    `Your business verification for "${seller.storeName || seller.businessName}" using SmileID has been completed successfully.` :
    'Your identity verification using SmileID has been completed successfully.';

  // Step 4: Replace template placeholders with actual data
  html = html.replace('{{firstName}}', seller.firstName);
  html = html.replace('{{businessText}}', businessText);
  html = html.replace('{{jobId}}', jobId);
  html = html.replace('{{resultCode}}', resultCode);
  html = html.replace('{{completedAt}}', new Date().toLocaleString());
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 5: Return SendGrid-compatible email object
  return {
    to: seller.email,
    from: 'Auqli Nigeria <support@auqli.com>',
    subject: emailSubject,
    html
  };
}

/**
 * Process SmileID verification callback.
 *
 * This function processes webhook callbacks from SmileID verification service.
 * It validates the callback data, determines verification success, updates seller
 * records, and sends confirmation emails.
 *
 * Business Logic:
 * - Validates callback data using the validator
 * - Extracts verification result information
 * - Determines verification success based on images and result codes
 * - Updates seller verification status and documents
 * - Tracks verification completion with analytics
 * - Sends confirmation email to seller
 *
 * Success Criteria:
 * - Must have images in the result
 * - Must have successful result codes (1012, 1020, 1021) or success flag
 * - Only marks as verified if both criteria are met
 *
 * @param {Object} verificationResult - The verification result from SmileID
 * @returns {Object} Response object with callback processing result
 */
async function processSmileIdCallback(verificationResult) {
  // Step 1: Validate callback data using the validator
  // This ensures all required fields are present and valid
  smileIdCallbackValidator.validateSmileIdCallbackData(verificationResult);

  // Step 2: Extract key information from the result
  // This ensures we have all necessary data for processing
  const {
    job_id,
    user_id,
    partner_params,
    ResultCode,
    result_code,
    ResultText,
    result_text,
    job_complete,
    success,
    Images,
    images
  } = verificationResult;

  // Step 3: Handle different result code formats
  // This ensures compatibility with different SmileID response formats
  const resultCode = ResultCode || result_code;
  const resultText = ResultText || result_text;

  // Step 4: Determine if verification was actually successful
  // This ensures we only mark as verified if truly successful
  const isSuccessful = isVerificationSuccessful(verificationResult);

  // Step 5: Process successful verification if applicable
  // This updates seller records and sends notifications
  if (isSuccessful && partner_params?.seller_id) {
    const sellerId = partner_params.seller_id;
    const accountType = partner_params.account_type;
    
    // Step 6: Retrieve seller information from repository
    // This ensures we have the latest seller information
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Step 7: Store SmileID verification result
    // This saves the verification result for future reference
    seller.smileIdVerification = {
      type: accountType,
      provider: 'SmileID',
      result: verificationResult,
      verifiedAt: new Date(),
      status: 'verified'
    };

    // Step 8: Set verification documents as filled and mark as verified
    // This marks that verification documents have been submitted and verified
    seller.hasFilledVerificationDocuments = true;
    seller.isVerified = true;

    // Step 9: Save the updated seller record
    // This persists the verification result
    await sellerRepository.save(seller);

    // Step 10: Track verification completion with analytics
    // This provides insights into verification success rates
    trackVerificationCompletion(sellerId, seller, accountType, resultCode, job_id);

    // Step 11: Send confirmation email to seller
    // This notifies the seller about their verification status
    await sendVerificationEmail(seller, accountType, job_id, resultCode);
  }

  // Step 12: Return callback processing result
  // This provides the caller with processing information
  return {
    message: 'Callback received successfully',
    job_id: job_id,
    processed: true,
    assessment: {
      hasImages: hasVerificationImages(verificationResult),
      resultCode: resultCode,
      isSuccessful: isSuccessful
    }
  };
}

module.exports = {
  processSmileIdCallback,
};
