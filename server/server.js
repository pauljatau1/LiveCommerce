require('dotenv').config();
const { app, server } = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 8000;

// Add error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  process.exit(1);
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
