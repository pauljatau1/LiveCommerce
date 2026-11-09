/**
 * Application Constants
 *
 * Uses environment variables for configuration.
 */

// web app configuration
export const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  BASE_URL_V2: `${import.meta.env.VITE_API_BASE_URL}/api/v2`,
  AUQLI_STORE_BASE_URL: `${import.meta.env.VITE_AUQLI_STORE_BASE_URL}`,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 0,
} as const;

// Working name of the app. Change it here and the studio follows.
export const BRAND_NAME = 'gbam';
