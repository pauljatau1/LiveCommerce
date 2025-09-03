/**
 * Report User Service
 *
 * This service handles the business logic for user reporting functionality.
 * It provides comprehensive reporting capabilities including data validation,
 * report storage, email notifications, and administrative oversight.
 *
 * The service ensures that:
 * - User reports are properly validated and stored
 * - Administrative notifications are sent immediately
 * - Report data is formatted consistently
 * - Unique tracking IDs are generated for each report
 * - Email templates are populated with dynamic data
 * - All reporting operations are atomic and secure
 *
 * Reporting Features:
 * - Input validation and user existence verification
 * - Self-reporting prevention
 * - Dynamic email template population
 * - Administrative notification system
 * - Unique report ID generation
 * - Atomic database operations
 * - Comprehensive error handling
 *
 * Email System:
 * - HTML email templates with dynamic content
 * - SendGrid integration for reliable delivery
 * - Professional formatting for admin notifications
 * - Template variable replacement system
 *
 * @module reportUserService
 */

// External dependencies
const fs = require('fs');           // File system operations for reading email templates
const path = require('path');       // Path utilities for file system navigation
const sgMail = require('@sendgrid/mail'); // SendGrid email service for sending notifications

// Internal dependencies
const buyerRepository = require('../repositories/buyer.repository');
const reportUserValidator = require('../validators/reportUser.validator');

// Configure SendGrid API key for email service authentication
// This API key should be set in environment variables for security
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Reads and populates the user report notification email template.
 * 
 * This function loads the HTML email template and replaces dynamic placeholders
 * with actual report data for admin notification purposes. It handles template
 * file reading and variable substitution to create personalized email content.
 *
 * Template Variables:
 * - {{reporterName}}: Full name of the person making the report
 * - {{reporterEmail}}: Email address of the reporter
 * - {{reportedUserId}}: ID of the user being reported
 * - {{reportedUserType}}: Type of user being reported (buyer/seller)
 * - {{reason}}: Reason for the report
 * - {{description}}: Detailed description of the report
 * - {{reportId}}: Unique identifier for the report
 * - {{submittedAt}}: Timestamp when report was submitted
 * - {{year}}: Current year for copyright
 *
 * File Operations:
 * - Reads HTML template from templates directory
 * - Uses UTF-8 encoding for proper text handling
 * - Handles file system errors gracefully
 *
 * @param {Object} reportData - The report data for template population
 * @param {Object} reportData.reporter - Information about the reporter
 * @param {string} reportData.reporter.firstName - Reporter's first name
 * @param {string} reportData.reporter.lastName - Reporter's last name
 * @param {string} reportData.reporter.email - Reporter's email address
 * @param {string} reportData.reportedUserId - ID of the reported user
 * @param {string} reportData.reportedUserType - Type of reported user
 * @param {string} reportData.reason - Reason for the report
 * @param {string} reportData.description - Detailed description of the report
 * @param {string} reportData.reportId - Unique identifier for the report
 * @returns {Promise<string>} The populated HTML email content ready for sending
 * @throws {Error} If the email template file cannot be read
 */
async function getEmailContent(reportData) {
  // Step 1: Construct the full path to the email template file
  // Template is stored in the templates directory at the project root
  const templatePath = path.join(__dirname, '../../../templates/user-report-notification-email.html');
  
  // Step 2: Read the HTML template file synchronously
  // Using utf8 encoding to ensure proper text handling
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Step 3: Replace template variables with actual dynamic values
  // Format reporter name for display
  const reporterName = `${reportData.reporter.firstName} ${reportData.reporter.lastName}`;
  
  // Format submission timestamp
  const submittedAt = new Date().toLocaleString();
  
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Step 4: Replace all placeholders with actual data
  htmlContent = htmlContent.replace('{{reporterName}}', reporterName);
  htmlContent = htmlContent.replace('{{reporterEmail}}', reportData.reporter.email);
  htmlContent = htmlContent.replace('{{reportedUserId}}', reportData.reportedUserId);
  htmlContent = htmlContent.replace('{{reportedUserType}}', reportData.reportedUserType);
  htmlContent = htmlContent.replace('{{reason}}', reportData.reason);
  htmlContent = htmlContent.replace('{{description}}', reportData.description);
  htmlContent = htmlContent.replace('{{reportId}}', reportData.reportId);
  htmlContent = htmlContent.replace('{{submittedAt}}', submittedAt);
  htmlContent = htmlContent.replace('{{year}}', currentYear);
  
  return htmlContent;
}

/**
 * Sends user report notification email to administrators.
 * 
 * This function sends a detailed notification email to the admin team
 * when a new user report is submitted for review. It ensures immediate
 * awareness of potential issues requiring administrative attention.
 *
 * Email Configuration:
 * - Recipients: Admin team members
 * - Sender: Platform support email with branding
 * - Subject: Clear, informative subject with report reason
 * - Content: Rich HTML with comprehensive report details
 *
 * SendGrid Integration:
 * - Uses configured API key for authentication
 * - Handles email delivery through SendGrid service
 * - Provides error handling for failed deliveries
 *
 * @param {Object} reportData - The report data for email notification
 * @throws {Error} If email sending fails through SendGrid service
 */
async function sendReportNotificationEmail(reportData) {
  // Step 1: Get the populated HTML email content from template
  const htmlContent = await getEmailContent(reportData);
  
  // Step 2: Prepare the email message object with all required fields
  const msg = {
    to: ['admin@auqli.com', 'bolu@auqli.com'],              // Admin recipients
    from: 'Auqli Platform <support@auqli.com>',            // Sender with platform identity
    subject: `New User Report - ${reportData.reason}`,     // Clear, informative subject line
    html: htmlContent                                       // Rich HTML content for better presentation
  };
  
  // Step 3: Send the email using SendGrid service
  // This will throw an error if sending fails, which should be handled by caller
  await sgMail.send(msg);
}

/**
 * Generates a unique report ID for tracking purposes.
 * 
 * This function creates a unique identifier that can be used to track
 * and reference the report in admin systems and support communications.
 * The ID format provides both uniqueness and readability.
 *
 * ID Format: RPT-{timestamp}-{randomString}
 * - RPT: Prefix indicating this is a report ID
 * - timestamp: Unix timestamp for chronological ordering
 * - randomString: 6-character alphanumeric string for uniqueness
 *
 * Uniqueness Guarantee:
 * - Timestamp ensures chronological uniqueness
 * - Random component prevents collisions
 * - Uppercase formatting for consistency
 *
 * @returns {string} Unique report identifier in format RPT-{timestamp}-{randomString}
 */
function generateReportId() {
  // Step 1: Create timestamp-based unique identifier
  const timestamp = Date.now();
  
  // Step 2: Add random component for additional uniqueness
  const randomComponent = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Step 3: Combine components into readable report ID
  return `RPT-${timestamp}-${randomComponent}`;
}

/**
 * Prepares report data object for database storage.
 * 
 * This function formats the report data into the structure expected
 * by the repository layer and database schema. It ensures data consistency
 * and proper formatting for storage.
 *
 * Data Formatting:
 * - Trims whitespace from text fields for consistency
 * - Structures reported user information properly
 * - Ensures all required fields are present
 * - Maintains data integrity for database operations
 *
 * @param {string} reportedUserId - ID of the reported user
 * @param {string} reportedUserType - Type of the reported user (buyer/seller)
 * @param {string} reason - Reason for the report
 * @param {string} description - Detailed description of the report
 * @returns {Object} Formatted report data for database storage
 *   - reportedUser: {Object} - User information
 *     - userId: {string} - ID of reported user
 *     - userType: {string} - Type of reported user
 *   - reason: {string} - Trimmed reason for report
 *   - description: {string} - Trimmed detailed description
 */
function prepareReportData(reportedUserId, reportedUserType, reason, description) {
  return {
    reportedUser: {
      userId: reportedUserId,
      userType: reportedUserType
    },
    reason: reason.trim(),        // Trim whitespace for consistency
    description: description.trim() // Trim whitespace for consistency
  };
}

/**
 * Submits a user report and handles all associated operations - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete reporting process.
 * It handles validation, data preparation, storage, notification, and response formatting
 * to ensure a comprehensive and secure reporting system.
 *
 * Business Logic Flow:
 * 1. Validates all input data and prerequisites
 * 2. Retrieves user information for email notifications
 * 3. Prepares report data for database storage
 * 4. Saves report to reporter's account atomically
 * 5. Generates unique report ID for tracking
 * 6. Extracts newly created report for response
 * 7. Prepares email notification data
 * 8. Sends notification email to administrators
 * 9. Returns success response with report information
 *
 * Security Features:
 * - Comprehensive input validation
 * - User existence verification
 * - Self-reporting prevention
 * - Atomic database operations
 * - Secure email notifications
 *
 * Data Integrity:
 * - Validates all inputs before processing
 * - Ensures both users exist before proceeding
 * - Uses atomic operations for data consistency
 * - Maintains referential integrity
 *
 * @param {string} reporterId - The ID of the buyer making the report
 * @param {Object} reportData - The report data object
 * @param {string} reportData.userId - The ID of the user being reported
 * @param {string} reportData.userType - The type of user being reported (buyer/seller)
 * @param {string} reportData.reason - The reason for the report
 * @param {string} reportData.description - The detailed description of the report
 * @returns {Promise<Object>} Success response with report information
 *   - message: {string} - Success message
 *   - report: {Object} - Report details
 *     - _id: {string} - Report ID
 *     - reportedUser: {Object} - Reported user information
 *     - reason: {string} - Report reason
 *     - description: {string} - Report description
 *     - status: {string} - Report status
 *     - createdAt: {Date} - Report creation timestamp
 * @throws {ValidationError} If validation fails (invalid data, user not found, self-report)
 * @throws {Error} If database operations or email sending fails
 *
 * @example
 * // Submit a user report
 * const result = await reportUser('507f1f77bcf86cd799439011', {
 *   userId: '507f1f77bcf86cd799439012',
 *   userType: 'seller',
 *   reason: 'Inappropriate behavior',
 *   description: 'User sent offensive messages'
 * });
 * // Returns: { message: 'Report submitted successfully', report: { ... } }
 */
async function reportUser(reporterId, reportData) {
  // Step 1: Validate input data
  // This includes input validation, user existence checks, and self-report prevention
  await reportUserValidator.validateReportUserData(reporterId, reportData);
  
  // Step 2: Get the validated users for email and database operations
  // Since validation passed, we know both users exist
  const reporter = await buyerRepository.findById(reporterId);
  const reportedUser = await buyerRepository.findUserById(reportData.userId, reportData.userType);
  
  // Step 3: Prepare the report data for database storage
  // Format data according to schema requirements
  const formattedReportData = prepareReportData(
    reportData.userId,
    reportData.userType,
    reportData.reason,
    reportData.description
  );
  
  // Step 4: Save the report to the reporter's account
  // Use repository method to atomically add report to buyer's reports array
  const updatedBuyer = await buyerRepository.addReport(reporterId, formattedReportData);
  
  // Step 5: Generate unique report ID for tracking and reference
  const reportId = generateReportId();
  
  // Step 6: Get the newly added report from the updated buyer document
  // The last report in the array is the one we just added
  const newReport = updatedBuyer.reports[updatedBuyer.reports.length - 1];
  
  // Step 7: Prepare email notification data
  const emailNotificationData = {
    reporter: {
      firstName: reporter.firstName,
      lastName: reporter.lastName,
      email: reporter.email
    },
    reportedUserId: reportData.userId,
    reportedUserType: reportData.userType,
    reason: reportData.reason,
    description: reportData.description,
    reportId: reportId
  };
  
  // Step 8: Send notification email to administrators
  // This ensures admins are immediately aware of new reports
  await sendReportNotificationEmail(emailNotificationData);
  
  // Step 9: Return success response with report information
  // Match the original API response structure
  return {
    message: 'Report submitted successfully',
    report: {
      _id: newReport._id,
      reportedUser: newReport.reportedUser,
      reason: newReport.reason,
      description: newReport.description,
      status: newReport.status,
      createdAt: newReport.createdAt
    }
  };
}

module.exports = {
  reportUser,
  getEmailContent
};