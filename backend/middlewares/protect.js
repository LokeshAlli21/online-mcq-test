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
    // console.log('🔒 Protect Middleware: Checking token', authHeader);

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
      // console.log('🔒 JWT verification successful:', decoded);
    } catch (jwtError) {
      // console.warn('🔒 JWT verification failed:', jwtError.message);
      
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
// debug
    // console.log('🔒 Decoded token:', decoded);
    // Validate token payload
    if (!decoded || !decoded.id || !decoded.user_type) {
      // console.warn('🔒 Invalid token payload:', decoded);
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Fetch user from database with role-specific information
    let userQuery;
    let userParams = [decoded.id];

    if (decoded.user_type === 'admin') {
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.user_type, u.email_verified, 
          u.phone_verified, u.is_active, u.created_at, u.updated_at,
          a.full_name, a.role, a.permissions
        FROM users u
        LEFT JOIN admins a ON u.id = a.id
        WHERE u.id = $1
      `;
    } else if (decoded.user_type === 'student') {
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.user_type, u.email_verified, 
          u.phone_verified, u.is_active, u.created_at, u.updated_at,
          s.full_name, s.student_id, s.date_of_birth, s.address, 
          s.school_id, s.board_id, s.medium_id, s.class_level, 
          s.academic_year, s.enrollment_date
        FROM users u
        LEFT JOIN students s ON u.id = s.id
        WHERE u.id = $1
      `;
    } else {
      console.warn('🔒 Invalid user type:', decoded.user_type)
      console.log('🔒 User query:', userQuery);
      return res.status(401).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    const user = await db.queryOne(userQuery, userParams);
    // console.log('🔒 User fetched from database:', user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Parse permissions for admin users
    let permissions = [];
    if (user.user_type === 'admin' && user.permissions) {
      try {
        if (typeof user.permissions === 'string') {
          permissions = JSON.parse(user.permissions);
        } else if (Array.isArray(user.permissions)) {
          permissions = user.permissions;
        }
      } catch (error) {
        console.warn('Failed to parse admin permissions:', error);
        permissions = [];
      }
    }

    // Attach user data to request object
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      user_type: user.user_type,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      full_name: user.full_name,
      ...(user.user_type === 'admin' && {
        role: user.role || 'admin',
        permissions: permissions
      }),
      ...(user.user_type === 'student' && {
        student_id: user.student_id,
        date_of_birth: user.date_of_birth,
        address: user.address,
        school_id: user.school_id,
        board_id: user.board_id,
        medium_id: user.medium_id,
        class_level: user.class_level,
        academic_year: user.academic_year,
        enrollment_date: user.enrollment_date
      })
    };

    // Add token info to request
    req.tokenData = {
      userId: decoded.id,
      userType: decoded.user_type,
      iat: decoded.iat,
      exp: decoded.exp
    };

    console.log('✅ User authenticated:', user.id, user.user_type);
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
 * Middleware to check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.'
    });
  }

  next();
};

/**
 * Middleware to check if user is student
 */
export const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.user_type !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student access required.'
    });
  }

  next();
};

/**
 * Middleware to check if user has specific permission (for admins)
 */
export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredPermission} permission required.`
      });
    }

    next();
  };
};

/**
 * Middleware to allow access to both admin and student users
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['admin', 'student'].includes(req.user.user_type)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid user type'
    });
  }

  next();
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
      
      if (decoded && decoded.id && decoded.user_type) {
        let userQuery;
        
        if (decoded.user_type === 'admin') {
          userQuery = `
            SELECT 
              u.id, u.email, u.phone, u.user_type, u.email_verified, 
              u.phone_verified, u.is_active, u.created_at,
              a.full_name, a.role, a.permissions
            FROM users u
            LEFT JOIN admins a ON u.id = a.id
            WHERE u.id = $1 AND u.is_active = true
          `;
        } else if (decoded.user_type === 'student') {
          userQuery = `
            SELECT 
              u.id, u.email, u.phone, u.user_type, u.email_verified, 
              u.phone_verified, u.is_active, u.created_at,
              s.full_name, s.student_id, s.class_level, s.board_id, s.medium_id
            FROM users u
            LEFT JOIN students s ON u.id = s.id
            WHERE u.id = $1 AND u.is_active = true
          `;
        }

        if (userQuery) {
          const user = await db.queryOne(userQuery, [decoded.id]);
          
          if (user) {
            // Parse permissions for admin
            let permissions = [];
            if (user.user_type === 'admin' && user.permissions) {
              try {
                permissions = typeof user.permissions === 'string' 
                  ? JSON.parse(user.permissions) 
                  : user.permissions;
              } catch (error) {
                permissions = [];
              }
            }

            req.user = {
              id: user.id,
              email: user.email,
              phone: user.phone,
              user_type: user.user_type,
              full_name: user.full_name,
              ...(user.user_type === 'admin' && { permissions }),
              ...(user.user_type === 'student' && {
                student_id: user.student_id,
                class_level: user.class_level,
                board_id: user.board_id,
                medium_id: user.medium_id
              })
            };
          }
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