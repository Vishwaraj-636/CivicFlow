import express from 'express';
import { validateDeptStaffRequest, validateDeptStaffApproval } from '../validator/deptStaffRequest.validator.js';
import {
   requestDeptStaff,
   getAllDeptStaffRequests,
   getDeptStaffRequestById,
   approveDeptStaffRequest
} from '../controller/deptStaffRequest.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * @route POST /api/request/dept-staff
 * @desc User request to become department staff
 * @access Public
 */
router.post('/dept-staff', validateDeptStaffRequest, requestDeptStaff);

/**
 * @route GET /api/request/dept-staff
 * @desc Get all department staff requests (admin only)
 * @access Admin only
 */
router.get('/dept-staff', authenticate, requireRole('admin'), getAllDeptStaffRequests);

/**
 * @route GET /api/request/dept-staff/:id
 * @desc Get specific department staff request (admin only)
 * @access Admin only
 */
router.get('/dept-staff/:id', authenticate, requireRole('admin'), getDeptStaffRequestById);

/**
 * @route POST /api/request/dept-staff/approve/:id
 * @desc Admin approve or reject department staff request
 * @access Admin only
 */
router.post('/dept-staff/approve/:id', authenticate, requireRole('admin'), validateDeptStaffApproval, approveDeptStaffRequest);

export default router;
