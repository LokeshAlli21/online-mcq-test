import { query } from '../aws/awsClient.js'; // Adjust the import path as needed
import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.id || !decoded.user) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      if (decoded.user !== 'consultant') {
        return res.status(401).json({ message: 'Not authorized, invalid user type' });
      }

      // PostgreSQL query to get the user by id
      const queryText = 'SELECT * FROM users WHERE id = $1';
      const result = await query(queryText, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      const user = result.rows[0];

      req.user = user; // ✅ Now you have full user info in req.user
      next();
    } else {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const protectPromoter = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('Decoded Token:', decoded); // Debugging line to check the decoded token

      if (!decoded || !decoded.id || !decoded.user) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      if (decoded.user !== 'promoter') {
        return res.status(401).json({ message: 'Not authorized, invalid user type' });
      }

      // PostgreSQL query to get the promoter by id
      const queryText = 'SELECT * FROM promoters WHERE id = $1';
      const result = await query(queryText, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Promoter not found' });
      }

      const promoter = result.rows[0];

      req.promoter = promoter; // ✅ Now you have full promoter info in req.promoter
      next();
    } else {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
// This middleware checks if the user is authenticated as a promoter
// It verifies the JWT token, checks the user type, and retrieves the promoter's information from the database.
// If the token is valid and the user type is 'promoter', it attaches the promoter's information to the request object.
export default { protect, protectPromoter };