require('dotenv').config();
const { app, server } = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { startAgenda, isAgendaInitialized } = require('./src/config/agenda');

const PORT = process.env.PORT || 8000;

// Add error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  console.error(`FATAL ERROR: Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  console.error(`FATAL ERROR: Unhandled Rejection: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

// Connect to MongoDB, start Agenda, and start server
const startServer = async () => {
  try {
    logger.info(`Starting server in ${process.env.NODE_ENV} mode`);
    logger.info(`MongoDB URI: ${process.env.MONGODB_URI?.substring(0, 15)}...`);
    
    console.log('Connecting to MongoDB...');
    await connectDB();
    logger.info('Connected to MongoDB');
    
    // Start Agenda after MongoDB connection
    try {
      console.log('Starting Agenda job scheduler...');
      const agendaStarted = await startAgenda();
      
      if (agendaStarted && isAgendaInitialized()) {
        logger.info('Agenda started and initialized successfully');
      } else {
        logger.error('Agenda may not be properly initialized');
      }
    } catch (agendaError) {
      logger.error(`Failed to start Agenda: ${agendaError.message}`);
      console.error('Agenda error but continuing server startup:', agendaError.message);
      // Continue with server startup even if Agenda fails
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`);
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        throw error;
      }
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();
