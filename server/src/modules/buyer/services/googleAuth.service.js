/**
 * Google OAuth Authentication Service for Buyers
 *
 * This service handles Google OAuth authentication for buyers, providing secure
 * integration with Google Sign-In. It verifies Google ID tokens, manages user
 * registration/login, and maintains session security.
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
 * @module googleAuthService
 */

const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../../../utils/helpers');
const { findByEmail, findByGoogleId, saveBuyer } = require('../repositories/buyer.repository');
const Buyer = require('../../../models/Buyer');
const ValidationError = require('../../../utils/errors/ValidationError');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and extracts user information.
 *
 * This function uses Google's official OAuth2Client to verify the authenticity
 * of the ID token received from the frontend.
 *
 * @param {string} idToken - The Google ID token from frontend
 * @returns {Promise<Object>} Verified user payload from Google
 * @throws {ValidationError} If token verification fails
 */
async function verifyGoogleToken(idToken) {
    try {
        console.log('Verifying Google token for buyer...');
        console.log('Token length:', idToken.length);
        console.log('Expected client ID:', process.env.GOOGLE_CLIENT_ID);

        // Verify the token with Google's servers
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        // Extract the payload from the verified token
        const payload = ticket.getPayload();
        console.log('Token verification successful for buyer:', payload.email);

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

        // Provide specific error messages based on error type
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
 * Generates a unique username for a new buyer.
 *
 * @param {string} name - User's name from Google
 * @param {string} email - User's email
 * @returns {Promise<string>} A unique username
 */
async function generateUniqueUsername(name, email) {
    // Start with name-based username or email prefix
    let baseUsername = name
        ? name.toLowerCase().replace(/\s+/g, '').substring(0, 15)
        : email.split('@')[0].toLowerCase().substring(0, 15);

    // Remove any non-alphanumeric characters
    baseUsername = baseUsername.replace(/[^a-z0-9]/g, '');

    let username = baseUsername;
    let attempts = 0;

    // Check for uniqueness and add random suffix if needed
    while (attempts < 10) {
        const existing = await Buyer.findOne({ username });
        if (!existing) {
            return username;
        }
        // Add random suffix
        username = `${baseUsername}${Math.floor(Math.random() * 9999)}`;
        attempts++;
    }

    // Fallback to timestamp-based username
    return `buyer${Date.now()}`;
}

/**
 * Finds or creates a buyer based on Google OAuth data.
 *
 * Business Logic Flow:
 * 1. Check if user exists by Google ID (primary lookup)
 * 2. If not found, check by email address (secondary lookup)
 * 3. If found by email, link Google ID to existing account
 * 4. If not found at all, create new buyer account
 *
 * @param {Object} payload - Verified Google token payload
 * @param {string} [expoPushToken] - Optional Expo push token for notifications
 * @returns {Promise<Object>} The buyer object (existing or newly created)
 * @throws {ValidationError} If account linking conflicts occur
 */
async function findOrCreateBuyer(payload, expoPushToken) {
    const { sub: googleId, email, name, picture, email_verified } = payload;

    try {
        // Step 1: Check if user exists by Google ID (primary lookup)
        let buyer = await findByGoogleId(googleId);

        if (buyer) {
            // Update existing Google OAuth user: only set profile picture from Google if user has none
            const hasNoProfilePicture = !buyer.profileImage?.url || String(buyer.profileImage.url).trim() === '';
            if (picture && hasNoProfilePicture) {
                buyer.profileImage = buyer.profileImage || {};
                buyer.profileImage.url = picture;
            }
            // Update expoPushToken if provided
            if (expoPushToken) {
                buyer.expoPushToken = expoPushToken;
                try {
                    const { saveToken } = require('../../../../Firebase');
                    await saveToken(buyer._id, expoPushToken);
                } catch (err) {
                    console.error('Failed to save push token to Firebase:', err);
                }
            }
            await buyer.save();
            console.log(`Existing Google OAuth buyer logged in: ${email}`);
            return buyer;
        }

        // Step 2: Check if user exists by email (secondary lookup for account linking)
        buyer = await findByEmail(email);

        if (buyer) {
            // Handle different scenarios for existing email accounts

            // Scenario 1: Email already linked to a different Google account
            if (buyer.googleId && buyer.googleId !== googleId) {
                throw new ValidationError([{
                    field: 'email',
                    message: 'This email is already linked to a different Google account. Please use the original Google account or contact support.'
                }]);
            }

            // Scenario 2: Email exists but not linked to Google (account linking)
            if (!buyer.googleId) {
                console.log(`Linking Google OAuth to existing email account: ${email}`);

                buyer.googleId = googleId;
                buyer.authProvider = 'google';
                // Only set profile picture from Google when linking if user has no existing picture
                const hasNoProfilePicture = !buyer.profileImage?.url || String(buyer.profileImage.url).trim() === '';
                if (picture && hasNoProfilePicture) {
                    buyer.profileImage = buyer.profileImage || {};
                    buyer.profileImage.url = picture;
                }

                // Save expoPushToken if provided
                if (expoPushToken) {
                    buyer.expoPushToken = expoPushToken;
                    try {
                        const { saveToken } = require('../../../../Firebase');
                        await saveToken(buyer._id, expoPushToken);
                    } catch (err) {
                        console.error('Failed to save push token to Firebase:', err);
                    }
                }

                buyer.emailVerified = true;
                await buyer.save();

                return buyer;
            }

            console.log(`Email account already linked to same Google account: ${email}`);
            return buyer;
        }

        // Step 3: Create new buyer account with Google OAuth data
        console.log(`Creating new buyer account with Google OAuth: ${email}`);

        const nameParts = (name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Generate unique username
        const username = await generateUniqueUsername(name, email);

        const newBuyer = new Buyer({
            firstName,
            lastName,
            username,
            email,
            googleId,
            authProvider: 'google',
            emailVerified: true,
            authProvider: 'google',
            emailVerified: true,
            profileImage: picture ? { url: picture } : undefined,
            expoPushToken: expoPushToken // Save optional push token
        });

        const savedBuyer = await saveBuyer(newBuyer);

        // Save expoPushToken to Firebase if provided
        if (expoPushToken) {
            try {
                const { saveToken } = require('../../../../Firebase');
                await saveToken(savedBuyer._id, expoPushToken);
            } catch (err) {
                console.error('Failed to save push token to Firebase:', err);
            }
        }

        console.log(`New Google OAuth buyer account created: ${email}`);
        return savedBuyer;

    } catch (error) {
        console.error('Error in findOrCreateBuyer:', error);

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
                    message: 'This Google account is already linked to another buyer account.'
                }]);
            }
            if (error.keyPattern?.username) {
                // Retry with a new username if there's a collision
                console.log('Username collision detected, retrying...');
                // Pass expoPushToken recursively
                return await findOrCreateBuyer(payload, expoPushToken);
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
 * Authenticates a buyer using Google OAuth - Main business logic function.
 *
 * @param {Object} data - The Google OAuth request data
 * @param {string} data.token - The Google ID token from frontend
 * @returns {Promise<Object>} Authenticated user data and JWT token
 * @throws {ValidationError} If token verification fails or validation errors occur
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
    // Pass expoPushToken from request data
    const buyer = await findOrCreateBuyer(payload, data.expoPushToken);

    // Step 4: Generate JWT token for application session management
    const token = generateToken(buyer._id, 'Buyer', '2w');

    // Step 5: Return authenticated user data and token (exclude password for security)
    const userResponse = buyer.toObject ? buyer.toObject() : { ...buyer };
    delete userResponse.password;

    return {
        user: userResponse,
        token: token
    };
}

module.exports = {
    authenticateWithGoogle,
    verifyGoogleToken,
    findOrCreateBuyer
};
