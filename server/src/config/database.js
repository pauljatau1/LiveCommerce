const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const maxRetries = process.env.MONGODB_CONNECTION_RETRIES ? parseInt(process.env.MONGODB_CONNECTION_RETRIES) : 5;
  const retryInterval = process.env.MONGODB_RETRY_INTERVAL ? parseInt(process.env.MONGODB_RETRY_INTERVAL) : 5000; // 5 seconds
  let retries = 0;
  let connected = false;

  while (!connected && retries < maxRetries) {
    try {
      if (retries > 0) {
        logger.info(`MongoDB connection retry attempt ${retries}/${maxRetries}`);
      }

      // const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://REDACTED@cluster0.wnkd5.mongodb.net/dev2', {
        const conn = await mongoose.connect('mongodb+srv://REDACTED@cluster0.wnkd5.mongodb.net/dev2', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds instead of 30
        heartbeatFrequencyMS: 30000, // Default is 10000
      });
      
      // Adding multiple console logs for visibility
      console.log('\x1b[36m%s\x1b[0m', '🚀 Database Connected Successfully!');
      logger.info(`MongoDB Connected to: ${conn.connection.host}`);
      
      // Database connection events
      mongoose.connection.on('connected', () => {
        logger.info('Mongoose connected to DB');
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`Mongoose connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.info('Mongoose connection disconnected');
      });

      // Set connected flag to exit the retry loop
      connected = true;
      return conn;
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);
      
      retries++;
      if (retries >= maxRetries) {
        logger.error(`Failed to connect to MongoDB after ${maxRetries} attempts. Exiting...`);
        console.error('\x1b[31m%s\x1b[0m', '❌ Database Connection Failed!');
        process.exit(1);
      }
      
      // Wait before next retry
      logger.info(`Waiting ${retryInterval/1000} seconds before next connection attempt...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
};

module.exports = connectDB;