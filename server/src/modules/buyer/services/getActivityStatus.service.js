/**
 * Get Activity Status Service
 *
 * This service handles the business logic for retrieving a buyer's current activity status.
 * It provides functionality to:
 * - Validate buyer ID format and existence
 * - Retrieve the current isActive status from the database
 * - Return formatted response with activity status
 * - Handle edge cases and data validation
 * - Maintain data security and integrity
 *
 * The service ensures that activity status information is properly retrieved
 * and formatted for frontend consumption while maintaining security standards.
 *
 * @module getActivityStatusService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { validateGetActivityStatusData } = require('../validators/getActivityStatus.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Get the current activity status of a buyer.
 *
 * This function orchestrates the complete process of retrieving a buyer's
 * activity status, including validation, data retrieval, and response formatting.
 *
 * Business Logic Flow:
 * 1. Validate buyer ID format and structure
 * 2. Retrieve buyer activity status from database
 * 3. Verify buyer existence
 * 4. Return formatted activity status response
 *
 * Security Considerations:
 * - Buyer ID validation prevents unauthorized access
 * - Buyer existence verification ensures data integrity
 * - Repository methods handle data retrieval securely
 * - Proper error handling prevents information leakage
 * - Only returns essential activity status information
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @returns {Promise<Object>} Object containing isActive status
 *   - isActive: {boolean} - Whether the buyer account is currently active
 * @throws {ValidationError} If buyerId is invalid or missing
 * @throws {NotFoundException} If buyer is not found in the database
 * @throws {Error} If database operation fails
 * @example
 * // Get activity status for a buyer
 * const status = await getActivityStatus('507f1f77bcf86cd799439011');
 * // Returns: { isActive: true }
 * 
 * @example
 * // Inactive buyer
 * const status = await getActivityStatus('507f1f77bcf86cd799439012');
 * // Returns: { isActive: false }
 */
async function getActivityStatus(buyerId) {
  // Step 1: Validate input data using the validator
  // This ensures buyerId is provided and has valid format
  await validateGetActivityStatusData({ buyerId });

  // Step 2: Get activity status from repository
  // This fetches the buyer record with isActive field from the database
  const buyer = await buyerRepository.getActivityStatus(buyerId);
  
  // Step 3: Check if buyer exists
  // If no buyer found, throw NotFoundException for proper error handling
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 4: Return formatted response
  // Extract and return only the isActive status for security and clarity
  return {
    isActive: buyer.isActive
  };
}

module.exports = {
  getActivityStatus
};
