import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { getComplaintTimeline } from "../controller/complaintTimeline.controller.js";

const router = express.Router();

router.get(
   "/complaints/:id/timeline",
   authenticate,
   requireRole("citizen", "dept_staff"),
   getComplaintTimeline
);

export default router;
