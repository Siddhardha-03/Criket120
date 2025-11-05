const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Check if the user is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Please verify your email before accessing this resource',
        needsVerification: true 
      });
    }
    
    // Add user from payload
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(401).json({ 
      message: 'Token is not valid',
      error: error.message 
    });
  }
};

// Middleware to check if user is admin (if needed)
exports.isAdmin = (req, res, next) => {
  // This is a placeholder. In your User model, you might have an 'isAdmin' field
  // if (req.user && req.user.isAdmin) {
  //   return next();
  // }
  // return res.status(403).json({ message: 'Admin access required' });
  
  // For now, just pass through
  next();
};
