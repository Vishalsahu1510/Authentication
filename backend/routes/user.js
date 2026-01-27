import express from 'express';
import { adminController, loginUser, logoutUser, myProfile, refreshCSRF, refreshToken, registerUser, resendOtp, verifyOtp, verifyUser, forgotPassword, verifyAndResetPassword} from '../controllers/user.controller.js';
import { authorizedAdmin, isAuth } from '../middleware/isAuth.js';
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
router.get('/admin',isAuth, authorizedAdmin, adminController);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', verifyAndResetPassword);

export default router;