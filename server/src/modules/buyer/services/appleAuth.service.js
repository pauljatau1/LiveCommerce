/**
 * Apple OAuth Authentication Service for Buyers
 *
 * This service handles Apple Sign-In authentication for buyers, providing secure
 * integration with Apple ID. It verifies Apple ID tokens using the jose library,
 * manages user registration/login, and maintains session security.
 *
 * Authentication Flow:
 * 1. Frontend sends Apple ID token and nonce to backend
 * 2. Backend verifies token authenticity with Apple's JWKS endpoint
 * 3. Validate nonce to prevent replay attacks
 * 4. Extract user information from verified token payload
 * 5. Check if user exists in database (by Apple ID or email)
 * 6. Create new user or update existing user data
 * 7. Generate application JWT token
 * 8. Return authenticated user data and token
 *
 * @module appleAuthService
 */

// Note: jose is ESM-only, so we use dynamic import() instead of require()
const crypto = require('crypto');
const { generateToken } = require('../../../utils/helpers');
const { findByEmail, findByAppleId, saveBuyer } = require('../repositories/buyer.repository');
const Buyer = require('../../../models/Buyer');
const ValidationError = require('../../../utils/errors/ValidationError');

// Apple's JWKS endpoint for public key verification
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

// Cache for jose module (loaded dynamically)
let joseModule = null;

/**
 * Dynamically loads the jose module (ESM-only package)
 * @returns {Promise<Object>} The jose module
 */
async function getJose() {
    if (!joseModule) {
        joseModule = await import('jose');
    }
    return joseModule;
}

/**
 * Verifies an Apple ID token and extracts user information.
 *
 * This function uses the jose library to verify the authenticity
 * of the Apple ID token received from the frontend.
 *
 * @param {string} token - The Apple ID token from frontend
 * @param {string} rawNonce - The raw nonce used during Apple Sign-In
 * @param {boolean} fromDev - Whether the request is from dev environment
 * @returns {Promise<Object>} Verified user payload from Apple
 * @throws {ValidationError} If token verification fails
 */
async function verifyAppleToken(token, rawNonce, fromDev = false) {
    try {
        console.log('Verifying Apple token for buyer...');
        console.log('Token length:', token.length);

        // Dynamically import jose (ESM-only package)
        const jose = await getJose();

        // Get Apple's public keys from their JWKS endpoint
        const JWKS = jose.createRemoteJWKSet(new URL(APPLE_JWKS_URL));

        // Determine the expected audience based on environment
        const expectedAudience = fromDev ? 'com.auqli.auqliappdev' : 'com.auqli.auqliapp';
        console.log('Expected audience:', expectedAudience);

        // Verify the token signature and claims
        const { payload } = await jose.jwtVerify(token, JWKS, {
            issuer: 'https://appleid.apple.com',
            audience: expectedAudience,
        });

        console.log('Apple token basic verification successful');

        // Verify token hasn't expired
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTimestamp) {
            throw new ValidationError([{
                field: 'token',
                message: 'Apple ID token has expired'
            }]);
        }

        // Verify required claims are present
        if (!payload.sub || !payload.iss || !payload.aud) {
            throw new ValidationError([{
                field: 'token',
                message: 'Missing required claims in Apple ID token'
            }]);
        }

        // Verify nonce to prevent replay attacks
        // The mobile app hashes the nonce (SHA256) before sending to Apple,
        // so the token always contains the hashed nonce. We need to hash the
        // rawNonce and compare with the token's nonce.
        if (payload.nonce) {
            // Compute SHA256 hash of rawNonce (hex encoded)
            const computedHashedNonce = crypto
                .createHash('sha256')
                .update(Buffer.from(rawNonce, 'utf8'))
                .digest('hex');

            if (payload.nonce !== computedHashedNonce) {
                console.log('Nonce mismatch:', { expected: computedHashedNonce, received: payload.nonce });
                throw new ValidationError([{
                    field: 'rawNonce',
                    message: 'Invalid nonce - verification failed'
                }]);
            }
        }

        console.log('Apple token verification successful for user:', payload.sub);

        return payload;
    } catch (error) {
        console.error('Apple token verification error:', error);

        // Re-throw ValidationError as-is
        if (error instanceof ValidationError) {
            throw error;
        }

        // Handle specific JWT errors
        if (error.code === 'ERR_JWT_EXPIRED') {
            throw new ValidationError([{
                field: 'token',
                message: 'Apple ID token has expired. Please try signing in again.'
            }]);
        }

        if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
            throw new ValidationError([{
                field: 'token',
                message: 'Apple ID token validation failed. Please try signing in again.'
            }]);
        }

        if (error.code === 'ERR_JWKS_NO_MATCHING_KEY') {
            throw new ValidationError([{
                field: 'token',
                message: 'Invalid Apple ID token signature. Please try signing in again.'
            }]);
        }

        throw new ValidationError([{
            field: 'token',
            message: 'Invalid Apple ID token. Unable to verify with Apple. Please try signing in again.'
        }]);
    }
}

/**
 * Generates a unique username for a new buyer.
 *
 * @param {string} name - User's name from Apple (may be undefined after first sign-in)
 * @param {string} email - User's email (may be undefined for private email)
 * @returns {Promise<string>} A unique username
 */
async function generateUniqueUsername(name, email) {
    // Start with name-based username or email prefix or fallback
    let baseUsername;

    if (name) {
        baseUsername = name.toLowerCase().replace(/\s+/g, '').substring(0, 15);
    } else if (email) {
        baseUsername = email.split('@')[0].toLowerCase().substring(0, 15);
    } else {
        baseUsername = 'appleuser';
    }

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
 * Finds or creates a buyer based on Apple OAuth data.
 *
 * Business Logic Flow:
 * 1. Check if user exists by Apple ID (primary lookup)
 * 2. If not found, check by email address (secondary lookup)
 * 3. If found by email, link Apple ID to existing account
 * 4. If not found at all, create new buyer account
 *
 * Note: Apple only provides user info (name, email) on the FIRST sign-in.
 * Subsequent sign-ins only include the Apple ID (sub claim).
 *
 * @param {Object} payload - Verified Apple token payload
 * @param {string} [expoPushToken] - Optional Expo push token for notifications
 * @param {string} [firstName] - First name (only on first sign-in)
 * @param {string} [lastName] - Last name (only on first sign-in)
 * @param {string} [email] - Email (only on first sign-in, may be private relay email)
 * @returns {Promise<Object>} The buyer object (existing or newly created)
 * @throws {ValidationError} If account linking conflicts occur
 */
async function findOrCreateBuyer(payload, expoPushToken, firstName, lastName, email) {
    const appleId = payload.sub;
    const tokenEmail = payload.email; // May be present in token
    const userEmail = email || tokenEmail; // Prefer explicitly passed email
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null;

    try {
        // Step 1: Check if user exists by Apple ID (primary lookup)
        let buyer = await findByAppleId(appleId);

        if (buyer) {
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
            console.log(`Existing Apple OAuth buyer logged in: ${buyer.email}`);
            return buyer;
        }

        // Step 2: Check if user exists by email (secondary lookup for account linking)
        if (userEmail) {
            buyer = await findByEmail(userEmail);

            if (buyer) {
                // Handle different scenarios for existing email accounts

                // Scenario 1: Email already linked to a different Apple account
                if (buyer.appleId && buyer.appleId !== appleId) {
                    throw new ValidationError([{
                        field: 'email',
                        message: 'This email is already linked to a different Apple account. Please use the original Apple account or contact support.'
                    }]);
                }

                // Scenario 2: Email exists but not linked to Apple (account linking)
                if (!buyer.appleId) {
                    console.log(`Linking Apple OAuth to existing email account: ${userEmail}`);

                    buyer.appleId = appleId;
                    buyer.authProvider = 'apple';
                    buyer.emailVerified = true;

                    // Update name if provided and not already set
                    if (firstName && !buyer.firstName) {
                        buyer.firstName = firstName;
                    }
                    if (lastName && !buyer.lastName) {
                        buyer.lastName = lastName;
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

                    await buyer.save();
                    return buyer;
                }

                console.log(`Email account already linked to same Apple account: ${userEmail}`);
                return buyer;
            }
        }

        // Step 3: Create new buyer account with Apple OAuth data
        console.log(`Creating new buyer account with Apple OAuth: ${userEmail || 'private email'}`);

        // Generate unique username
        const username = await generateUniqueUsername(fullName, userEmail);

        // For Apple Sign-In without email, we need a placeholder
        // Apple's private relay emails look like: xxxxx@privaterelay.appleid.com
        const finalEmail = userEmail || `${appleId.substring(0, 8)}@privaterelay.appleid.com`;

        const newBuyer = new Buyer({
            firstName: firstName || '',
            lastName: lastName || '',
            username,
            email: finalEmail,
            appleId,
            authProvider: 'apple',
            emailVerified: true,
            expoPushToken: expoPushToken
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

        console.log(`New Apple OAuth buyer account created: ${finalEmail}`);
        return savedBuyer;

    } catch (error) {
        console.error('Error in findOrCreateBuyer for Apple:', error);

        // Handle specific MongoDB duplicate key errors
        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                throw new ValidationError([{
                    field: 'email',
                    message: 'An account with this email already exists. Please try signing in with your existing account.'
                }]);
            }
            if (error.keyPattern?.appleId) {
                throw new ValidationError([{
                    field: 'appleId',
                    message: 'This Apple account is already linked to another buyer account.'
                }]);
            }
            if (error.keyPattern?.username) {
                // Retry with a new username if there's a collision
                console.log('Username collision detected, retrying...');
                return await findOrCreateBuyer(payload, expoPushToken, firstName, lastName, email);
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
 * Authenticates a buyer using Apple Sign-In - Main business logic function.
 *
 * @param {Object} data - The Apple OAuth request data
 * @param {string} data.token - The Apple ID token from frontend
 * @param {string} data.rawNonce - The raw nonce used during Apple Sign-In
 * @param {string} [data.firstName] - User's first name (only on first sign-in)
 * @param {string} [data.lastName] - User's last name (only on first sign-in)
 * @param {string} [data.email] - User's email (only on first sign-in)
 * @param {boolean} [data.fromDev] - Whether from dev environment
 * @param {string} [data.expoPushToken] - Optional Expo push token
 * @returns {Promise<Object>} Authenticated user data and JWT token
 * @throws {ValidationError} If token verification fails or validation errors occur
 */
async function authenticateWithApple(data) {
    // Step 1: Validate required input data
    if (!data.token || typeof data.token !== 'string') {
        throw new ValidationError([{
            field: 'token',
            message: 'Apple ID token is required'
        }]);
    }

    if (!data.rawNonce || typeof data.rawNonce !== 'string') {
        throw new ValidationError([{
            field: 'rawNonce',
            message: 'Nonce is required for Apple Sign-In'
        }]);
    }

    // Step 2: Verify Apple ID token and extract user information
    const payload = await verifyAppleToken(data.token, data.rawNonce, data.fromDev);

    // Step 3: Find existing user or create new account
    // Pass additional user info that's only available on first sign-in
    const buyer = await findOrCreateBuyer(
        payload,
        data.expoPushToken,
        data.firstName,
        data.lastName,
        data.email
    );

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
    authenticateWithApple,
    verifyAppleToken,
    findOrCreateBuyer
};
