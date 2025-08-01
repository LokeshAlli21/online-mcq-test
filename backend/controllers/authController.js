// authController.js
import db from '../database/dbClient.js';
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcrypt';
import validator from 'validator';

/**
 * Student Registration
 */
export const signup = async (req, res, next) => {
  try {
    const { 
      full_name, 
      email, 
      phone, 
      date_of_birth, 
      board_id, 
      medium_id, 
      school_id, 
      class_level, 
      academic_year, 
      student_id, 
      password 
    } = req.body;

    console.log('🚀 Registering new student:', { 
      full_name, 
      email, 
      phone, 
      date_of_birth, 
      board_id, 
      medium_id, 
      school_id, 
      class_level, 
      academic_year, 
      student_id 
    });

    // Input validation
    const validationErrors = [];

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

    // Check if student_id already exists
    const existingStudentQuery = `
      SELECT id, student_id 
      FROM students 
      WHERE student_id = $1
    `;

    const existingStudent = await db.queryOne(existingStudentQuery, [student_id]);

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this ID already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new student with transaction
    const result = await db.transaction(async (client) => {
      // 1. Insert into users table
      const insertUserQuery = `
        INSERT INTO users (
          email, 
          phone, 
          password_hash, 
          user_type,
          email_verified,
          phone_verified,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, email, phone, user_type, email_verified, phone_verified, is_active, created_at
      `;

      const newUser = await client.query(insertUserQuery, [
        email.toLowerCase(),
        phone,
        hashedPassword,
        'student',
        false, // email_verified
        false, // phone_verified
        true   // is_active
      ]);

      const userId = newUser.rows[0].id;

      // 2. Insert into students table with all provided data
      const insertStudentQuery = `
        INSERT INTO students (
          user_id,
          full_name,
          student_id,
          date_of_birth,
          school_id,
          board_id,
          medium_id,
          class_level,
          academic_year,
          enrollment_date,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, user_id, full_name, student_id, date_of_birth, 
                 address, school_id, board_id, medium_id, class_level, 
                 academic_year, enrollment_date, created_at
      `;

      const newStudent = await client.query(insertStudentQuery, [
        userId,
        full_name.trim(),
        student_id,
        date_of_birth || null,
        parseInt(school_id),
        parseInt(board_id),
        parseInt(medium_id),
        parseInt(class_level),
        academic_year.trim()
      ]);

      return {
        user: newUser.rows[0],
        student: newStudent.rows[0]
      };
    });

    // Generate token
    const token = generateToken(result.user.id, 'student');

    console.log('✅ Student registered successfully:', result.user.id);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      user: {
        id: result.user.id,
        name: result.student.full_name,
        full_name: result.student.full_name,
        email: result.user.email,
        phone: result.user.phone,
        user_type: result.user.user_type,
        is_active: result.user.is_active,
        email_verified: result.user.email_verified,
        phone_verified: result.user.phone_verified,
        token: token,
        student_id: result.student.student_id,
        created_at: result.user.created_at,
        // Student-specific fields
        date_of_birth: result.student.date_of_birth,
        address: result.student.address,
        school_id: result.student.school_id,
        board_id: result.student.board_id,
        medium_id: result.student.medium_id,
        class_level: result.student.class_level,
        academic_year: result.student.academic_year,
        enrollment_date: result.student.enrollment_date
      }
    });

  } catch (error) {
    console.error('💥 Student Signup Error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'User with this email, phone, or student ID already exists'
      });
    }
    
    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid data provided'
      });
    }

    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid reference data provided (school, board, or medium)'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * User Login
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

    // Build dynamic query to get user data with both student and admin info
    let userQuery;
    let queryParams;

    if (isEmail) {
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.password_hash, u.user_type, 
          u.email_verified, u.phone_verified, u.is_active, u.created_at, u.updated_at,
          s.full_name as student_name, s.student_id, s.date_of_birth, s.address, 
          s.school_id, s.board_id, s.medium_id, s.class_level, 
          s.academic_year, s.enrollment_date,
          a.full_name as admin_name, a.role, a.permissions
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN admins a ON u.id = a.user_id
        WHERE u.email = $1
      `;
      queryParams = [emailOrPhone.toLowerCase()];
    } else {
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.password_hash, u.user_type, 
          u.email_verified, u.phone_verified, u.is_active, u.created_at, u.updated_at,
          s.full_name as student_name, s.student_id, s.date_of_birth, s.address, 
          s.school_id, s.board_id, s.medium_id, s.class_level, 
          s.academic_year, s.enrollment_date,
          a.full_name as admin_name, a.role, a.permissions
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN admins a ON u.id = a.user_id
        WHERE u.phone = $1
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
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.user_type);
    console.log('✅ Token generated for user:', user.id);

    // Update last login timestamp
    try {
      await db.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [user.id]
      );
    } catch (error) {
      console.warn('Failed to update login timestamp:', error);
    }

    // Prepare user response based on user type
    const userResponse = {
      id: user.id,
      name: user.user_type === 'student' ? user.student_name : user.admin_name,
      email: user.email,
      phone: user.phone,
      user_type: user.user_type,
      is_active: user.is_active,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      token: token,
      created_at: user.created_at
    };

    // Add role-specific fields
    if (user.user_type === 'student') {
      // Student-specific fields
      userResponse.student_id = user.student_id;
      userResponse.date_of_birth = user.date_of_birth;
      userResponse.address = user.address;
      userResponse.school_id = user.school_id;
      userResponse.board_id = user.board_id;
      userResponse.medium_id = user.medium_id;
      userResponse.class_level = user.class_level;
      userResponse.academic_year = user.academic_year;
      userResponse.enrollment_date = user.enrollment_date;
    } else if (user.user_type === 'admin') {
      // Admin-specific fields
      userResponse.admin_role = user.role;
      
      // Parse permissions
      let permissions = [];
      if (user.permissions) {
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
      userResponse.permissions = permissions;
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
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
    const userId = req.user?.id; // Set by authentication middleware
    // console.log('🔍 Fetching current user:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // console.log('📋 Getting current user:', userId);

    // Get fresh user data from database based on user type
    const userType = req.user?.user_type;
    let userQuery;
    let queryParams = [userId];

    if (userType === 'admin') {
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.password_hash, u.user_type, 
          u.email_verified, u.phone_verified, u.is_active, u.created_at, u.updated_at,
          a.full_name, a.role, a.permissions
        FROM users u
        LEFT JOIN admins a ON u.id = a.user_id
        WHERE u.id = $1
      `;
    } else if (userType === 'student') {
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.password_hash, u.user_type, 
          u.email_verified, u.phone_verified, u.is_active, u.created_at, u.updated_at,
          s.full_name, s.student_id, s.date_of_birth, s.address, 
          s.school_id, s.board_id, s.medium_id, s.class_level, 
          s.academic_year, s.enrollment_date
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.id = $1
      `;
    } else {
      // Fallback query if user_type is not clear
      userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.password_hash, u.user_type, 
          u.email_verified, u.phone_verified, u.is_active, u.created_at, u.updated_at,
          s.full_name as student_name, s.student_id, s.date_of_birth, s.address, 
          s.school_id, s.board_id, s.medium_id, s.class_level, 
          s.academic_year, s.enrollment_date,
          a.full_name as admin_name, a.role, a.permissions
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN admins a ON u.id = a.user_id
        WHERE u.id = $1
      `;
    }

    const user = await db.queryOne(userQuery, queryParams);
    // console.log('📋 Current user data:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Prepare response data (similar to login response structure)
    const userResponse = {
      id: user.id,
      name: user.full_name || user.student_name || user.admin_name,
      email: user.email,
      phone: user.phone,
      user_type: user.user_type,
      is_active: user.is_active,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at
    };

    // Add role-specific data based on user type
    if (user.user_type === 'student') {
      // Add student-specific fields
      userResponse.student_id = user.student_id;
      userResponse.date_of_birth = user.date_of_birth;
      userResponse.address = user.address;
      userResponse.school_id = user.school_id;
      userResponse.board_id = user.board_id;
      userResponse.medium_id = user.medium_id;
      userResponse.class_level = user.class_level;
      userResponse.academic_year = user.academic_year;
      userResponse.enrollment_date = user.enrollment_date;
    } else if (user.user_type === 'admin') {
      // Add admin-specific fields
      userResponse.admin_role = user.role;
      
      // Parse permissions if they exist
      let permissions = [];
      if (user.permissions) {
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
      userResponse.permissions = permissions;
    }

    res.json({
      success: true,
      user: userResponse
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
 * Refresh Token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify user still exists and is active
    const currentUser = await db.queryOne(
      'SELECT id, user_type, is_active FROM users WHERE id = $1',
      [user.id]
    );

    if (!currentUser || !currentUser.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Generate new token
    const newToken = generateToken(currentUser.id, currentUser.user_type);

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