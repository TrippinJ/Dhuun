// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
  try {
    // Get token from header with more flexible handling
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Handle different authorization header formats
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid authorization format, access denied' });
    }
    
    // Verify token with better error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError.name, tokenError.message);
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      } else {
        return res.status(401).json({ message: 'Token is not valid' });
      }
    }
    
    // Log token contents for debugging (without sensitive parts)
    console.log('Token decoded successfully:', {
      ...decoded,
      iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : undefined,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : undefined
    });
    
    // Handle different ID field names in tokens
    const userId = decoded.user?.id || decoded.id || decoded.userId || decoded.sub || decoded._id;

    
    if (!userId) {
      console.error('No user ID found in token');
      return res.status(401).json({ message: 'Invalid token structure: no user ID found' });
    }
    
    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`Invalid ObjectId format: "${userId}"`);
      return res.status(401).json({ 
        message: 'Invalid user ID format in token',
        details: `"${userId}" is not a valid MongoDB ObjectId`
      });
    }

    // Find user by id with more debugging info
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return res.status(401).json({ 
        message: 'Token is valid, but user not found',
        userId: userId
      });
    }
    
    console.log(`User authenticated: ${user.name || 'Unknown'} (${user._id}), role: ${user.role || 'Unknown'}`);
    
    // Add user and token data to request object
    req.user = user;
    // Also add id property to match what routes might be expecting
    req.user.id = user._id.toString();
    req.token = token;
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = auth;