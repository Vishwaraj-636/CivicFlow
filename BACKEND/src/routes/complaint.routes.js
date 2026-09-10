import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
   createComplaint,
   getComplaintById,
   getMyComplaints,
   updateComplaint,
   deleteComplaint,
   listComplaintsForStaff,
   updateComplaintStatus,
   assignComplaint,
   uploadComplaintMedia,
} from "../controller/complaint.controller.js";
import {
   validateCreateComplaint,
   validateUpdateComplaint,
   validateUpdateComplaintStatus,
   validateComplaintAssignment,
} from "../validator/complaint.validator.js";

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

router.post(
   "/complaints/media",
   authenticate,
   requireRole("citizen"),
   parseMediaUpload,
   uploadComplaintMedia
);

router.get(
   "/staff/complaints",
   authenticate,
   requireRole("admin", "dept_staff"),
   listComplaintsForStaff
);

router.patch(
   "/staff/complaints/:id/status",
   authenticate,
   requireRole("admin", "dept_staff"),
   validateUpdateComplaintStatus,
   updateComplaintStatus
);

router.patch(
   "/staff/complaints/:id/assign",
   authenticate,
   requireRole("admin"),
   validateComplaintAssignment,
   assignComplaint
);

router.post(
   "/complaints",
   authenticate,
   requireRole("citizen"),
   validateCreateComplaint,
   createComplaint
);

router.get(
   "/complaints/my",
   authenticate,
   requireRole("citizen"),
   getMyComplaints
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
