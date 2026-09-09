import express from 'express';
import {
   validateDepartmentCreation,
   validateDepartmentUpdate
} from '../validator/department.validator.js';
import {
   createDepartment,
   getDepartments,
   getDepartmentById,
   updateDepartment,
   deleteDepartment
} from "../controller/department.controller.js";
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';



const router = express.Router();



router.post(
   "/departments",
   authenticate,
   requireRole('admin'),
   validateDepartmentCreation,
   createDepartment
)

router.get("/departments", getDepartments)

router.get("/departments/:id", getDepartmentById)

router.patch(
   "/departments/:id",
   authenticate,
   requireRole('admin'),
   validateDepartmentUpdate,
   updateDepartment
)

router.delete("/departments/:id", authenticate, requireRole('admin'), deleteDepartment)

export default router;