const mongoose = require('mongoose');

/**
 * User Schema
 *
 * Defines the structure of the User document in MongoDB using Mongoose.
 *
 * Fields:
 *  - name: Full name of the user (required)
 *  - email: User's email address (required, unique, lowercase, trimmed)
 *  - password: Hashed password (required)
 *  - companyName: Name of the company the user belongs to (required)
 *  - isAdmin: Boolean flag indicating if the user has admin privileges
 *  - status: Account status (active/inactive)
 *
 * The schema uses Mongoose's `timestamps` option to automatically add
 * `createdAt` and `updatedAt` fields.
 */
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true} ,
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        companyName: { type: String, required: true, trim: true },
        isAdmin: { type: Boolean, default: false },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' }
    },
    {
        timestamps: true // Adds createdAt and updatedAt fields automatically
    }
);

// Add static constants
userSchema.statics.STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

// Hide fields when converting to JSON
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;  // hide password
    return ret;
  }
});

userSchema.set('toObject', {
  transform: function (doc, ret, options) {
    delete ret.password;  // hide password
    return ret;
  }
});

/**
 * Mongoose Model: User
 * 
 * Provides access to User collection operations like find, save, update, delete, etc.
 */
const User = mongoose.model('User', userSchema);

module.exports = User;