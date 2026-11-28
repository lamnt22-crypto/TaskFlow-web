const jwt = require('jsonwebtoken');
const { getJwtAccessSecret } = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, getJwtAccessSecret());
    req.user = payload; // Attach payload { userId, email } to req.user
    next();
  } catch (error) {
    // Catch jsonwebtoken verification errors (expired, invalid signature)
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
