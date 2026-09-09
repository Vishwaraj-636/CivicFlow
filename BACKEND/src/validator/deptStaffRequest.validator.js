import { body, param, validationResult } from 'express-validator';
import Department from '../model/department.model.js';
import deptStaffRequestModel from '../model/deptStaffRequest.model.js';

function validateRequest(req, res, next) {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   next();
}

export const validateDeptStaffRequest = [
   body("departmentId")
      .isMongoId().withMessage("A valid department is required")
      .bail()
      .custom(async (departmentId) => {
         const department = await Department.findOne({ _id: departmentId, isActive: true });
         if (!department) {
            throw new Error("An active department is required");
         }
         return true;
      }),
   validateRequest
]

export const validateDeptStaffApproval = [
   param("id")
      .isMongoId().withMessage("A valid request ID is required")
      .bail()
      .custom(async (requestId) => {
         const request = await deptStaffRequestModel.findOne({ _id: requestId, status: "pending" });
         if (!request) {
            throw new Error("A pending request is required");
         }
         return true;
      }),
   validateRequest
]


export const validateDeptStaffRejection = [
   param("id")
      .isMongoId().withMessage("A valid request ID is required")
      .bail()
      .custom(async (requestId) => {
         const request = await deptStaffRequestModel.findOne({ _id: requestId, status: "pending" });
         if (!request) {
            throw new Error("A pending request is required");
         }
         return true;
      }),
   body("rejectionReason")
      .trim()
      .notEmpty().withMessage("Rejection reason is required"),
   validateRequest
]

