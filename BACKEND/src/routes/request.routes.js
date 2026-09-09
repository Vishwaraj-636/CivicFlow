import express from 'express';
import {
   validateDeptStaffRequest,
   validateDeptStaffApproval,
   validateDeptStaffRejection
} from '../validator/deptStaffRequest.validator.js';
import {
   createStaffRequest,
   getMyStaffRequest,
   getStaffRequests,
   getStaffRequestById,
   approveStaffRequest,
   rejectStaffRequest
} from '../controller/deptStaffRequest.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();


router.post('/requests/staff', authenticate, validateDeptStaffRequest, createStaffRequest);


router.get('/requests/staff/me', authenticate, getMyStaffRequest);


router.get('/admin/requests/staff', authenticate, requireRole('admin'), getStaffRequests);


router.get('/admin/requests/staff/:id', authenticate, requireRole('admin'), getStaffRequestById);


router.patch('/admin/requests/staff/:id/approve', authenticate, requireRole('admin'), validateDeptStaffApproval, approveStaffRequest);


router.patch('/admin/requests/staff/:id/reject', authenticate, requireRole('admin'), validateDeptStaffRejection, rejectStaffRequest);

export default router;
