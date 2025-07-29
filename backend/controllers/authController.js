import { query, getSignedUrl } from '../aws/awsClient.js'; 
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcrypt';

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🚀 Logging in user:', email);
    console.log('Request body:', req.body);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userQuery = `
      SELECT id, name, email, phone, password, role, status, status_for_delete, photo_url, created_at, access_fields
      FROM users
      WHERE email = $1
    `;

    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: user.status === 'blocked' ? 'Your account has been blocked' : 'Account is not active' 
      });
    }

    if (user.status_for_delete === 'deleted') {
      return res.status(403).json({ message: 'Account not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password provided:', password);
    console.log('Hashed password from DB:', user.password);
    console.log('Password verification result:', validPassword);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, 'consultant'); // Pass user type as 'consultant'
    console.log("Token generated for user:", user.id );

    let accessFields = [];

    if (user.access_fields) {
      if (typeof user.access_fields === 'string') {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(user.access_fields);
          accessFields = Array.isArray(parsed) ? parsed : [parsed];
        } catch (jsonError) {
          console.warn('Failed to parse access_fields JSON:', jsonError);
          // Fallback: treat as comma-separated string
          accessFields = user.access_fields.split(',').map(item => item.trim());
        }
      } else if (typeof user.access_fields === 'object') {
        // Already parsed as object by ORM/database driver
        if (Array.isArray(user.access_fields)) {
          accessFields = user.access_fields;
        } else {
          // If it's an object but not an array, convert to array
          accessFields = Object.values(user.access_fields);
        }
      } else {
        console.error('Unexpected access_fields type:', typeof user.access_fields, user.access_fields);
        accessFields = [];
      }
    }

    // ✅ Generate signed URL if photo_url exists
    let signedPhotoUrl = null;
    if (user.photo_url) {
      signedPhotoUrl = getSignedUrl(user.photo_url);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        token: token,
        photo_url: signedPhotoUrl, // ✅ use signed URL
        created_at: user.created_at || null,
        access_fields: accessFields,
      },
      message: 'User logged in successfully',
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const promoterLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log('🚀 Logging in promoter:', username);
    console.log('Request body:', req.body);

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // TODO: set username and password in promoters table with bcrypt hash
    const promoterQuery = `
      SELECT id, username, password
      FROM promoters
      WHERE username = $1
    `;

    const result = await query(promoterQuery, [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const promoter = result.rows[0];

    // TODO : const validPassword = await bcrypt.compare(password, promoter.password);
    const validPassword = password === promoter.password
    console.log('Password provided:', password);
    console.log('Hashed password from DB:', promoter.password);
    console.log('Password verification result:', validPassword);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = generateToken(promoter.id, 'promoter'); // Pass user type as 'promoter'
    console.log("Token generated for promoter:", promoter.id);

    res.json({
      success: true,
      user: {
        id: promoter.id,
        username: promoter.username,
        token: token,
      },
      message: 'Promoter logged in successfully',
    });

  } catch (error) {
    console.error('Promoter Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = req.user;

    let accessFields = user.access_fields;
    if (typeof user.access_fields === 'string' && user.access_fields) {
      try {
        accessFields = JSON.parse(user.access_fields);
      } catch (jsonError) {
        console.warn('Failed to parse access_fields JSON:', jsonError);
      }
    }

    // ✅ Generate signed URL if photo_url exists
    let signedPhotoUrl = null;
    if (user.photo_url) {
      signedPhotoUrl = getSignedUrl(user.photo_url);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        photo_url: signedPhotoUrl, // ✅ use signed URL
        created_at: user.created_at || null,
        access_fields: accessFields,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPromoter = async (req, res, next) => {
  try {
    const promoter = req.promoter;

    res.json({
      success: true,
      promoter: {
        id: promoter.id,
        username: promoter.username,
      },
    });
  } catch (error) {
    next(error);
  }
};