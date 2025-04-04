const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://REDACTED@cluster0.wnkd5.mongodb.net/dev2', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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

  } catch (error) {
    logger.error(`Error: ${error.message}`);
    console.error('\x1b[31m%s\x1b[0m', '❌ Database Connection Failed!');
    process.exit(1);
  }
};

module.exports = connectDB;