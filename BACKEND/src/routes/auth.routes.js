import express from 'express';

import {
   validateRegister,
   validateLogin,
   validateGoogleProfileCompletion
} from '../validator/auth.validator.js';
import { validateZod } from '../middleware/zodValidation.middleware.js';
import { registerSchema, loginSchema } from '../validator/zodSchemas.js';

import {
   register,
   login,
   googleLogin,
   googleCallback,
   completeGoogleProfile,
   logout,
   getCurrentUser,
   updateProfile
} from '../controller/auth.controller.js';
import passport from 'passport';
import { config } from '../config/config.js';
import { authenticate } from '../middleware/auth.middleware.js';


const router = express.Router();


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateZod(registerSchema), validateRegister, register);


/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', validateZod(loginSchema), validateLogin, login);


/**
 * @route GET /api/auth/google
 * @desc Authenticate user with Google
 * @access Public
 */

router.get('/google',
   passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/url', googleLogin);

router.get('/google/callback',
   passport.authenticate('google', {
      session: false,
      failureRedirect: `${(config.ALLOWED_ORIGINS && config.ALLOWED_ORIGINS[0]) || 'http://localhost:5173'}/login`,
   }),
   googleCallback
)

router.post('/complete-profile', validateGoogleProfileCompletion, completeGoogleProfile);

router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);

router.post('/logout', logout);


export default router;
