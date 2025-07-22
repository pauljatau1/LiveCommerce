// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.CDN_S3_BUCKET = 'test-bucket';
process.env.CDN_URL = 'test-cdn-url';
process.env.MONGODB_URI = 'mongodb://invalid-host:99999/test-dummy'; // Invalid URI to prevent real connections

// Configure MongoDB Memory Server for Debian 12 compatibility
process.env.MONGODB_MEMORY_SERVER_VERSION = '7.0.3';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the database connection to prevent real connections during tests
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}));

// Mock the Agenda configuration to prevent database connections
jest.mock('@/config/agenda', () => {
  const mockAgenda = {
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    define: jest.fn(),
    schedule: jest.fn(),
    now: jest.fn(),
    every: jest.fn(),
    cancel: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined)
  };
  
  return {
    __esModule: true,
    default: mockAgenda,
    startAgenda: jest.fn().mockResolvedValue(true),
    isAgendaInitialized: jest.fn().mockReturnValue(true),
    agenda: mockAgenda
  };
}); 