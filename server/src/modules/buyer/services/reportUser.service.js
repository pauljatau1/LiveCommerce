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
 * This function loads the HTML email template and replaces dynamic placeholders
 * with actual report data for admin notification purposes.
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
  // Construct the full path to the email template file
  // Template is stored in the templates directory at the project root
  const templatePath = path.join(__dirname, '../../../templates/user-report-notification-email.html');
  
  // Read the HTML template file synchronously
  // Using utf8 encoding to ensure proper text handling
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace template variables with actual dynamic values
  // Format reporter name for display
  const reporterName = `${reportData.reporter.firstName} ${reportData.reporter.lastName}`;
  
  // Format submission timestamp
  const submittedAt = new Date().toLocaleString();
  
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Replace all placeholders with actual data
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
 * This function sends a detailed notification email to admin team
 * when a new user report is submitted for review.
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
 * This function creates a unique identifier that can be used
 * to track and reference the report in admin systems.
 * 
 * @returns {string} Unique report identifier
 */
function generateReportId() {
  // Create timestamp-based unique identifier
  const timestamp = Date.now();
  
  // Add random component for additional uniqueness
  const randomComponent = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Combine components into readable report ID
  return `RPT-${timestamp}-${randomComponent}`;
}

/**
 * Prepares report data object for database storage.
 * This function formats the report data into the structure
 * expected by the repository layer.
 * 
 * @param {string} reportedUserId - ID of the reported user
 * @param {string} reportedUserType - Type of the reported user
 * @param {string} reason - Reason for the report
 * @param {string} description - Detailed description of the report
 * @returns {Object} Formatted report data for database storage
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
 * Submits a user report and handles all associated operations.
 * This is the main service function that orchestrates the complete reporting process:
 * 1. Validates all input data and prerequisites
 * 2. Prepares report data for storage
 * 3. Saves report to reporter's account
 * 4. Generates unique report ID for tracking
 * 5. Sends notification email to administrators
 * 
 * @param {string} reporterId - The ID of the buyer making the report
 * @param {Object} reportData - The report data object
 * @param {string} reportData.userId - The ID of the user being reported
 * @param {string} reportData.userType - The type of user being reported
 * @param {string} reportData.reason - The reason for the report
 * @param {string} reportData.description - The detailed description of the report
 * @returns {Promise<Object>} Success response with report information
 * @throws {ValidationError} If validation fails
 */
async function reportUser(reporterId, reportData) {
  // Step 1: Validate input data and retrieve validated users
  // This includes input validation, user existence checks, and self-report prevention
  const { reporter, reportedUser } = await reportUserValidator.validateReportUserData(reporterId, reportData);
  
  // Step 2: Prepare the report data for database storage
  // Format data according to schema requirements
  const formattedReportData = prepareReportData(
    reportData.userId,
    reportData.userType,
    reportData.reason,
    reportData.description
  );
  
  // Step 3: Save the report to the reporter's account
  // Use repository method to atomically add report to buyer's reports array
  const updatedBuyer = await buyerRepository.addReport(reporterId, formattedReportData);
  
  // Step 4: Generate unique report ID for tracking and reference
  const reportId = generateReportId();
  
  // Step 5: Get the newly added report from the updated buyer document
  // The last report in the array is the one we just added
  const newReport = updatedBuyer.reports[updatedBuyer.reports.length - 1];
  
  // Step 6: Prepare email notification data
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
  
  // Step 7: Send notification email to administrators
  // This ensures admins are immediately aware of new reports
  await sendReportNotificationEmail(emailNotificationData);
  
  // Step 8: Return success response with report information
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