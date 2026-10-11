import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireDeptStaff, requireRole } from "../middleware/role.middleware.js";
import {
   createComplaint,
   getComplaintById,
   getMyComplaints,
   getSupportableComplaints,
   supportComplaint,
   getAdminComplaintMapData,
   getAdminComplaintTrends,
   updateComplaint,
   deleteComplaint,
   listComplaintsForStaff,
   getComplaintByIdForStaff,
   updateComplaintStatus,
   assignComplaint,
   uploadComplaintMedia,
   getStaffComplaints,
   getAssignedComplaints,
   acceptComplaint,
   rejectComplaint,
   resolveComplaint,
   updateComplaintPriority,
   getEscalatedComplaints,
   getEscalationSummary,
   verifyComplaintResolution,
   getMyNotifications,
} from "../controller/complaint.controller.js";
import {
   validateCreateComplaint,
   validateUpdateComplaint,
   validateUpdateComplaintStatus,
   validateComplaintAssignment,
   validateComplaintRejection,
   validateComplaintResolution,
} from "../validator/complaint.validator.js";
import { validateZod } from "../middleware/zodValidation.middleware.js";
import { createComplaintSchema } from "../validator/zodSchemas.js";

const router = express.Router();
const mediaUpload = multer({
   storage: multer.memoryStorage(),
   limits: { files: 7, fileSize: 50 * 1024 * 1024 },
});

const parseMediaUpload = (req, res, next) => {
   mediaUpload.array("files", 7)(req, res, (error) => {
      if (error) {
         return res.status(400).json({
            error: error.code === "LIMIT_FILE_SIZE"
               ? "A media file exceeds the 50 MB upload limit"
               : "Unable to read uploaded media",
         });
      }
      next();
   });
};

router.get("/admin/complaints/escalated", authenticate, requireRole("admin"), getEscalatedComplaints);
router.get("/admin/complaints/escalation-summary", authenticate, requireRole("admin"), getEscalationSummary);

router.post(
   "/complaints/media",
   authenticate,
   requireRole("citizen", "dept_staff", "admin"),
   parseMediaUpload,
   uploadComplaintMedia
);

router.get(
   "/staff/complaints",
   authenticate,
   requireDeptStaff,
   getStaffComplaints
);

router.get(
   "/staff/complaints/assigned",
   authenticate,
   requireDeptStaff,
   getAssignedComplaints
);

router.patch(
   "/staff/complaints/:id/accept",
   authenticate,
   requireDeptStaff,
   acceptComplaint
);

router.patch(
   "/staff/complaints/:id/reject",
   authenticate,
   requireDeptStaff,
   validateComplaintRejection,
   rejectComplaint
);

router.get(
   "/staff/complaints/:id",
   authenticate,
   requireRole("admin", "dept_staff"),
   getComplaintByIdForStaff
);

router.patch(
   "/staff/complaints/:id/status",
   authenticate,
   requireDeptStaff,
   validateUpdateComplaintStatus,
   updateComplaintStatus
);

router.patch(
   "/staff/complaints/:id/resolve",
   authenticate,
   requireDeptStaff,
   validateComplaintResolution,
   resolveComplaint
);

router.patch(
   "/staff/complaints/:id/assign",
   authenticate,
   requireRole("admin", "dept_staff"),
   validateComplaintAssignment,
   assignComplaint
);

router.patch("/staff/complaints/:id/priority", authenticate, requireRole("admin"), updateComplaintPriority);

router.post(
   "/complaints",
   authenticate,
   requireRole("citizen"),
   validateZod(createComplaintSchema),
   validateCreateComplaint,
   createComplaint
);

router.get(
   "/notifications",
   authenticate,
   requireRole("citizen"),
   getMyNotifications
);

router.get(
   "/admin/complaints/map",
   authenticate,
   requireRole("admin"),
   getAdminComplaintMapData
);

router.get(
   "/admin/complaints/trends",
   authenticate,
   requireRole("admin"),
   getAdminComplaintTrends
);

router.patch(
   "/complaints/:id/verification",
   authenticate,
   requireRole("citizen"),
   verifyComplaintResolution
);

router.get(
   "/complaints/my",
   authenticate,
   requireRole("citizen"),
   getMyComplaints
);

router.get(
   "/complaints/community",
   authenticate,
   requireRole("citizen"),
   getSupportableComplaints
);

router.post(
   "/complaints/:id/support",
   authenticate,
   requireRole("citizen"),
   supportComplaint
);

router.get(
   "/complaints/:id",
   authenticate,
   requireRole("citizen"),
   getComplaintById
);

router.patch(
   "/complaints/:id",
   authenticate,
   requireRole("citizen"),
   validateUpdateComplaint,
   updateComplaint
);

router.delete(
   "/complaints/:id",
   authenticate,
   requireRole("citizen"),
   deleteComplaint
);

export default router;
