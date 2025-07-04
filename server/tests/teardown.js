// Global teardown file for Jest
const mongoose = require('mongoose');

module.exports = async () => {
  // Close all MongoDB connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Force close any remaining connections
  const connections = mongoose.connections;
  for (const connection of connections) {
    if (connection.readyState !== 0) {
      await connection.close();
    }
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}; 