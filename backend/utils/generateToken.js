import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (userId, user) => {
  
  return jwt.sign({ id: userId, user_type: user }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};