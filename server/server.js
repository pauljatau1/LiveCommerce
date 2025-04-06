require('dotenv').config();
const { app, server } = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startAgenda } = require('./src/config/agenda');

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

// Connect to MongoDB, start Agenda, and start server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');
    
    // Start Agenda after MongoDB connection
    await startAgenda();
    logger.info('Agenda started successfully');
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
