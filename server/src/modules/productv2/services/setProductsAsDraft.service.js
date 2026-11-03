const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Service to set multiple products as draft
 * @param {Object} req - The request object
 * @returns {Promise<Object>} - The result of the operation
 */
exports.execute = async (req) => {
    try {
        const { productIds } = req.body;
        const sellerId = req.user.id;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return {
                status: 400,
                body: {
                    success: false,
                    message: 'Please provide an array of product IDs'
                }
            };
        }

        // Convert string IDs to ObjectIds
        const objectIds = productIds.map(id => new mongoose.Types.ObjectId(id));

        // Update products
        const result = await mongoose.model('Product').updateMany(
            {
                _id: { $in: objectIds },
                seller: sellerId
            },
            {
                $set: { status: 'draft' }
            }
        );

        if (result.matchedCount === 0) {
            return {
                status: 404,
                body: {
                    success: false,
                    message: 'No products found or you do not have permission to update them'
                }
            };
        }

        return {
            status: 200,
            body: {
                success: true,
                message: `${result.modifiedCount} product(s) set to draft successfully`,
                data: {
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount
                }
            }
        };

    } catch (error) {
        console.error('Error in setProductsAsDraft service:', error);
        return {
            status: 500,
            body: {
                success: false,
                message: 'Internal server error',
                error: error.message
            }
        };
    }
};
