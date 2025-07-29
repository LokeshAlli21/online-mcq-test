import express from 'express';
import { loginUser, getUser, promoterLogin, getPromoter } from '../controllers/authController.js';
import { protect, protectPromoter } from '../middlewares/protect.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/promoter/login', promoterLogin);
router.get('/user', protect, getUser);
router.get('/promoter', protectPromoter, getPromoter);

export default router;
