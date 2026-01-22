import express from 'express';
import { loginUser, logoutUser, myProfile, refreshToken, registerUser, verifyOtp, verifyUser } from '../controllers/user.controller.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();


router.post('/register',registerUser);
router.post('/verify/:token',verifyUser);
router.post('/login',loginUser);
router.post('/verify',verifyOtp);
router.post('/refresh', refreshToken);
router.get('/me', isAuth,myProfile);
router.post('/logout', isAuth, logoutUser);



export default router;