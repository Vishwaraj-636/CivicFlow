import express from 'express';
import { validateRegister } from '../validator/auth.validator.js';
import { register } from '../controller/auth.controller.js';


const router = express.Router();



router.post('/register', validateRegister,register);

export default router;
