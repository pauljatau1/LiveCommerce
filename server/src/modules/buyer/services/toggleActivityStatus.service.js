/**
 * Toggle Activity Status Service
 *
 * This service handles the business logic for toggling a buyer's activity status.
 * It provides secure status management and validation to ensure proper account
 * activation and deactivation.
 *
 * The service ensures that:
 * - Status toggle is properly validated before processing
 * - Only valid buyers can toggle their activity status
 * - Status changes are applied securely
 * - Error handling maintains system integrity
 *
 * Activity Status Toggle Flow:
 * - Input validation and buyer existence verification
 * - Current status retrieval and validation
 * - Status toggle operation
 * - Success response with updated status
 *
 * Security Features:
 * - Comprehensive input validation
 * - Buyer existence verification
 * - Status change validation
 * - Error handling without information leakage
 * - Secure status updates
 *
 * Status Management:
 * - Toggles between active and inactive states
 * - Maintains status data integrity
 * - Provides consistent response format
 * - Handles status validation requirements
 *
 * @module toggleActivityStatusService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { validateToggleActivityStatusData } = require('../validators/toggleActivityStatus.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Toggle the activity status of a buyer - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * activity status toggle process. It handles validation, buyer verification,
 * status retrieval, and secure status updates.
 *
 * Business Logic Flow:
 * 1. Validates the input data using comprehensive validation
 * 2. Checks if buyer exists in the database
 * 3. Retrieves current activity status
 * 4. Toggles the status (active ↔ inactive)
 * 5. Updates the buyer's activity status
 * 6. Returns updated status with confirmation
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Buyer existence verification
 * - Status change validation
 * - Secure status updates in database
 * - Error handling without information leakage
 *
 * Status Toggle Logic:
 * - Retrieves current isActive status
 * - Inverts the boolean value (true ↔ false)
 * - Updates buyer record with new status
 * - Provides clear status confirmation
 * - Maintains status consistency
 *
 * Error Handling:
 * - Validation errors for invalid input data
 * - NotFoundException for non-existent buyers
 * - Database operation errors
 * - Proper error propagation to controller
 *
 * @param {string} buyerId - The buyer's ID to toggle activity status for
 * @returns {Promise<Object>} Success response with updated activity status
 *   - isActive: {boolean} - Updated activity status (true for active, false for inactive)
 *   - message: {string} - Success message confirming status change
 * @throws {ValidationError} If buyer ID validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operations fail
 *
 * @example
 * // Toggle activity status for buyer
 * const result = await toggleActivityStatus('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   isActive: false,
 * //   message: 'Account successfully deactivated'
 * // }
 *
 * @example
 * // Toggle back to active
 * const result = await toggleActivityStatus('507f1f77bcf86cd799439011');
 * // Returns: {
 * //   isActive: true,
 * //   message: 'Account successfully activated'
 * // }
 *
 * @example
 * // Failed validation - invalid buyer ID
 * try {
 *   await toggleActivityStatus('invalid-buyer-id');
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains validation error details
 * }
 *
 * @example
 * // Buyer not found
 * try {
 *   await toggleActivityStatus('nonexistent-buyer-id');
 * } catch (error) {
 *   // error instanceof NotFoundException
 *   // error.message: 'Buyer not found'
 * }
 */
async function toggleActivityStatus(buyerId) {
  // Step 1: Validate input parameters using the validator
  // This ensures buyer ID meets validation requirements
  await validateToggleActivityStatusData({ buyerId });

  // Step 2: Get current activity status
  // This retrieves the buyer's current isActive status for toggling
  const currentBuyer = await buyerRepository.getActivityStatus(buyerId);
  if (!currentBuyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 3: Toggle the status
  // This inverts the current boolean status (true becomes false, false becomes true)
  const newStatus = !currentBuyer.isActive;

  // Step 4: Update activity status using repository
  // This applies the new status to the buyer's record
  const updatedBuyer = await buyerRepository.toggleActivityStatus(buyerId, newStatus);

  // Step 5: Verify update was successful
  // This ensures the status was properly updated
  if (!updatedBuyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 6: Return updated status with confirmation message
  return {
    isActive: updatedBuyer.isActive,
    message: `Account successfully ${updatedBuyer.isActive ? 'activated' : 'deactivated'}`
  };
}

module.exports = {
  toggleActivityStatus
};
