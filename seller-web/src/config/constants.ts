import { appNameFor } from './brand';
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
export const APP_NAME = appNameFor(import.meta.env);
export const BRAND_NAME = APP_NAME;

// Where sellers reach a person. Help and the error screens read these.
export const SUPPORT_EMAIL: string = import.meta.env.VITE_SUPPORT_EMAIL || 'support@auqli.com';
// Digits only, with country code (2348012345678). Empty hides "WhatsApp us".
export const SUPPORT_WHATSAPP: string = String(import.meta.env.VITE_SUPPORT_WHATSAPP || '').replace(/\D/g, '');
