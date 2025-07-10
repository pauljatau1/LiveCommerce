const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['buyer', 'seller']
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  // This represents the day of the session (truncated to midnight)
  date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate sessions for the same user on the same day
sessionSchema.index({ user: 1, userType: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema); 