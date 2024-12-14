const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

/**
 * @swagger
 * /api/locations/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of countries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       isoCode:
 *                         type: string
 *                       phoneCode:
 *                         type: string
 *                       flag:
 *                         type: string
 */
router.get('/countries', locationController.getCountries);

/**
 * @swagger
 * /api/locations/states/{countryCode}:
 *   get:
 *     summary: Get states by country code
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of states for the specified country
 */
router.get('/states/:countryCode', locationController.getStates);

/**
 * @swagger
 * /api/locations/cities/{countryCode}/{stateCode}:
 *   get:
 *     summary: Get cities by country and state code
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stateCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of cities for the specified state
 */
router.get('/cities/:countryCode/:stateCode', locationController.getCities);

module.exports = router; 