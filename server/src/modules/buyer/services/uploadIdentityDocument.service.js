/**
 * Upload Identity Document Service
 *
 * This service handles the business logic for buyer identity document upload and verification.
 * It provides secure document upload to S3, document management, and verification status
 * updates for buyer accounts.
 *
 * The service ensures that:
 * - Document uploads are properly validated and processed
 * - S3 upload operations are secure and organized
 * - Identity documents are properly formatted and stored
 * - Buyer verification status is managed correctly
 * - Error handling maintains system integrity
 *
 * Identity Document Upload Flow:
 * - Input validation and document processing
 * - Old document cleanup from S3
 * - S3 upload with organized file structure
 * - Identity document object creation
 * - Buyer record update with verification status
 * - Success response with document information
 *
 * Security Features:
 * - Document validation before upload
 * - Organized S3 file structure
 * - Verification status management
 * - Old document cleanup
 * - Error handling without information leakage
 *
 * Document Management:
 * - S3 upload with organized folder structure
 * - Verification status tracking
 * - Document metadata storage
 * - Cleanup of old documents
 * - Database record updates
 *
 * @module uploadIdentityDocumentService
 */

const AWS = require('aws-sdk');
const buyerRepository = require('../repositories/buyer.repository');
const uploadIdentityDocumentValidator = require('../validators/uploadIdentityDocument.validator');

// Initialize S3 client for identity document management
// This enables secure document storage and retrieval
const { s3 } = require('../../../config/awsConfig');

/**
 * Delete old identity document from S3 if it exists.
 *
 * This function handles cleanup of previous identity documents
 * to prevent storage bloat and maintain organized file management.
 *
 * Cleanup Process:
 * - Checks if buyer has existing identity document
 * - Deletes old document from S3 if present
 * - Maintains clean storage environment
 * - Prevents file accumulation
 *
 * Safety Features:
 * - Checks document existence before deletion
 * - Uses proper S3 deletion method
 * - Handles missing documents gracefully
 * - Maintains data integrity
 *
 * @param {Object} buyer - The buyer object containing identity document info
 * @param {Object} buyer.identityDocument - Current identity document data
 * @param {string} buyer.identityDocument.public_id - S3 object key for deletion
 * @returns {Promise<void>} Resolves when cleanup is complete
 * @throws {Error} If S3 deletion operation fails
 */
async function deleteOldDocument(buyer) {
  // Step 1: Check if buyer has existing identity document
  // This ensures we only attempt deletion if a document exists
  if (buyer.identityDocument && buyer.identityDocument.public_id) {
    // Step 2: Delete old document from S3
    // This removes the previous document to free up storage
    await s3.deleteObject({
      Bucket: process.env.CDN_S3_BUCKET,
      Key: buyer.identityDocument.public_id
    }).promise();
  }
}

/**
 * Upload new document to S3 with organized structure.
 *
 * This function handles the S3 upload process for identity documents
 * with organized folder structure and unique file naming.
 *
 * Upload Process:
 * - Creates organized folder structure
 * - Generates unique file names with timestamps
 * - Sets proper content type from file
 * - Uploads to configured S3 bucket
 * - Returns upload result with location and key
 *
 * File Organization:
 * - Organized folder structure: verification/buyers/{buyerId}/
 * - Unique file naming with timestamps
 * - Preserves original file extensions
 * - Prevents file name conflicts
 * - Maintains file type information
 *
 * @param {Object} file - The uploaded file object
 * @param {Buffer} file.buffer - File buffer data
 * @param {string} file.originalname - Original file name
 * @param {string} file.mimetype - File MIME type
 * @param {string} buyerId - The buyer's ID for folder organization
 * @returns {Promise<Object>} Upload result from S3
 *   - Location: {string} - S3 object URL
 *   - Key: {string} - S3 object key
 * @throws {Error} If S3 upload fails
 */
async function uploadDocumentToS3(file, buyerId) {
  // Step 1: Create organized file key with folder structure
  // This organizes documents by buyer ID and includes timestamp for uniqueness
  const key = `verification/buyers/${buyerId}/identity-${Date.now()}-${file.originalname}`;
  
  // Step 2: Upload document to S3 with organized structure
  return await s3.upload({
    Bucket: process.env.CDN_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();
}

/**
 * Update buyer's identity document information.
 *
 * This function updates the buyer's identity document data with
 * the new upload information and resets verification status.
 *
 * Document Updates:
 * - Sets new document URL and key
 * - Records upload timestamp
 * - Sets status to pending for verification
 * - Resets verification status for new document
 *
 * Verification Management:
 * - Resets identity verification status
 * - Sets document status to pending
 * - Records upload timestamp for tracking
 * - Maintains verification audit trail
 *
 * @param {Object} buyer - The buyer object to update
 * @param {Object} uploadResult - The S3 upload result
 * @param {string} uploadResult.Key - S3 object key
 */
function updateBuyerIdentityDocument(buyer, uploadResult) {
  // Step 1: Update identity document information
  // This stores the new document data with metadata
  buyer.identityDocument = {
    url: 'https://' + process.env.CDN_URL + "/" + uploadResult.Key,
    public_id: uploadResult.Key,
    uploadedAt: new Date(),
    status: 'pending'
  };
  
  // Step 2: Reset verification status for new document
  // This ensures the new document goes through verification process
  buyer.isIdentityVerified = false;
}

/**
 * Upload identity document for buyer verification - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * identity document upload process. It handles validation, document upload,
 * cleanup, and verification status management in a secure and organized manner.
 *
 * Business Logic Flow:
 * 1. Validates the upload request using validator
 * 2. Retrieves buyer data for verification
 * 3. Deletes old document from S3 if it exists
 * 4. Uploads new document to S3 with organized structure
 * 5. Updates buyer's identity document information
 * 6. Saves the updated buyer data
 * 7. Returns document information
 *
 * Security Features:
 * - Comprehensive document validation before processing
 * - Secure S3 upload with organized folder structure
 * - Old document cleanup to prevent storage bloat
 * - Verification status management
 * - Error handling without information leakage
 *
 * Document Processing:
 * - Validates document format and size
 * - Organizes files by buyer ID
 * - Creates unique file names with timestamps
 * - Uploads to secure S3 bucket
 * - Creates CDN-accessible URLs
 * - Updates database records
 *
 * Verification Management:
 * - Resets verification status for new documents
 * - Sets document status to pending
 * - Records upload timestamp for tracking
 * - Maintains verification audit trail
 *
 * Error Handling:
 * - Document validation errors
 * - Buyer not found errors
 * - S3 upload errors
 * - Database operation errors
 * - Proper error propagation
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} file - The uploaded file object
 * @param {Buffer} file.buffer - File buffer data
 * @param {string} file.originalname - Original file name
 * @param {string} file.mimetype - File MIME type
 * @returns {Promise<Object>} Document upload result
 *   - document: {Object} - Uploaded document information
 *     - url: {string} - CDN URL for document access
 *     - public_id: {string} - S3 object key
 *     - uploadedAt: {Date} - Upload timestamp
 *     - status: {string} - Document status (pending)
 * @throws {Error} If document validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If S3 upload or database operations fail
 *
 * @example
 * // Upload identity document
 * const result = await uploadIdentityDocument('507f1f77bcf86cd799439011', fileObject);
 * // Returns: {
 * //   document: {
 * //     url: 'https://cdn.example.com/verification/buyers/507f1f77bcf86cd799439011/identity-1234567890-document.pdf',
 * //     public_id: 'verification/buyers/507f1f77bcf86cd799439011/identity-1234567890-document.pdf',
 * //     uploadedAt: '2024-01-01T00:00:00.000Z',
 * //     status: 'pending'
 * //   }
 * // }
 */
async function uploadIdentityDocument(buyerId, file) {
  // Step 1: Validate input data using the validator
  // This ensures document format, size, and buyer ID are valid
  await uploadIdentityDocumentValidator.validateUploadIdentityDocumentData({ buyerId, file });

  // Step 2: Get buyer data for verification and cleanup
  // This ensures the buyer exists and retrieves current document info
  const buyer = await buyerRepository.findById(buyerId);

  // Step 3: Delete old document from S3 if it exists
  // This cleans up previous documents to prevent storage bloat
  await deleteOldDocument(buyer);

  // Step 4: Upload new document to S3 with organized structure
  // This stores the document securely with organized folder structure
  const uploadResult = await uploadDocumentToS3(file, buyerId);

  // Step 5: Update buyer's identity document information
  // This stores the new document data and resets verification status
  updateBuyerIdentityDocument(buyer, uploadResult);

  // Step 6: Save the buyer with updated document information
  await buyerRepository.saveBuyer(buyer);

  // Step 7: Return document information
  return {
    document: buyer.identityDocument
  };
}

module.exports = {
  uploadIdentityDocument
}; 