import { body, validationResult } from 'express-validator';


function validateRequest(req, res, next) {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   next();
}

const departmentFields = [
   body("fullname")
      .isString().withMessage("Full name must be a string")
      .isLength({ min: 3 }).withMessage("Full name must be at least 3 characters long"),
   body("code")
      .isString().withMessage("Code must be a string")
      .isLength({ min: 2 }).withMessage("Code must be at least 2 characters long"),
   body("description")
      .optional()
      .isString().withMessage("Description must be a string"),
   body("categories")
      .optional()
      .isArray().withMessage("Categories must be an array"),
   body("categories.*")
      .isString().withMessage("Each category must be a string")
      .notEmpty().withMessage("Category values cannot be empty"),
   body("isActive")
      .optional()
      .isBoolean().withMessage("isActive must be a boolean"),
];

export const validateDepartmentCreation = [
   body("fullname")
      .notEmpty().withMessage("Full name is required"),
   body("code")
      .notEmpty().withMessage("Code is required"),
   ...departmentFields,
   validateRequest,
];

export const validateDepartmentUpdate = [
   ...departmentFields.map((field) => field.optional()),
   validateRequest,
];