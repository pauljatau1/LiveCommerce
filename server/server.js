require('dotenv').config();
const { app, server } = require('./src/app');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `✨ Server started successfully on port ${PORT}!`);
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  logger.error('Failed to connect to the database');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
