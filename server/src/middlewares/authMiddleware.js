const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Add admin object to request for potential future use
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying admin status', error: error.message });
  }
};

exports.isBuyer = (req, res, next) => {
  if (req.user.role !== 'Buyer') {
    return res.status(403).json({ message: 'Access denied. Buyers only.' });
  }
  next();
};

exports.isSeller = (req, res, next) => {
  if (req.user.role !== 'Seller') {
    return res.status(403).json({ message: 'Access denied. Sellers only.' });
  }
  next();
};

exports.isSellerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'Seller' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Sellers or Admins only.' });
  }
  next();
};

// Combined middleware for admin routes
exports.adminAuth = [exports.verifyToken, exports.isAdmin];

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
