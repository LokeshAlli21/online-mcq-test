import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (userId, user) => {
  // Set expiration time based on user type
  const expiresIn = user === 'promoter' ? '7d' : '1h';
  
  return jwt.sign({ id: userId, user: user }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
};