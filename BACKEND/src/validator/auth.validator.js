import {body, validationResult} from 'express-validator';

function validateRequest(req,res,next) {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
  next();
}

export const validateRegister = [
  body("email")
    .isEmail().withMessage("Please provide a valid email address"),
  body("contact")
    .notEmpty().withMessage("Contact number is required")
    .matches(/^[0-9]{10}$/).withMessage("Contact number must be 10 digits long"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("fullname")
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 3 }).withMessage("Full name must be at least 3 characters long"),
  validateRequest
]