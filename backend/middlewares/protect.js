// protect.js
import db from '../database/dbClient.js';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user data to request
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.warn('🔒 JWT verification failed:', jwtError.message);
      
      let errorMessage = 'Invalid token';
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format';
      }

      return res.status(401).json({
        success: false,
        message: errorMessage
      });
    }

    // Validate token payload
    if (!decoded || !decoded.id || !decoded.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Validate user type (if needed)
    if (decoded.user !== 'consultant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid user type.'
      });
    }

    // Fetch user from database
    const userQuery = `
      SELECT id, name, email, phone, role, status, status_for_delete, 
             photo_url, created_at, access_fields, last_login
      FROM users 
      WHERE id = $1
    `;

    const user = await db.queryOne(userQuery, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      const statusMessage = user.status === 'blocked' 
        ? 'Account has been blocked' 
        : 'Account is not active';
      
      return res.status(403).json({
        success: false,
        message: statusMessage
      });
    }

    // Check if user is not deleted
    if (user.status_for_delete === 'deleted') {
      return res.status(403).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Parse access_fields for easier use in controllers
    let accessFields = [];
    if (user.access_fields) {
      try {
        if (typeof user.access_fields === 'string') {
          const parsed = JSON.parse(user.access_fields);
          accessFields = Array.isArray(parsed) ? parsed : [parsed];
        } else if (Array.isArray(user.access_fields)) {
          accessFields = user.access_fields;
        } else if (typeof user.access_fields === 'object') {
          accessFields = Object.values(user.access_fields);
        }
      } catch (error) {
        console.warn('Failed to parse access_fields:', error);
        accessFields = user.access_fields?.split(',').map(item => item.trim()) || [];
      }
    }

    // Attach user data to request object
    req.user = {
      ...user,
      access_fields: accessFields
    };

    // Optional: Add token info to request
    req.tokenData = {
      userId: decoded.id,
      userType: decoded.user,
      iat: decoded.iat,
      exp: decoded.exp
    };

    console.log('✅ User authenticated:', user.id);
    next();

  } catch (error) {
    console.error('💥 Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional middleware to check if user has specific role
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredRole} role required.`
      });
    }

    next();
  };
};

/**
 * Optional middleware to check if user has specific access to a feature
 */
export const requireAccess = (requiredAccess) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin users have access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    const userAccessFields = req.user.access_fields || [];
    
    if (!userAccessFields.includes(requiredAccess)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredAccess} permission required.`
      });
    }

    next();
  };
};

/**
 * Optional middleware for routes that don't require authentication
 * but should include user data if token is present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user data
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // No token, continue without user data
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded && decoded.id && decoded.user === 'consultant') {
        const userQuery = `
          SELECT id, name, email, phone, role, status, status_for_delete, 
                 photo_url, created_at, access_fields
          FROM users 
          WHERE id = $1 AND status = 'active' AND status_for_delete != 'deleted'
        `;

        const user = await db.queryOne(userQuery, [decoded.id]);
        
        if (user) {
          // Parse access_fields
          let accessFields = [];
          if (user.access_fields) {
            try {
              if (typeof user.access_fields === 'string') {
                const parsed = JSON.parse(user.access_fields);
                accessFields = Array.isArray(parsed) ? parsed : [parsed];
              } else if (Array.isArray(user.access_fields)) {
                accessFields = user.access_fields;
              }
            } catch (error) {
              accessFields = [];
            }
          }

          req.user = {
            ...user,
            access_fields: accessFields
          };
        }
      }
    } catch (jwtError) {
      // Invalid token, but don't block the request
      console.warn('Optional auth: Invalid token ignored');
    }

    next();
  } catch (error) {
    console.error('Optional Auth Middleware Error:', error);
    next(); // Continue even if there's an error
  }
};

export default protect;