/**
 * Termii Email Service
 *
 * This service handles sending templated emails via the Termii Email API.
 * It provides a clean interface for sending password reset emails and other
 * templated notifications using Termii's email template system.
 *
 * The service ensures that:
 * - Email templates are properly configured on Termii dashboard
 * - Dynamic variables are correctly mapped to template placeholders
 * - API requests are properly formatted and authenticated
 * - Error handling maintains system integrity
 * - Response validation ensures successful delivery
 *
 * Email Template System:
 * - Templates are created and managed on Termii dashboard
 * - Variables are passed as key-value objects
 * - Template IDs and configuration IDs are stored in environment variables
 * - Supports dynamic content insertion via template variables
 *
 * API Configuration:
 * - Endpoint: /api/templates/send-email
 * - Method: POST
 * - Authentication: API key in request body
 * - Content-Type: application/json
 *
 * Environment Variables Required:
 * - TERMII_API_URL: The base URL for Termii API (e.g., https://api.ng.termii.com)
 * - TERMII_API_KEY: Your Termii API key from the dashboard
 *
 * Hardcoded Configuration:
 * - Template ID: de58adb8-761f-4bcf-b514-a580074fff42
 * - Email Configuration ID: 57cc65e1-3708-407a-95ed-ceceea3bd36d
 * - The template should have {{email_body}} variable placeholder for raw HTML emails
 *
 * @module termiiEmailService
 */

const termiiAPI = require('../config/termii');
require('dotenv').config();

// Hardcoded Termii email template ID for password reset emails
// This template should have {{email_body}} variable placeholder
// Hardcoded Termii email template ID for password reset emails
// This template should have {{email_body}} variable placeholder
const TERMII_EMAIL_TEMPLATE_ID = 'de58adb8-761f-4bcf-b514-a580074fff42';

// Hardcoded Termii email configuration ID
const TERMII_EMAIL_CONFIGURATION_ID = '57cc65e1-3708-407a-95ed-ceceea3bd36d';

// Termii Transactional Email Template ID
// Template Category: TRANSACTIONAL
// Variables: {{name}}, {{message}}
const TERMII_TRANSACTIONAL_TEMPLATE_ID = 'de58adb8-761f-4bcf-b514-a580074fff42';

/**
 * Send a templated email via Termii Email API.
 *
 * This function sends an email using a pre-configured template on the Termii
 * dashboard. The template can contain dynamic variables that are replaced with
 * actual values at send time.
 *
 * Email Sending Process:
 * - Validates required environment variables
 * - Constructs API request payload with template configuration
 * - Maps dynamic variables to template placeholders
 * - Sends request to Termii Email API
 * - Validates response for successful delivery
 * - Returns success confirmation or throws error
 *
 * Template Variables:
 * - Variables are passed as a key-value object
 * - Each key corresponds to a variable name in the template (e.g., {{name}})
 * - Values are the actual content to replace the placeholders
 * - Template must be configured on Termii dashboard with matching variable names
 *
 * Error Handling:
 * - Validates environment variables before making API call
 * - Handles API errors gracefully
 * - Provides meaningful error messages
 * - Maintains security by not exposing internal API details
 *
 * @param {Object} emailData - Email sending configuration object
 * @param {string} emailData.email - Recipient email address
 * @param {string} emailData.subject - Email subject line
 * @param {string} emailData.templateId - Termii template ID (optional, uses default if not provided)
 * @param {string} emailData.emailConfigurationId - Email configuration ID (optional, uses default if not provided)
 * @param {Object} emailData.variables - Key-value object with template variables
 * @returns {Promise<Object>} Termii API response object with:
 *   - code: {string} - Response code (e.g., "ok")
 *   - message: {string} - Response message
 *   - message_id: {string} - Unique message identifier
 *   - balance: {string} - Remaining account balance
 *   - user: {string} - User identifier
 * @throws {Error} If environment variables are missing or API call fails
 *
 * @example
 * // Send password reset email
 * const result = await sendTemplatedEmail({
 *   email: 'user@example.com',
 *   subject: 'Password Reset Code - Auqli',
 *   variables: {
 *     name: 'John Doe',
 *     otp: '1234',
 *     year: '2024'
 *   }
 * });
 *
 * @example
 * // Send email with custom template
 * const result = await sendTemplatedEmail({
 *   email: 'user@example.com',
 *   subject: 'Welcome to Auqli',
 *   templateId: 'custom-template-id',
 *   variables: {
 *     customer_name: 'Jane Doe',
 *     company_name: 'Auqli'
 *   }
 * });
 */
async function sendTemplatedEmail(emailData) {
  // Step 1: Validate required environment variables
  // This ensures all necessary Termii configuration is present
  if (!process.env.TERMII_API_KEY) {
    throw new Error('TERMII_API_KEY is not configured in environment variables');
  }

  // Step 2: Extract email data with defaults
  // This allows flexibility while maintaining required fields
  // Template ID and email configuration ID are hardcoded but can be overridden if needed
  const {
    email,
    subject,
    templateId = TERMII_EMAIL_TEMPLATE_ID,
    emailConfigurationId = TERMII_EMAIL_CONFIGURATION_ID,
    variables = {}
  } = emailData;

  // Step 3: Validate required fields
  if (!email || !subject || !templateId || !emailConfigurationId) {
    console.error('Missing required fields for Termii email:', { email: !!email, subject: !!subject, templateId: !!templateId, emailConfigurationId: !!emailConfigurationId });
    return { code: 'error', message: 'Missing required configuration', failed: true };
  }

  // Step 4: Construct Termii API request payload
  // This formats the request according to Termii Email API specification
  const payload = {
    api_key: process.env.TERMII_API_KEY,
    email: email,
    subject: subject,
    email_configuration_id: emailConfigurationId,
    template_id: templateId,
    variables: variables
  };

  try {
    // Step 5: Send email via Termii Email API
    // The endpoint /api/templates/send-email handles templated email sending
    const response = await termiiAPI.post('/api/templates/send-email', payload);

    // Step 6: Validate successful response from Termii API
    // Termii returns { code: 'ok', message: 'Successfully Sent', ... } on success
    if (response.data && response.data.code === 'ok') {
      return response.data;
    } else {
      // If response doesn't indicate success, log error and return safe response
      console.error(`Termii email attempt failed: ${response.data?.message || 'Invalid response from Termii API'}`);
      return {
        code: 'error',
        message: response.data?.message || 'Invalid response from Termii API',
        failed: true
      };
    }
  } catch (error) {
    // Step 7: Handle errors from Termii API
    // Log error details for debugging while maintaining security
    console.error('Error sending email via Termii:', error.response?.data || error.message);

    // Return safe error object instead of throwing
    return {
      code: 'error',
      message: `Failed to send email. Please try again later. ${error.response?.data?.message || error.message}`,
      failed: true
    };
  }
}

/**
 * Send email with raw HTML content via Termii Email API.
 *
 * This function allows you to send emails with raw HTML content (like SendGrid),
 * by using a Termii template with a single variable placeholder.
 *
 * Template Configuration:
 * - Uses hardcoded template ID: de58adb8-761f-4bcf-b514-a580074fff42
 * - The template should have {{email_body}} variable placeholder
 * - This way, you can keep your HTML email body in your code and pass it as a variable
 *
 * @param {Object} emailData - Email sending configuration object
 * @param {string} emailData.email - Recipient email address
 * @param {string} emailData.subject - Email subject line
 * @param {string} emailData.html - Raw HTML content for the email body
 * @param {string} emailData.templateId - Termii template ID (optional, uses hardcoded default)
 * @param {string} emailData.emailConfigurationId - Email configuration ID (optional, uses hardcoded default)
 * @param {string} emailData.bodyVariableName - Name of the variable in template (default: 'email_body')
 * @returns {Promise<Object>} Termii API response object
 * @throws {Error} If email sending fails
 *
 * @example
 * // Send email with raw HTML
 * const result = await sendRawHTMLEmail({
 *   email: 'user@example.com',
 *   subject: 'Password Reset Code - Auqli',
 *   html: '<div>Your OTP is: 1234</div>'
 * });
 */
async function sendRawHTMLEmail(emailData) {
  // Step 1: Extract email data with defaults
  // Template ID and email configuration ID are hardcoded but can be overridden if needed
  const {
    email,
    subject,
    html,
    templateId = TERMII_EMAIL_TEMPLATE_ID,
    emailConfigurationId = TERMII_EMAIL_CONFIGURATION_ID,
    bodyVariableName = 'message'
  } = emailData;

  // Step 2: Validate required fields
  if (!email || !subject || !html || !templateId || !emailConfigurationId) {
    console.error('Missing required fields for Termii raw HTML email:', { email: !!email, subject: !!subject, html: !!html, templateId: !!templateId, emailConfigurationId: !!emailConfigurationId });
    return { code: 'error', message: 'Missing required configuration', failed: true };
  }

  // Step 3: Send email using template with HTML body as variable
  // The template should have {{message}} (or your custom variable name) placeholder
  return await sendTemplatedEmail({
    email: email,
    subject: subject,
    templateId: templateId,
    emailConfigurationId: emailConfigurationId,
    variables: {
      [bodyVariableName]: html,
      name: '' // Default name to empty string as requested
    }
  });
}

/**
 * Send password reset email via Termii Email API.
 *
 * This function supports two modes:
 * 1. Using raw HTML (like SendGrid) - pass html parameter
 * 2. Using template variables - pass resetOTP and let template handle formatting
 *
 * Password Reset Email Features:
 * - Supports raw HTML content (like SendGrid)
 * - Also supports templated emails with variables
 * - Provides consistent email formatting
 * - Handles errors gracefully
 *
 * @param {Object} resetData - Password reset email data
 * @param {string} resetData.email - Recipient email address
 * @param {string} resetData.resetOTP - The password reset OTP code (required if html not provided)
 * @param {string} resetData.html - Raw HTML email body (optional, if provided, uses this instead of template)
 * @param {string} resetData.userName - User's name (optional, for template variables)
 * @param {string} resetData.subject - Email subject line (optional, uses default)
 * @returns {Promise<Object>} Termii API response object
 * @throws {Error} If email sending fails
 *
 * @example
 * // Send password reset email with raw HTML (like SendGrid)
 * const result = await sendPasswordResetEmail({
 *   email: 'user@example.com',
 *   subject: 'Password Reset Code - Auqli',
 *   html: '<div>Your reset code is: 1234</div>'
 * });
 *
 * @example
 * // Send password reset email using template variables
 * const result = await sendPasswordResetEmail({
 *   email: 'user@example.com',
 *   resetOTP: '1234',
 *   userName: 'John Doe'
 * });
 */
async function sendPasswordResetEmail(resetData) {
  // Step 1: Extract reset data with defaults
  const {
    email,
    resetOTP,
    html,
    userName,
    subject = 'Password Reset Code - Auqli'
  } = resetData;

  // Step 2: Validate required fields
  if (!email) {
    throw new Error('Recipient email address is required');
  }

  // Step 3: If raw HTML is provided, use it (like SendGrid)
  // This allows you to keep your HTML in code
  if (html) {
    return await sendRawHTMLEmail({
      email: email,
      subject: subject,
      html: html
    });
  }

  // Step 4: Otherwise, use template variables (original behavior)
  if (!resetOTP) {
    throw new Error('Reset OTP code is required when html is not provided');
  }

  // Step 5: Map reset data to template variables
  // This creates the variables object that will replace placeholders in the template
  // The variable names should match what's configured in the Termii template
  const variables = {
    otp: resetOTP,
    reset_code: resetOTP, // Support both naming conventions
    year: new Date().getFullYear().toString()
  };

  // Add user name if provided
  if (userName) {
    variables.name = userName;
    variables.user_name = userName; // Support both naming conventions
  }

  // Step 6: Send email using the templated email function
  return await sendTemplatedEmail({
    email: email,
    subject: subject,
    variables: variables
  });
}

/**
 * Send a transactional email using the general Termii template.
 *
 * Template ID: de58adb8-761f-4bcf-b514-a580074fff42
 * Variables: {{name}}, {{message}}
 *
 * @param {Object} emailData - Email data
 * @param {string} emailData.email - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.message - The main message content
 * @param {string} [emailData.name] - User's name (optional, defaults to empty string)
 */
async function sendTransactionalEmail(emailData) {
  const {
    email,
    subject,
    message,
    name = '',
    emailConfigurationId = TERMII_EMAIL_CONFIGURATION_ID
  } = emailData;

  if (!email) throw new Error('Recipient email address is required');
  if (!subject) throw new Error('Email subject is required');
  if (!message) throw new Error('Email message is required');

  return await sendTemplatedEmail({
    email,
    subject,
    templateId: TERMII_TRANSACTIONAL_TEMPLATE_ID,
    emailConfigurationId,
    variables: {
      name,
      message
    }
  });
}

// Export service functions for use in other modules
module.exports = {
  sendTemplatedEmail,
  sendRawHTMLEmail,
  sendPasswordResetEmail,
  sendTransactionalEmail
};

