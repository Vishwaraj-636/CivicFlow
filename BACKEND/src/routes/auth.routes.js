import express from 'express';
import { validateRegister, validateLogin } from '../validator/auth.validator.js';
import { register, login, googleCallback } from '../controller/auth.controller.js';
import passport from 'passport';


const router = express.Router();


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegister, register);


/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', validateLogin, login);


/**
 * @route GET /api/auth/google
 * @desc Authenticate user with Google
 * @access Public
 */

router.get('/google',
   passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
   (req, res, next) => passport.authenticate('google', { session: false }, (error, user, info) => {
      if (error) {
         console.error('Google authentication failed:', error);
         return next(error);
      }

      if (!user) {
         console.error('Google authentication returned no user:', info);
         return res.status(401).json({ message: 'Google authentication failed' });
      }

      req.user = user;
      next();
   })(req, res, next),
   googleCallback
)



export default router;
