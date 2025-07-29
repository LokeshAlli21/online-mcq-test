import express from 'express';
import { login, getCurrentUser, signup } from '../controllers/authController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/user', protect, getCurrentUser);

export default router;
