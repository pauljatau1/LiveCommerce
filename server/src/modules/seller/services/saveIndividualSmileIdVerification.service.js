/**
 * Save Individual SmileID Verification Service
 *
 * This service handles the business logic for saving individual SmileID verification results.
 * It processes verification data, determines success status, and updates seller records.
 *
 * Business Logic:
 * - Validates input data using the validator
 * - Retrieves seller information from repository
 * - Analyzes SmileID result for success indicators
 * - Updates seller verification status and documents
 * - Tracks verification completion with analytics
 * - Sends confirmation email to seller
 *
 * Success Criteria:
 * - Must have images in the result
 * - Must have successful result codes (1012, 1020, 1021) or success flag
 * - Only marks as verified if both criteria are met
 *
 * @module saveIndividualSmileIdVerificationService
 */

const sellerRepository = require('../repositories/seller.repository');
const saveIndividualSmileIdVerificationValidator = require('../validators/saveIndividualSmileIdVerification.validator');
const mixpanel = require('../../../config/mixpanel');
const termiiEmailService = require('../../../services/termiiEmailService');
const fs = require('fs');

/**
 * Check if SmileID result has images.
 *
 * This function validates that the SmileID result contains images.
 *
 * @param {Object} smileIdResult - The SmileID verification result
 * @returns {boolean} True if images are present and not empty
 */
function hasVerificationImages(smileIdResult) {
  return !!(smileIdResult.images && smileIdResult.images.length > 0);
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
  return !!(smileIdResult.ResultCode && successCodes.includes(smileIdResult.ResultCode.toString()));
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
 * Track verification completion with Mixpanel.
 *
 * This function sends analytics data to Mixpanel for tracking
 * verification completion events.
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} seller - The seller object
 * @param {string} verificationProvider - The verification provider
 * @param {boolean} isActuallySuccessful - Whether verification was successful
 * @param {string} verifiedAt - The verification timestamp
 */
function trackVerificationCompletion(sellerId, seller, verificationProvider, isActuallySuccessful, verifiedAt) {
  mixpanel.track('seller_individual_smileid_verification', {
    distinct_id: sellerId,
    sellerId: sellerId,
    sellerName: `${seller.firstName} ${seller.lastName}`,
    email: seller.email,
    verificationProvider: verificationProvider,
    verificationStatus: isActuallySuccessful ? 'verified' : 'failed',
    verifiedAt: verifiedAt
  });
}

/**
 * Send verification confirmation email.
 *
 * This function sends a confirmation email to the seller
 * about their verification status using HTML template.
 *
 * @param {Object} seller - The seller object
 * @param {boolean} isActuallySuccessful - Whether verification was successful
 */
async function sendVerificationEmail(seller, isActuallySuccessful) {
  // Step 1: Get the email content with processed HTML template
  const emailContent = getVerificationEmailContent(seller, isActuallySuccessful);

  // Step 2: Send the email using Termii email service
  await termiiEmailService.sendRawHTMLEmail({
    email: emailContent.to,
    subject: emailContent.subject,
    html: emailContent.html
  });
}

/**
 * Constructs the verification email content for sellers.
 *
 * This function reads the HTML email template and replaces dynamic placeholders
 * with actual values to create personalized verification emails for sellers.
 *
 * Template Processing:
 * - Reads HTML template from file system
 * - Replaces dynamic placeholders with actual values
 * - Handles UTF-8 encoding for proper text display
 * - Creates professional email structure
 *
 * Template Variables:
 * - {{firstName}}: The seller's first name
 * - {{statusColor}}: Color for status (green for success, red for failure)
 * - {{statusText}}: Status text (Successful/Failed)
 * - {{statusMessage}}: Status message (completed successfully/unsuccessful)
 * - {{nextStepsMessage}}: Next steps message based on status
 * - {{statusTitle}}: Title for the status section
 * - {{statusDescription}}: Description for the status section
 * - {{additionalInfo}}: Additional information based on status
 * - {{year}}: Current year for copyright and branding
 *
 * @param {Object} seller - The seller object
 * @param {boolean} isActuallySuccessful - Whether verification was successful
 * @returns {Object} SendGrid-compatible email content object
 *   - to: recipient email address
 *   - from: sender information with platform branding
 *   - subject: clear email subject line
 *   - html: processed HTML template content
 * @throws {Error} If template file cannot be read or processed
 */
function getVerificationEmailContent(seller, isActuallySuccessful) {
  // Step 1: Construct the path to the verification email template
  const filePath = __dirname + '/../../../templates/seller-verification-email.html';

  // Step 2: Read the HTML template file synchronously
  // Using UTF-8 encoding to ensure proper text handling
  let html = fs.readFileSync(filePath, 'utf-8');

  // Step 3: Prepare template variables based on verification status
  const statusColor = isActuallySuccessful ? '#4CAF50' : '#f44336';
  const statusText = isActuallySuccessful ? 'Successful' : 'Failed';
  const statusMessage = isActuallySuccessful ? 'completed successfully' : 'unsuccessful';
  const nextStepsMessage = isActuallySuccessful
    ? 'You can now continue with your seller onboarding process.'
    : 'Please try again or contact support for assistance.';
  const statusTitle = isActuallySuccessful ? 'Verification Complete!' : 'Verification Failed';
  const statusDescription = isActuallySuccessful
    ? 'Your identity has been successfully verified. You can now proceed with your seller account setup.'
    : 'We were unable to verify your identity. Please check your documents and try again.';
  const additionalInfo = isActuallySuccessful
    ? '<p style="font-size: 14px; color: #4CAF50; margin: 0;">✓ You can now upload products and start selling</p>'
    : '<p style="font-size: 14px; color: #f44336; margin: 0;">⚠ Please ensure your documents are clear and valid</p>';

  // Step 4: Replace template placeholders with actual data
  html = html.replace('{{firstName}}', seller.firstName);
  html = html.replace('{{statusColor}}', statusColor);
  html = html.replace('{{statusText}}', statusText);
  html = html.replace('{{statusMessage}}', statusMessage);
  html = html.replace('{{nextStepsMessage}}', nextStepsMessage);
  html = html.replace('{{statusTitle}}', statusTitle);
  html = html.replace('{{statusDescription}}', statusDescription);
  html = html.replace('{{additionalInfo}}', additionalInfo);
  html = html.replace('{{year}}', new Date().getFullYear());

  // Step 5: Return SendGrid-compatible email object
  return {
    to: seller.email,
    from: 'Auqli Nigeria <support@auqli.com>',
    subject: 'Identity Verification Completed',
    html
  };
}

/**
 * Save individual SmileID verification result.
 *
 * This function processes and saves individual SmileID verification results
 * to the seller's record with proper validation and status determination.
 *
 * Business Logic:
 * - Validates input data using the validator
 * - Retrieves seller information from repository
 * - Analyzes verification result for success indicators
 * - Updates seller verification status and documents
 * - Tracks verification completion with analytics
 * - Sends confirmation email to seller
 *
 * Success Criteria:
 * - Must have images in the result
 * - Must have successful result codes (1012, 1020, 1021) or success flag
 * - Only marks as verified if both criteria are met
 *
 * @param {Object} data - The verification data object
 * @param {string} sellerId - The seller's ID
 * @returns {Object} Response object with verification result and status
 */
async function saveIndividualSmileIdVerification(data, sellerId) {
  // Step 1: Validate input data using the validator
  // This ensures all required fields are present and valid
  saveIndividualSmileIdVerificationValidator.validateSaveIndividualSmileIdVerificationData(data);

  // Step 2: Retrieve seller information from repository
  // This ensures we have the latest seller information
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 3: Determine if verification was actually successful
  // This ensures we only mark as verified if truly successful
  const isActuallySuccessful = isVerificationSuccessful(data.smileIdResult);

  console.log(`Individual verification assessment: hasImages=${hasVerificationImages(data.smileIdResult)}, resultCode=${data.smileIdResult.ResultCode}, isActuallySuccessful=${isActuallySuccessful}`);

  // Step 4: Store SmileID verification result
  // This saves the verification result for future reference
  seller.smileIdVerification = {
    type: 'individual',
    provider: data.verificationProvider,
    result: data.smileIdResult,
    verifiedAt: new Date(data.verifiedAt),
    status: isActuallySuccessful ? 'verified' : 'failed'
  };

  // Step 5: Set verification documents as filled
  // This marks that verification documents have been submitted
  seller.hasFilledVerificationDocuments = true;

  // Step 6: Only set verified if actually successful
  // This ensures verification status is accurate
  if (isActuallySuccessful) {
    seller.isVerified = true;
  }

  // Step 7: Save the updated seller record
  // This persists the verification result
  await sellerRepository.save(seller);

  // Step 8: Track verification completion with analytics
  // This provides insights into verification success rates
  trackVerificationCompletion(sellerId, seller, data.verificationProvider, isActuallySuccessful, data.verifiedAt);

  // Step 9: Send confirmation email to seller
  // This notifies the seller about their verification status
  await sendVerificationEmail(seller, isActuallySuccessful);

  // Step 10: Return verification result and status
  // This provides the caller with verification information
  return {
    message: 'Individual SmileID verification result saved successfully',
    verification: seller.smileIdVerification,
    actuallySuccessful: isActuallySuccessful
  };
}

module.exports = {
  saveIndividualSmileIdVerification,
};
