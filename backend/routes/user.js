import express from 'express';
import { loginUser, logoutUser, myProfile, refreshCSRF, refreshToken, registerUser, resendOtp, verifyOtp, verifyUser } from '../controllers/user.controller.js';
import { isAuth } from '../middleware/isAuth.js';
import { verifyCSRFToken } from '../config/csrfMiddleware.js';

const router = express.Router();


router.post('/register',registerUser);
router.post('/verify/:token',verifyUser);
router.post('/login',loginUser);
router.post('/resendOtp',resendOtp);
router.post('/verify',verifyOtp);
router.post('/refresh', refreshToken);
router.get('/me', isAuth,myProfile);
router.post('/logout', isAuth, verifyCSRFToken, logoutUser);
router.post('/refresh-csrf', isAuth, refreshCSRF);



export default router;