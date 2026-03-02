const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Service to delete multiple products
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

        // Delete products
        const result = await mongoose.model('Product').deleteMany({
            _id: { $in: objectIds },
            seller: sellerId
        });

        if (result.deletedCount === 0) {
            return {
                status: 404,
                body: {
                    success: false,
                    message: 'No products found to delete or you do not have permission'
                }
            };
        }

        return {
            status: 200,
            body: {
                success: true,
                message: `${result.deletedCount} product(s) deleted successfully`,
                data: {
                    deletedCount: result.deletedCount
                }
            }
        };

    } catch (error) {
        console.error('Error in deleteProducts service:', error);
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
