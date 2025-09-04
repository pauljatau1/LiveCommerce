/**
 * Upload Individual Verification Service
 *
 * This service handles the business logic for uploading and managing individual verification
 * documents for sellers. It provides functionality to:
 * - Validate uploaded document files for security and format requirements
 * - Upload documents to AWS S3 cloud storage with organized folder structure
 * - Generate unique file names to prevent conflicts
 * - Create verification document objects with proper URLs
 * - Update seller verification information with new document data
 * - Ensure data integrity and security standards
 *
 * The service ensures that individual verification document uploads are properly processed,
 * securely stored, and correctly associated with seller accounts.
 *
 * @module uploadIndividualVerificationService
 */

const sellerRepository = require('../repositories/seller.repository');
const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const uploadIndividualVerificationValidator = require('../validators/uploadIndividualVerification.validator');

/**
 * Uploads a document to S3 with organized folder structure.
 *
 * This function handles the S3 upload process for verification documents
 * with organized folder structure and unique file naming.
 *
 * Upload Process:
 * - Creates organized folder structure for individual verification
 * - Generates unique file names with UUID to prevent conflicts
 * - Sets proper content type from file
 * - Uploads to configured S3 bucket
 * - Returns upload result with location and key
 *
 * File Organization:
 * - Organized folder structure: verification/{sellerId}/individual/
 * - Unique file naming with UUID prefix
 * - Preserves original file extensions
 * - Prevents file name conflicts
 * - Maintains file type information
 *
 * @param {Object} file - The uploaded file object
 * @param {Buffer} file.buffer - File buffer data
 * @param {string} file.originalname - Original file name
 * @param {string} file.mimetype - File MIME type
 * @param {string} sellerId - The seller's ID for folder organization
 * @returns {Promise<Object>} Upload result from S3
 *   - Location: {string} - S3 object URL
 *   - Key: {string} - S3 object key
 * @throws {Error} If S3 upload fails
 * @example
 * const uploadData = await uploadDocumentToS3({
 *   buffer: Buffer.from('document data'),
 *   originalname: 'government-id.pdf',
 *   mimetype: 'application/pdf'
 * }, '507f1f77bcf86cd799439011');
 * // Returns: { Location: 'https://s3.amazonaws.com/...', Key: 'verification/507f1f77bcf86cd799439011/individual/uuid-government-id.pdf' }
 */
async function uploadDocumentToS3(file, sellerId) {
  // Step 1: Create organized file key with folder structure
  // This organizes documents by seller ID and includes UUID for uniqueness
  const key = `verification/${sellerId}/individual/${uuidv4()}-${file.originalname}`;
  
  // Step 2: Upload document to S3 with organized structure
  return await s3.upload({
    Bucket: process.env.CDN_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();
}

/**
 * Creates document object with proper structure and metadata.
 *
 * This function creates a standardized document object that includes
 * all necessary information for verification document management.
 *
 * Document Structure:
 * - Document type identification
 * - File URL for access
 * - S3 public ID for management
 * - Upload timestamp for tracking
 *
 * @param {string} documentType - Type of verification document
 * @param {Object} uploadResult - S3 upload result
 * @param {string} uploadResult.Key - S3 object key
 * @returns {Object} Formatted document object
 * @example
 * const document = createDocumentObject('governmentId', { Key: 'verification/123/individual/uuid-id.pdf' });
 * // Returns: {
 * //   documentType: 'governmentId',
 * //   fileUrl: 'https://cdn.example.com/verification/123/individual/uuid-id.pdf',
 * //   public_id: 'verification/123/individual/uuid-id.pdf'
 * // }
 */
function createDocumentObject(documentType, uploadResult) {
  return {
    documentType: documentType,
    fileUrl: `https://${process.env.CDN_URL}/${uploadResult.Key}`,
    public_id: uploadResult.Key
  };
}

/**
 * Main function to upload individual verification documents.
 *
 * This function orchestrates the entire individual verification document upload process,
 * including validation, S3 uploads, and seller record updates.
 *
 * Business Logic:
 * - Validates uploaded documents for security and format requirements
 * - Uploads Government ID (required) to S3
 * - Uploads Proof of Address (required) to S3
 * - Uploads Individual Tax ID (optional) to S3 if provided
 * - Creates organized verification document structure
 * - Updates seller verification status and document information
 * - Returns updated seller data with verification documents
 *
 * Upload Flow:
 * 1. Validate uploaded files using validator
 * 2. Upload Government ID to S3 (required)
 * 3. Upload Proof of Address to S3 (required)
 * 4. Upload Individual Tax ID to S3 if provided (optional)
 * 5. Create verification documents structure
 * 6. Update seller verification information
 * 7. Return updated seller data
 *
 * Security Features:
 * - Document validation before upload
 * - Organized S3 file structure
 * - Unique file naming with UUID
 * - Verification status management
 * - Error handling without information leakage
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} files - The uploaded files object from multer
 * @returns {Promise<Object>} Updated seller data with verification documents
 * @throws {ValidationError} If document validation fails
 * @throws {Error} If seller not found or upload fails
 * @example
 * const updatedSeller = await uploadIndividualVerification('507f1f77bcf86cd799439011', req.files);
 * console.log('Verification documents uploaded:', updatedSeller.verificationDocuments);
 */
async function uploadIndividualVerification(sellerId, files) {
  // Step 1: Validate uploaded documents using the validator
  // This ensures all files meet security and format requirements
  uploadIndividualVerificationValidator.validateIndividualVerificationDocuments(files);
  
  // Step 2: Find the seller to verify existence and update verification status
  // This ensures the seller exists before proceeding with document uploads
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }
  
  // Step 3: Initialize documents array to store uploaded document information
  // This will contain all successfully uploaded verification documents
  const documents = [];
  
  // Step 4: Upload Individual Tax ID if provided (optional document)
  // This document is optional but can be provided for additional verification
  if (files.individualTaxId && files.individualTaxId[0]) {
    const taxFile = files.individualTaxId[0];
    const taxUploadResult = await uploadDocumentToS3(taxFile, sellerId);
    documents.push(createDocumentObject('individualTaxId', taxUploadResult));
  }
  
  // Step 5: Upload Government ID (required document)
  // This is the mandatory document for individual verification
  const govFile = files.governmentId[0];
  const govUploadResult = await uploadDocumentToS3(govFile, sellerId);
  documents.push(createDocumentObject('governmentId', govUploadResult));
  
  // Step 6: Upload Proof of Address (required document)
  // This is the mandatory document for individual verification
  const addressFile = files.proofOfAddress[0];
  const addressUploadResult = await uploadDocumentToS3(addressFile, sellerId);
  documents.push(createDocumentObject('proofOfAddress', addressUploadResult));
  
  // Step 7: Update seller verification documents structure
  // This organizes the verification documents by type and sets verification status
  seller.verificationDocuments = {
    type: 'individual',
    documents: documents
  };
  
  // Step 8: Set verification documents as filled
  // This indicates that the seller has completed the document upload process
  seller.hasFilledVerificationDocuments = true;
  
  // Step 9: Save the updated seller using the repository
  // This persists the verification document information to the database
  const updatedSeller = await sellerRepository.save(seller);
  
  // Step 10: Return the updated seller data with verification documents
  // This provides confirmation of successful upload and updated information
  return updatedSeller;
}

module.exports = { uploadIndividualVerification };
