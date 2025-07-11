// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.CDN_S3_BUCKET = 'test-bucket';
process.env.CDN_URL = 'test-cdn-url';

// Configure MongoDB Memory Server for Debian 12 compatibility
process.env.MONGODB_MEMORY_SERVER_VERSION = '7.0.3';

// Global test timeout
jest.setTimeout(30000);

// Ensure proper cleanup of MongoDB connections
beforeAll(async () => {
  // Clear any existing connections
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 