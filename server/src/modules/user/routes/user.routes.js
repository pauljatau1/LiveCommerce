const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../../../middlewares/authMiddleware');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     description: Retrieve a paginated or full list of users, with optional filters
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of users per page (optional)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter users by status (optional)
 *       - in: query
 *         name: isAdmin
 *         schema:
 *           type: boolean
 *         description: Filter users by admin role (true or false) (optional)
 *     responses:
 *       200:
 *         description: A list of users with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   $ref: "#/components/schemas/Success"
 *                 message:
 *                   $ref: "#/components/schemas/Message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPublic'
 *                 pagination:
 *                   $ref: "#/components/schemas/Pagination"
 *               required: [success, message, data, pagination]
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware.verifyToken, userController.index);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get a single user by ID
 *     description: Retrieve detailed information about a specific user by their userId. Requires valid JWT.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User found and returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   $ref: '#/components/schemas/Success'
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *                 data:
 *                   $ref: '#/components/schemas/UserPublic'
 *                 pagination:
 *                   - type: "null"
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *                 - pagination
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId', authMiddleware.verifyToken, userController.show);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in the system. Requires valid JWT.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alice Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword123"
 *               companyName:
 *                 type: string
 *                 example: "Acme Corp"
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *             required:
 *               - name
 *               - email
 *               - password
 *               - status
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   $ref: '#/components/schemas/Success'
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *                 data:
 *                   $ref: '#/components/schemas/UserPublic'
 *                 pagination:
 *                   type: "null"
 *                   nullable: true
 *                   example: null
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *                 - pagination
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware.verifyToken, userController.store);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Fully update a user by ID
 *     description: Replace all details of an existing user by their userId. Requires valid JWT.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alice Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "newsecurepassword123"
 *               companyName:
 *                 type: string
 *                 example: "Acme Corp"
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *             required:
 *               - name
 *               - email
 *               - password
 *               - status
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   $ref: '#/components/schemas/Success'
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *                 data:
 *                   $ref: '#/components/schemas/UserPublic'
 *                 pagination:
 *                   type: "null"
 *                   nullable: true
 *                   example: null
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *                 - pagination
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:userId', authMiddleware.verifyToken, userController.update);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Delete a user specified by their userId. Requires valid JWT.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       204:
 *         description: User deleted successfully (No content)
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:userId', authMiddleware.verifyToken, userController.destroy);

/**
 * @swagger
 * /api/users/{userId}/activate:
 *   post:
 *     summary: Activate a user account
 *     description: Activate the user account identified by userId. Requires valid JWT.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to activate
 *     responses:
 *       200:
 *         description: User activated successfully
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
 *                   example: "User activated successfully."
 *                 data:
 *                   $ref: '#/components/schemas/UserPublic'
 *                 pagination:
 *                   type: "null"
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Bad request (e.g. user already active)
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/:userId/activate', authMiddleware.verifyToken, userController.activateUser);

module.exports = router;