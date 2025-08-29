const express = require('express');
const router = express.Router();

const { verifyToken, isBuyer } = require('../../../middlewares/authMiddleware');
const buyerController = require('../controllers/buyer.controller');

/**
 * @swagger
 * /api/v2/buyers/selected-categories:
 *   get:
 *     summary: Get selected categories for a buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Selected categories retrieved successfully
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
 *                   example: "Selected categories retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/selected-categories', verifyToken, isBuyer, buyerController.getSelectedCategories);

/**
 * @swagger
 * /api/v2/buyers/selected-categories:
 *   put:
 *     summary: Update selected categories for a buyer
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
 *               - selectedCategories
 *             properties:
 *               selectedCategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - subCategories
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Category name
 *                       example: "Electronics"
 *                     subCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Subcategory name
 *                             example: "Smartphones"
 *     responses:
 *       200:
 *         description: Selected categories updated successfully
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
 *                   example: "Selected categories updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     selectedCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.put('/selected-categories', verifyToken, buyerController.updateSelectedCategories);

/**
 * @swagger
 * /api/v2/buyers/select-major-categories:
 *   post:
 *     summary: Select major categories and add their child categories to buyer's selected categories
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
 *               - majorCategoryIds
 *             properties:
 *               majorCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of major category IDs to select
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Major categories selected successfully
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
 *                   example: "Major categories selected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     selectedCategories:
 *                       type: array
 *                       description: All selected categories (from major categories and manual selections)
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *                     addedCategories:
 *                       type: array
 *                       description: Categories that were added from the selected major categories
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       400:
 *         description: Invalid request - majorCategoryIds array is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or major categories not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/select-major-categories', verifyToken, buyerController.selectMajorCategories);

/**
 * @swagger
 * /api/v2/buyers/update-major-categories:
 *   put:
 *     summary: Update major categories selection (replaces categories from selected major categories)
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
 *               - majorCategoryIds
 *             properties:
 *               majorCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of major category IDs to select
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Major categories selection updated successfully
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
 *                   example: "Major categories selection updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     selectedCategories:
 *                       type: array
 *                       description: All selected categories (from major categories and manual selections)
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *                     majorCategorySelections:
 *                       type: array
 *                       description: Categories from selected major categories
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *                     manualSelections:
 *                       type: array
 *                       description: Categories that were manually selected (not from major categories)
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Custom Category"
 *                           subCategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Custom Subcategory"
 *       400:
 *         description: Invalid request - majorCategoryIds array is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer or major categories not found
 *       422:
 *         description: Validation error - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.put('/update-major-categories', verifyToken, buyerController.updateMajorCategoriesSelection);

/**
 * @swagger
 * /api/v2/buyers/selected-major-categories:
 *   get:
 *     summary: Get buyer's selected major categories
 *     description: Retrieves the major categories that have all their associated categories selected by the buyer
 *     tags: [Buyer V2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Selected major categories retrieved successfully
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
 *                   example: "Selected major categories retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     selectedMajorCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           image:
 *                             type: object
 *                             properties:
 *                               url:
 *                                 type: string
 *                                 example: "https://example.com/image.jpg"
 *                               public_id:
 *                                 type: string
 *                                 example: "image_public_id"
 *                           categoryCount:
 *                             type: integer
 *                             example: 3
 *                           categories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                   example: "507f1f77bcf86cd799439012"
 *                                 name:
 *                                   type: string
 *                                   example: "Smartphones"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Internal server error
 */
router.get('/selected-major-categories', verifyToken, isBuyer, buyerController.getSelectedMajorCategories);

module.exports = router;


