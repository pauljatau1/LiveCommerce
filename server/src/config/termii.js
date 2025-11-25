/**
 * Termii SMS API Configuration
 *
 * This module configures the Termii SMS API client for sending SMS messages
 * via the Termii messaging service. It provides a configured axios instance
 * for making requests to the Termii API endpoints.
 *
 * Configuration:
 * - Base URL: Termii API base URL from environment variables
 * - API Key: Termii API key from environment variables
 * - Content-Type: JSON for all requests
 *
 * Usage:
 * - Import this module to get a configured axios instance
 * - Use the instance to send SMS messages via Termii API
 * - All requests will automatically include the API key in the request body
 *
 * Environment Variables Required:
 * - TERMII_API_URL: The base URL for Termii API (e.g., https://api.ng.termii.com)
 * - TERMII_API_KEY: Your Termii API key from the dashboard
 * - TERMII_SENDER_ID: Your Termii sender ID (alphanumeric, 3-11 characters)
 *
 * @module termiiConfig
 */

const axios = require('axios');
require('dotenv').config();

// Termii API base URL from environment variables
// This is the base URL for all Termii API requests
const baseURL = process.env.TERMII_API_URL || 'https://v3.api.termii.com';

/**
 * Termii SMS API axios client
 *
 * This axios instance is configured for making requests to the Termii API.
 * The API key and sender ID are stored in environment variables and will be
 * included in the request body for each SMS sending request.
 *
 * Note: Termii API requires the API key to be sent in the request body,
 * not as a header, so we configure the base URL here and include the
 * API key in the request body when making actual API calls.
 */
const termiiAPI = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Export the configured axios instance for use in services
module.exports = termiiAPI;

