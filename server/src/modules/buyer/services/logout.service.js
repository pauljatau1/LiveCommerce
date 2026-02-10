const Buyer = require('../../../models/Buyer');
const { removeToken } = require('../../../../Firebase');

/**
 * Logout a buyer by removing their Expo push token.
 * 
 * @param {string} buyerId - The ID of the buyer to logout.
 * @returns {Promise<object>} - Success message.
 */
const logout = async (buyerId) => {
    try {
        // 1. Remove token from MongoDB Buyer document
        await Buyer.findByIdAndUpdate(buyerId, {
            $unset: { expoPushToken: "" }
        });

        // 2. Remove token from Firebase Realtime Database
        // We use a best-effort approach here; if it fails, we log it but don't fail the logout
        try {
            await removeToken(buyerId);
        } catch (firebaseError) {
            console.error(`Failed to remove Firebase token for buyer ${buyerId}:`, firebaseError);
        }

        return { message: 'Logged out successfully' };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    logout
};
