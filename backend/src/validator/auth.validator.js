import { body, validationResult } from "express-validator";

export function validate(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: err.array()
    });
  }
  next()
}

export const registerValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),

  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).+$/)
    .withMessage(
      'Password must contain uppercase, lowercase, number and special character'
    ),

  body('accessCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Access code must be between 3 and 50 characters')

];


export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];


export default validate;