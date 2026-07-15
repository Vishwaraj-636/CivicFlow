import { Router } from 'express'
import { registerValidator, loginValidation} from '../validator/auth.validator.js'
import { register, verifyEmail} from "../controllers/auth.controller.js"

const authRouter = Router()

/**
 * @route POST /api/auth/register
 * @desc registering the user
 * @access Public
 * @body {username, email, password}
 */

authRouter.post('/register', registerValidator, register)


/**
 * @route POST api/auth/login
 * @desc login user and return JWT token
 * @access Public
 * @body 
 */

// authRouter.post('/login', loginValidator, login)


/**
 * @route GET /api/auth/verify-email
 * @desc verify email
 * @access Public
 * @body {email, password}
 */

authRouter.get("/verify-email", verifyEmail)


export default authRouter