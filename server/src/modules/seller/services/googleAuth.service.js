/**
 * Google OAuth Authentication Service
 *
 * This service handles Google OAuth authentication for sellers, providing secure
 * integration with Google Sign-In. It verifies Google ID tokens, manages user
 * registration/login, and maintains session security.
 *
 * The service ensures that:
 * - Google ID tokens are properly verified using Google's official library
 * - User data is securely extracted from verified tokens
 * - New users are automatically registered with Google OAuth data
 * - Existing users can login using their Google account
 * - JWT tokens are generated for application session management
 * - Security best practices are followed throughout the process
 *
 * Authentication Flow:
 * 1. Frontend sends Google ID token to backend
 * 2. Backend verifies token authenticity with Google
 * 3. Extract user information from verified token payload
 * 4. Check if user exists in database (by Google ID or email)
 * 5. Create new user or update existing user data
 * 6. Generate application JWT token
 * 7. Return authenticated user data and token
 *
 * Security Features:
 * - Token verification using Google's official library
 * - Secure user data extraction
 * - Proper error handling without information leakage
 * - JWT token generation for session management
 * - Input validation and sanitization
 *
 * @module googleAuthService
 */

const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../../../utils/helpers');
const { findByEmail, findByGoogleId, saveSeller } = require('../repositories/seller.repository');
const Seller = require('../../../models/Seller');
const ValidationError = require('../../../utils/errors/ValidationError');
const NotFoundException = require('../../../utils/errors/NotFoundException');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and extracts user information.
 *
 * This function uses Google's official OAuth2Client to verify the authenticity
 * of the ID token received from the frontend. It ensures the token was issued
 * by Google and hasn't been tampered with.
 *
 * Security Process:
 * 1. Verify token signature and expiration
 * 2. Validate token audience (client ID)
 * 3. Extract user payload from verified token
 * 4. Return sanitized user information
 *
 * @param {string} idToken - The Google ID token from frontend
 * @returns {Promise<Object>} Verified user payload from Google
 *   - sub: Google's unique user identifier
 *   - email: User's email address
 *   - name: User's full name
 *   - picture: User's profile picture URL
 *   - email_verified: Boolean indicating email verification status
 * @throws {ValidationError} If token verification fails
 * @throws {Error} If Google API communication fails
 *
 * @example
 * const payload = await verifyGoogleToken('google_id_token_here');
 * // Returns: { sub: '123456789', email: 'user@gmail.com', name: 'John Doe', ... }
 */
async function verifyGoogleToken(idToken) {
  try {
    // Log token details for debugging (without exposing sensitive data)
    console.log('Verifying Google token...');
    console.log('Token length:', idToken.length);
    console.log('Token starts with:', idToken.substring(0, 20) + '...');
    console.log('Expected client ID:', process.env.GOOGLE_CLIENT_ID);
    
    // Verify the token with Google's servers
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Verify this token was issued for our app
    });

    // Extract the payload from the verified token
    const payload = ticket.getPayload();
    console.log('Token verification successful for user:', payload.email);

    // Validate that we have the required user information
    if (!payload.sub || !payload.email) {
      throw new ValidationError([{ 
        field: 'token', 
        message: 'Invalid Google token: Missing required user information' 
      }]);
    }

    return payload;
  } catch (error) {
    console.error('Google token verification error:', error);
    
    // Provide more specific error messages based on error type
    if (error.message.includes('Invalid token signature')) {
      throw new ValidationError([{ 
        field: 'token', 
        message: 'Invalid Google token: Token signature verification failed. Please try signing in again.' 
      }]);
    }
    
    if (error.message.includes('Wrong recipient')) {
      throw new ValidationError([{ 
        field: 'token', 
        message: 'Invalid Google token: Token was not issued for this application' 
      }]);
    }
    
    if (error.message.includes('Token used too early') || error.message.includes('Token used too late')) {
      throw new ValidationError([{ 
        field: 'token', 
        message: 'Invalid Google token: Token has expired or is not yet valid' 
      }]);
    }
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ValidationError([{ 
      field: 'token', 
      message: 'Invalid Google token: Unable to verify with Google. Please try signing in again.' 
    }]);
  }
}

/**
 * Finds or creates a seller based on Google OAuth data.
 *
 * This function handles the core business logic for Google OAuth authentication.
 * It checks if a user exists by Google ID or email, and either logs them in
 * or creates a new account with the Google OAuth information.
 *
 * Business Logic Flow:
 * 1. Check if user exists by Google ID (primary lookup)
 * 2. If not found, check by email address (secondary lookup)
 * 3. If found by email, link Google ID to existing account
 * 4. If not found at all, create new seller account
 * 5. Update user data with latest Google information
 * 6. Return the seller object
 *
 * Account Linking:
 * - Links Google OAuth to existing email-based accounts
 * - Preserves existing seller data and settings
 * - Updates profile information with Google data
 *
 * @param {Object} payload - Verified Google token payload
 * @param {string} payload.sub - Google's unique user identifier
 * @param {string} payload.email - User's email address
 * @param {string} payload.name - User's full name
 * @param {string} payload.picture - User's profile picture URL
 * @param {boolean} payload.email_verified - Email verification status
 * @returns {Promise<Object>} The seller object (existing or newly created)
 * @throws {Error} If database operations fail
 * @throws {ValidationError} If account linking conflicts occur
 *
 * @example
 * const seller = await findOrCreateSeller({
 *   sub: '123456789',
 *   email: 'seller@gmail.com',
 *   name: 'John Doe',
 *   picture: 'https://...',
 *   email_verified: true
 * });
 */
async function findOrCreateSeller(payload) {
  const { sub: googleId, email, name, picture, email_verified } = payload;

  try {
    // Step 1: Check if user exists by Google ID (primary lookup)
    let seller = await findByGoogleId(googleId);
    
    if (seller) {
      // Update existing Google OAuth user with latest information
      seller.googleProfilePicture = picture;
      seller.googleVerifiedEmail = email_verified;
      await seller.save();
      console.log(`Existing Google OAuth user logged in: ${email}`);
      return seller;
    }

    // Step 2: Check if user exists by email (secondary lookup for account linking)
    seller = await findByEmail(email);
    
    if (seller) {
      // Handle different scenarios for existing email accounts
      
      // Scenario 1: Email already linked to a different Google account
      if (seller.googleId && seller.googleId !== googleId) {
        throw new ValidationError([{ 
          field: 'email', 
          message: 'This email is already linked to a different Google account. Please use the original Google account or contact support.' 
        }]);
      }
      
      // Scenario 2: Email exists but not linked to Google (account linking)
      if (!seller.googleId) {
        console.log(`Linking Google OAuth to existing email account: ${email}`);
        
        // Update existing account with Google OAuth information
        seller.googleId = googleId;
        seller.googleProfilePicture = picture;
        seller.googleVerifiedEmail = email_verified;
        seller.emailVerified = true; // Mark email as verified via Google
        await seller.save();
        
        return seller;
      }
      
      // Scenario 3: Email exists and already linked to same Google account (shouldn't happen due to Step 1, but safety check)
      console.log(`Email account already linked to same Google account: ${email}`);
      return seller;
    }

    // Step 3: Create new seller account with Google OAuth data
    console.log(`Creating new seller account with Google OAuth: ${email}`);
    
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate unique Agora UID for live streaming (same as regular registration)
    const agoraUid = await generateUniqueAgoraUid();

    const newSeller = new Seller({
      firstName,
      lastName,
      email,
      googleId,
      googleProfilePicture: picture,
      googleVerifiedEmail: email_verified,
      emailVerified: true, // Automatically verify email via Google
      // phoneNumber is optional for Google OAuth users - can be added later
      agoraUid: agoraUid
    });

    const savedSeller = await saveSeller(newSeller);
    console.log(`New Google OAuth seller account created: ${email}`);
    return savedSeller;

  } catch (error) {
    console.error('Error in findOrCreateSeller:', error);
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        throw new ValidationError([{ 
          field: 'email', 
          message: 'An account with this email already exists. Please try signing in with your existing account.' 
        }]);
      }
      if (error.keyPattern?.googleId) {
        throw new ValidationError([{ 
          field: 'googleId', 
          message: 'This Google account is already linked to another seller account.' 
        }]);
      }
      if (error.keyPattern?.agoraUid) {
        // Retry with a new Agora UID if there's a collision
        console.log('Agora UID collision detected, retrying...');
        return await findOrCreateSeller(payload);
      }
    }
    
    // Re-throw ValidationError as-is
    if (error instanceof ValidationError) {
      throw error;
    }
    
    // Handle other database errors
    throw new ValidationError([{ 
      field: 'email', 
      message: 'Unable to create account. Please try again or contact support if the issue persists.' 
    }]);
  }
}

/**
 * Generates a unique Agora UID for live streaming.
 *
 * This function creates a unique identifier for the Agora live streaming
 * service. It ensures uniqueness by checking against existing UIDs in
 * the database and retrying if a collision occurs.
 *
 * @returns {Promise<number>} A unique Agora UID
 * @throws {Error} If unable to generate unique UID after 5 attempts
 */
async function generateUniqueAgoraUid() {
  let attempts = 0;
  let agoraUid;
  let exists;
  
  do {
    // Generate UID between 100000 and 4294967295
    agoraUid = Math.floor(100000 + Math.random() * (4294967295 - 100000));
    exists = await Seller.findOne({ agoraUid });
    attempts++;
  } while (exists && attempts < 5);

  if (exists) {
    throw new Error('Failed to generate unique Agora UID after 5 attempts');
  }

  return agoraUid;
}

/**
 * Authenticates a seller using Google OAuth - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * Google OAuth authentication process for sellers. It handles token
 * verification, user lookup/creation, and session management.
 *
 * Business Logic Flow:
 * 1. Verify the Google ID token with Google's servers
 * 2. Extract user information from verified token
 * 3. Find existing user or create new account
 * 4. Generate JWT token for application session
 * 5. Return authenticated user data and token
 *
 * Authentication Methods:
 * - Google OAuth: Token-based authentication via Google
 * - Account linking: Links Google OAuth to existing email accounts
 * - New account creation: Creates seller accounts via Google OAuth
 *
 * Email Conflict Handling:
 * - Existing Google OAuth user: Updates profile info and logs in
 * - Email linked to different Google account: Returns clear error message
 * - Email exists without Google link: Links Google OAuth to existing account
 * - Duplicate email during creation: Handles MongoDB unique constraint errors
 * - Agora UID collision: Automatically retries with new UID
 *
 * Security Features:
 * - Token verification using Google's official library
 * - Secure user data extraction and validation
 * - JWT token generation for session management
 * - Proper error handling without information leakage
 * - Account linking with conflict detection
 *
 * @param {Object} data - The Google OAuth request data
 * @param {string} data.token - The Google ID token from frontend
 * @returns {Promise<Object>} Authenticated user data and JWT token
 *   - user: {Object} - The authenticated seller object
 *   - token: {string} - JWT authentication token
 * @throws {ValidationError} If token verification fails or validation errors occur
 * @throws {Error} If database operations fail
 *
 * @example
 * // Google OAuth login
 * const result = await authenticateWithGoogle({
 *   token: 'google_id_token_from_frontend'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 */
async function authenticateWithGoogle(data) {
  // Step 1: Validate input data
  if (!data.token || typeof data.token !== 'string') {
    throw new ValidationError([{ 
      field: 'token', 
      message: 'Google ID token is required' 
    }]);
  }

  // Step 2: Verify Google ID token and extract user information
  const payload = await verifyGoogleToken(data.token);

  // Step 3: Find existing user or create new account
  const seller = await findOrCreateSeller(payload);

  // Step 4: Generate JWT token for application session management
  const token = generateToken(seller._id, 'Seller', '2w');

  // Step 5: Return authenticated user data and token (exclude password for security)
  const userResponse = seller.toObject ? seller.toObject() : { ...seller };
  delete userResponse.password;
  
  return { 
    user: userResponse, 
    token: token 
  };
}

module.exports = {
  authenticateWithGoogle,
  verifyGoogleToken,
  findOrCreateSeller
};
