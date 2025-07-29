// authController.js
import db from '../database/dbClient.js';
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcrypt';
import validator from 'validator';

/**
 * User Registration
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    console.log('🚀 Registering new user:', { name, email, phone });

    // Input validation
    const validationErrors = [];

    if (!name || name.trim().length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    }

    if (!email || !validator.isEmail(email)) {
      validationErrors.push('Valid email is required');
    }

    if (!phone || !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      validationErrors.push('Valid phone number is required');
    }

    if (!password || password.length < 6) {
      validationErrors.push('Password must be at least 6 characters long');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if user already exists
    const existingUserQuery = `
      SELECT id, email, phone 
      FROM users 
      WHERE email = $1 OR phone = $2
    `;

    const existingUser = await db.queryOne(existingUserQuery, [email.toLowerCase(), phone]);

    if (existingUser) {
      const conflictField = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `User with this ${conflictField} already exists`
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with transaction
    const newUser = await db.transaction(async (client) => {
      const insertUserQuery = `
        INSERT INTO users (
          name, 
          email, 
          phone, 
          password, 
          role, 
          status,
          status_for_delete,
          access_fields,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, name, email, phone, role, status, created_at, access_fields
      `;

      const result = await client.query(insertUserQuery, [
        name.trim(),
        email.toLowerCase(),
        phone,
        hashedPassword,
        'user', // default role
        'active', // default status
        'active', // not deleted
        JSON.stringify(['dashboard']) // default access fields
      ]);

      return result.rows[0];
    });

    // Generate token
    const token = generateToken(newUser.id, 'student');

    console.log('✅ User registered successfully:', newUser.id);

    // Parse access fields
    let accessFields = [];
    try {
      accessFields = JSON.parse(newUser.access_fields || '[]');
    } catch (error) {
      console.warn('Failed to parse access_fields:', error);
      accessFields = ['dashboard'];
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        token: token,
        photo_url: null,
        created_at: newUser.created_at,
        access_fields: accessFields,
      }
    });

  } catch (error) {
    console.error('💥 Signup Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * User Login (supports both email and phone)
 */
export const login = async (req, res, next) => {
  try {
    const { emailOrPhone, password, inputType } = req.body;

    console.log('🚀 Logging in user:', { emailOrPhone, inputType });

    // Input validation
    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and password are required'
      });
    }

    // Determine if input is email or phone
    const isEmail = inputType === 'email' || validator.isEmail(emailOrPhone);
    const isPhone = inputType === 'phone' || validator.isMobilePhone(emailOrPhone, 'any', { strictMode: false });

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email or phone number'
      });
    }

    // Build dynamic query based on input type
    let userQuery;
    let queryParams;

    if (isEmail) {
      userQuery = `
        SELECT id, name, email, phone, password, role, status, status_for_delete, 
               photo_url, created_at, access_fields
        FROM users
        WHERE email = $1
      `;
      queryParams = [emailOrPhone.toLowerCase()];
    } else {
      userQuery = `
        SELECT id, name, email, phone, password, role, status, status_for_delete, 
               photo_url, created_at, access_fields
        FROM users
        WHERE phone = $1
      `;
      queryParams = [emailOrPhone];
    }

    const user = await db.queryOne(userQuery, queryParams);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (user.status !== 'active') {
      const statusMessage = user.status === 'blocked' 
        ? 'Your account has been blocked' 
        : 'Account is not active';
      
      return res.status(403).json({
        success: false,
        message: statusMessage
      });
    }

    if (user.status_for_delete === 'deleted') {
      return res.status(403).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id, 'student');
    console.log('✅ Token generated for user:', user.id);

    // Parse access fields
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

    // Generate signed photo URL if exists
    let signedPhotoUrl = user.photo_url || null;

    // Update last login timestamp
    try {
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
    } catch (error) {
      console.warn('Failed to update last login:', error);
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        token: token,
        photo_url: photoUrl,
        created_at: user.created_at || null,
        access_fields: accessFields,
      }
    });

  } catch (error) {
    console.error('💥 Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get Current User (requires authentication middleware)
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user; // Set by authentication middleware

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('📋 Getting current user:', user.id);

    // Parse access fields
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

    // Get photo URL directly
    let photoUrl = user.photo_url || null;

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        photo_url: signedPhotoUrl,
        created_at: user.created_at || null,
        access_fields: accessFields,
      }
    });

  } catch (error) {
    console.error('💥 GetCurrentUser Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Logout User (optional - mainly for clearing server-side sessions)
 */
export const logout = async (req, res, next) => {
  try {
    const user = req.user;

    if (user) {
      console.log('👋 User logged out:', user.id);
      
      // Update last logout timestamp
      try {
        await db.query(
          'UPDATE users SET last_logout = NOW() WHERE id = $1',
          [user.id]
        );
      } catch (error) {
        console.warn('Failed to update last logout:', error);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('💥 Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Refresh Token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Generate new token
    const newToken = generateToken(user.id, 'student');

    res.json({
      success: true,
      token: newToken,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('💥 Refresh Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};