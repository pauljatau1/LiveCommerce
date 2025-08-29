const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/addresses:
 *   get:
 *     summary: Get all shipping addresses for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Addresses retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       addressType:
 *                         type: string
 *                         enum: [home, work, other]
 *                         example: "home"
 *                       country:
 *                         type: string
 *                         example: "Nigeria"
 *                       state:
 *                         type: string
 *                         example: "Lagos"
 *                       city:
 *                         type: string
 *                         example: "Lagos"
 *                       addressLine1:
 *                         type: string
 *                         example: "123 Main Street"
 *                       addressLine2:
 *                         type: string
 *                         example: "Apt 4B"
 *                       zipCode:
 *                         type: string
 *                         example: "100001"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/addresses', verifyToken, isBuyer, buyerController.getAddresses);

/**
 * @swagger
 * /api/v2/buyers/addresses:
 *   post:
 *     summary: Add a new shipping address for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressType
 *               - country
 *               - state
 *               - city
 *               - addressLine1
 *               - zipCode
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *                 description: Type of address
 *                 example: "home"
 *               country:
 *                 type: string
 *                 description: Country name
 *                 example: "Nigeria"
 *               state:
 *                 type: string
 *                 description: State or province
 *                 example: "Lagos"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Lagos"
 *               addressLine1:
 *                 type: string
 *                 description: Primary address line
 *                 example: "123 Main Street"
 *               addressLine2:
 *                 type: string
 *                 description: Secondary address line (optional)
 *                 example: "Apt 4B"
 *               zipCode:
 *                 type: string
 *                 description: Postal or zip code
 *                 example: "100001"
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address added successfully"
 *                     address:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         addressType:
 *                           type: string
 *                           example: "home"
 *                         country:
 *                           type: string
 *                           example: "Nigeria"
 *                         state:
 *                           type: string
 *                           example: "Lagos"
 *                         city:
 *                           type: string
 *                           example: "Lagos"
 *                         addressLine1:
 *                           type: string
 *                           example: "123 Main Street"
 *                         addressLine2:
 *                           type: string
 *                           example: "Apt 4B"
 *                         zipCode:
 *                           type: string
 *                           example: "100001"
 *       422:
 *         description: Unprocessable Entity - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "addressType"
 *                       message:
 *                         type: string
 *                         example: "Address type is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.post('/addresses', verifyToken, isBuyer, buyerController.addAddress);

/**
 * @swagger
 * /api/v2/buyers/addresses/{addressId}:
 *   put:
 *     summary: Update an existing shipping address
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the address to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *                 description: Type of address
 *                 example: "home"
 *               country:
 *                 type: string
 *                 description: Country name
 *                 example: "Nigeria"
 *               state:
 *                 type: string
 *                 description: State or province
 *                 example: "Lagos"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Lagos"
 *               addressLine1:
 *                 type: string
 *                 description: Primary address line
 *                 example: "123 Main Street"
 *               addressLine2:
 *                 type: string
 *                 description: Secondary address line (optional)
 *                 example: "Apt 4B"
 *               zipCode:
 *                 type: string
 *                 description: Postal or zip code
 *                 example: "100001"
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address updated successfully"
 *                     address:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         addressType:
 *                           type: string
 *                           example: "home"
 *                         country:
 *                           type: string
 *                           example: "Nigeria"
 *                         state:
 *                           type: string
 *                           example: "Lagos"
 *                         city:
 *                           type: string
 *                           example: "Lagos"
 *                         addressLine1:
 *                           type: string
 *                           example: "123 Main Street"
 *                         addressLine2:
 *                           type: string
 *                           example: "Apt 4B"
 *                         zipCode:
 *                           type: string
 *                           example: "100001"
 *       422:
 *         description: Unprocessable Entity - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "addressType"
 *                       message:
 *                         type: string
 *                         example: "Address type is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or address not found
 *       500:
 *         description: Internal server error
 */
router.put('/addresses/:addressId', verifyToken, isBuyer, buyerController.updateAddress);

/**
 * @swagger
 * /api/v2/buyers/addresses/{addressId}:
 *   delete:
 *     summary: Delete a shipping address for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the address to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or address not found
 *       422:
 *         description: Validation error - Invalid address ID format
 *       500:
 *         description: Internal server error
 */
router.delete('/addresses/:addressId', verifyToken, isBuyer, buyerController.deleteAddress);

module.exports = router;


