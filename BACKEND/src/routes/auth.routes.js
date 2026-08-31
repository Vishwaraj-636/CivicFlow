import express from 'express';
import { validateRegister,validateLogin } from '../validator/auth.validator.js';
import { register,login } from '../controller/auth.controller.js';


const router = express.Router();


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegister,register);


/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', validateLogin,login);


export default router;
