require('dotenv').config();
const { app, server } = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startAgenda } = require('./src/config/agenda');

const PORT = process.env.PORT || 8000;

// Add error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  console.error('FATAL ERROR: Uncaught Exception - Shutting down application');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  console.error('FATAL ERROR: Unhandled Promise Rejection - Shutting down application');
  console.error(error);
  process.exit(1);
});

// Connect to MongoDB, start Agenda, and start server
const startServer = async () => {
  try {
    logger.info('Starting application...');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PORT: ${PORT}`);
    
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('Connected to MongoDB successfully');
    
    // Start Agenda after MongoDB connection
    logger.info('Starting Agenda job scheduler...');
    await startAgenda();
    logger.info('Agenda started successfully');
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`);
      console.log(`✅ Server is ready and listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
