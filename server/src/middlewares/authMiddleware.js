const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(403).send("A token is required for authentication");

  try {
    const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedUserData;

    next();
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
};

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
