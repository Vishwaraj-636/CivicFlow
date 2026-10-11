import { randomUUID } from "node:crypto";
import Complaint from "../model/complaint.model.js";
import Department from "../model/department.model.js";
import { recordComplaintTimeline } from "./complaintTimeline.controller.js";
import { findSimilarComplaints } from "../service/complaintSimilarity.service.js";
import { uploadMedia, validateMediaFile } from "../service/imagekit.service.js";
import { upsertIncidentCluster } from "../service/incidentIntelligence.service.js";
import { priorityExplanation, scoreComplaintPriority } from "../service/priorityScoring.service.js";
import { calculateResolutionDeadline, getSlaHours } from "../service/sla.service.js";
import { escalateOverdueComplaints, openComplaintStatuses } from "../service/complaintEscalation.service.js";
import Notification from "../model/notification.model.js";
import { createNotification } from "../service/notification.service.js";
import ComplaintSupport from "../model/complaintSupport.model.js";
import { scorePair, distanceInMeters } from "../hisc/scorePair.js";
import { DEFAULT_HISC_CONFIG } from "../hisc/config.js";

const citizenQuery = (req) => ({ citizenId: req.user._id });

export const createComplaint = async (req, res) => {
   try {
      const department = await Department.findOne({
         categories: req.body.category,
         isActive: true,
      }).select("_id");

      const complaint = await Complaint.create({
         title: req.body.title,
         description: req.body.description,
         category: req.body.category,
         location: req.body.location,
         address: req.body.address,
         media: req.body.media,
         submittedDespiteSimilar: Boolean(req.body.submittedDespiteSimilar),
         assignedDepartment: department?._id ?? null,
         complaintId: `CF-${randomUUID()}`,
         citizenId: req.user._id,
         priority: scoreComplaintPriority(req.body),
         slaDurationHours: getSlaHours(scoreComplaintPriority(req.body)),
         resolutionDeadline: calculateResolutionDeadline(scoreComplaintPriority(req.body)),
      });

      const similarComplaints = await findSimilarComplaints(complaint);
      complaint.similarityScore = similarComplaints[0]?.similarityScore ?? 0;
      if (similarComplaints.length > 0) {
         const strongestMatch = similarComplaints[0];
         if (strongestMatch.classification === "duplicate") {
            complaint.duplicateOf = strongestMatch.complaint._id;
         }
      }
      await complaint.save();
      // Incident intelligence is an enhancement; a database or scoring failure must not reject a complaint.
      try {
         await upsertIncidentCluster(complaint);
      } catch (incidentError) {
         console.error("Incident analysis unavailable:", incidentError.message);
      }

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "created",
         performedBy: req.user._id,
         newStatus: complaint.status,
         remark: priorityExplanation(complaint),
      });

      return res.status(201).json(complaint);
   } catch (error) {
      console.error("Error creating complaint:", error);
      if (error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const uploadComplaintMedia = async (req, res) => {
   try {
      const invalidFile = (req.files ?? [])
         .map((file) => ({ file, error: validateMediaFile(file) }))
         .find(({ error }) => error);

      if (invalidFile) {
         return res.status(400).json({
            error: `${invalidFile.file.originalname}: ${invalidFile.error}`,
         });
      }

      const media = await Promise.all(
         (req.files ?? []).map((file) => uploadMedia({
            buffer: file.buffer,
            fileName: file.originalname,
            type: file.mimetype,
         }))
      );
      return res.status(201).json(media);
   } catch (error) {
      console.error("Error uploading complaint media:", error);
      return res.status(500).json({ error: "Unable to upload complaint media" });
   }
};

export const getComplaintById = async (req, res) => {
   try {
      const complaint = await Complaint.findOne({
         _id: req.params.id,
         ...citizenQuery(req),
         status: { $ne: "deleted" },
      }).populate("assignedDepartment", "fullname code");

      if (!complaint) {
         return res.status(404).json({ error: "Complaint not found" });
      }

      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error fetching complaint:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid complaint ID" });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const getMyComplaints = async (req, res) => {
   try {
      const complaints = await Complaint.find({
         citizenId: req.user._id,
         status: { $ne: "deleted" },
      }).populate("assignedDepartment", "fullname code").sort({ createdAt: -1 });
      return res.status(200).json(complaints);
   } catch (error) {
      console.error("Error fetching citizen complaints:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const getSupportableComplaints = async (req, res) => {
   try {
      const filter = {
         citizenId: { $ne: req.user._id },
         status: { $in: ["submitted", "in_review", "assigned", "in_progress"] },
      };
      if (req.query.category) filter.category = req.query.category;
      if (req.query.search?.trim()) {
         const expression = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
         filter.$or = [{ complaintId: expression }, { title: expression }, { description: expression }, { address: expression }];
      }

      const complaints = await Complaint.find(filter)
         .select("complaintId title description category priority status address location createdAt supportCount citizenId")
         .populate("assignedDepartment", "fullname code")
         .sort({ supportCount: -1, createdAt: -1 })
         .limit(50)
         .lean();
      const supportedIds = await ComplaintSupport.find({
         citizenId: req.user._id,
         complaintId: { $in: complaints.map((complaint) => complaint._id) },
      }).distinct("complaintId");
      const supportedSet = new Set(supportedIds.map(String));
      return res.status(200).json(complaints.map((complaint) => ({
         ...complaint,
         supportedByMe: supportedSet.has(String(complaint._id)),
      })));
   } catch (error) {
      console.error("Error fetching supportable complaints:", error);
      return res.status(500).json({ error: "Unable to load community complaints" });
   }
};

export const supportComplaint = async (req, res) => {
   try {
      const complaint = await Complaint.findOne({
         _id: req.params.id,
         citizenId: { $ne: req.user._id },
         status: { $in: ["submitted", "in_review", "assigned", "in_progress"] },
      });
      if (!complaint) return res.status(404).json({ error: "Complaint is not available for support" });

      try {
         await ComplaintSupport.create({ complaintId: complaint._id, citizenId: req.user._id });
      } catch (error) {
         if (error.code !== 11000) throw error;
         return res.status(200).json({ complaintId: complaint._id, supportCount: complaint.supportCount, supportedByMe: true });
      }

      const updatedComplaint = await Complaint.findByIdAndUpdate(
         complaint._id,
         { $inc: { supportCount: 1 } },
         { new: true }
      ).select("_id supportCount");
      return res.status(201).json({ complaintId: updatedComplaint._id, supportCount: updatedComplaint.supportCount, supportedByMe: true });
   } catch (error) {
      console.error("Error supporting complaint:", error);
      if (error.name === "CastError") return res.status(400).json({ error: "Invalid complaint ID" });
      return res.status(500).json({ error: "Unable to support complaint" });
   }
};

export const getAdminComplaintMapData = async (req, res) => {
   try {
      const complaints = await Complaint.find({
         status: { $ne: "deleted" },
         "location.coordinates": { $exists: true, $size: 2 },
      })
         .select("complaintId title category priority status location address createdAt")
         .sort({ createdAt: -1 })
         .limit(5000)
         .lean();
      return res.status(200).json(complaints);
   } catch (error) {
      console.error("Error fetching complaint map data:", error);
      return res.status(500).json({ error: "Unable to load complaint map data" });
   }
};

export const getAdminComplaintTrends = async (req, res) => {
   const period = ["day", "week", "month"].includes(req.query.period) ? req.query.period : "month";
   const formatByPeriod = { day: "%Y-%m-%d", week: "%G-W%V", month: "%Y-%m" };
   const toDate = (value, fallback) => {
      const date = value ? new Date(value) : fallback;
      return Number.isNaN(date.getTime()) ? fallback : date;
   };
   const now = new Date();
   const defaultFrom = new Date(now);
   defaultFrom.setFullYear(defaultFrom.getFullYear() - 1);
   const from = toDate(req.query.from, defaultFrom);
   const to = toDate(req.query.to, now);
   const dateMatch = {
      status: { $ne: "deleted" },
      createdAt: { $gte: from, $lte: to },
   };
   const periodExpression = { $dateToString: { format: formatByPeriod[period], date: "$createdAt" } };

   try {
      const [trend, categoryTrend, departmentTrend] = await Promise.all([
         Complaint.aggregate([
            { $match: dateMatch },
            { $group: { _id: periodExpression, count: { $sum: 1 } } },
            { $project: { _id: 0, period: "$_id", count: 1 } },
            { $sort: { period: 1 } },
         ]),
         Complaint.aggregate([
            { $match: dateMatch },
            { $group: { _id: { period: periodExpression, category: "$category" }, count: { $sum: 1 } } },
            { $project: { _id: 0, period: "$_id.period", category: "$_id.category", count: 1 } },
            { $sort: { period: 1, count: -1 } },
         ]),
         Complaint.aggregate([
            { $match: dateMatch },
            { $group: { _id: { period: periodExpression, department: "$assignedDepartment" }, count: { $sum: 1 } } },
            {
               $lookup: {
                  from: "departments",
                  localField: "_id.department",
                  foreignField: "_id",
                  as: "departmentInfo",
               },
            },
            { $unwind: { path: "$departmentInfo", preserveNullAndEmptyArrays: true } },
            { $project: { _id: 0, period: "$_id.period", department: { $ifNull: ["$departmentInfo.fullname", "Unassigned"] }, count: 1 } },
            { $sort: { period: 1, count: -1 } },
         ]),
      ]);
      return res.status(200).json({ period, from, to, trend, categoryTrend, departmentTrend });
   } catch (error) {
      console.error("Error fetching complaint trends:", error);
      return res.status(500).json({ error: "Unable to load complaint trend analytics" });
   }
};

export const updateComplaint = async (req, res) => {
   const editableFields = ["title", "description", "category", "location", "address", "media"];
   const updates = Object.fromEntries(
      editableFields
         .filter((field) => req.body[field] !== undefined)
         .map((field) => [field, req.body[field]])
   );

   try {
      const existingComplaint = await Complaint.findOne({
         _id: req.params.id,
         ...citizenQuery(req),
         status: { $ne: "deleted" },
      });

      if (!existingComplaint) {
         return res.status(404).json({ error: "Complaint not found" });
      }

      if (existingComplaint.status !== "submitted") {
         return res.status(409).json({ error: "Only submitted complaints can be edited" });
      }

      const complaint = await Complaint.findOneAndUpdate(
         { _id: req.params.id, ...citizenQuery(req), status: { $ne: "deleted" } },
         { $set: updates },
         { new: true, runValidators: true }
      );

      if (!complaint) {
         return res.status(404).json({ error: "Complaint not found" });
      }

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "updated",
         performedBy: req.user._id,
         previousStatus: existingComplaint.status,
         newStatus: complaint.status,
      });

      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error updating complaint:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid complaint ID" });
      }
      if (error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const listComplaintsForStaff = async (req, res) => {
   try {
      const filter = { status: { $ne: "deleted" } };
      if (req.user.role === "dept_staff") {
         filter.assignedDepartment = req.user.departmentId;
      }

      const complaints = await Complaint.find(filter)
         .populate("assignedDepartment", "fullname code")
         .sort({ createdAt: -1 });
      return res.status(200).json(complaints);
   } catch (error) {
      console.error("Error fetching staff complaints:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const getStaffComplaints = async (req, res) => {
   try {
      const complaints = await Complaint.find({
         assignedDepartment: req.user.departmentId,
         status: { $ne: "deleted" },
      })
         .populate("assignedDepartment", "fullname code")
         .populate("assignedStaff", "fullname email")
         .sort({ createdAt: -1 });

      return res.status(200).json(complaints);
   } catch (error) {
      console.error("Error fetching department complaints:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const getAssignedComplaints = async (req, res) => {
   try {
      const complaints = await Complaint.find({
         assignedStaff: req.user._id,
         status: { $ne: "deleted" },
      })
         .populate("assignedDepartment", "fullname code")
         .populate("assignedStaff", "fullname email")
         .sort({ createdAt: -1 });

      return res.status(200).json(complaints);
   } catch (error) {
      console.error("Error fetching assigned complaints:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
};

const findComplaintForStaff = (req) => Complaint.findOne({
   _id: req.params.id,
   assignedDepartment: req.user.departmentId,
   status: { $ne: "deleted" },
});

const recordStaffStatusChange = async (complaint, req, previousStatus, action = "status_changed") => {
   await recordComplaintTimeline({
      complaintId: complaint._id,
      action,
      performedBy: req.user._id,
      previousStatus,
      newStatus: complaint.status,
      remark: req.body.remark,
   });
};

export const acceptComplaint = async (req, res) => {
   try {
      const complaint = await findComplaintForStaff(req);
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });
      if (complaint.assignedStaff && String(complaint.assignedStaff) !== String(req.user._id)) {
         return res.status(409).json({ error: "Complaint is assigned to another staff member" });
      }

      const previousStatus = complaint.status;
      const updatedComplaint = await Complaint.findOneAndUpdate(
         { _id: complaint._id },
         {
            $set: {
               assignedStaff: req.user._id,
               assignedAt: complaint.assignedAt ?? new Date(),
               status: "in_review",
            },
         },
         { new: true, runValidators: true }
      );

      await recordStaffStatusChange(updatedComplaint, req, previousStatus, "accepted");
      return res.status(200).json(updatedComplaint);
   } catch (error) {
      console.error("Error accepting complaint:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const rejectComplaint = async (req, res) => {
   try {
      const complaint = await findComplaintForStaff(req);
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });
      if (complaint.assignedStaff && String(complaint.assignedStaff) !== String(req.user._id)) {
         return res.status(403).json({ error: "Complaint is assigned to another staff member" });
      }

      const previousStatus = complaint.status;
      complaint.status = "rejected";
      complaint.rejectionReason = req.body.reason;
      await complaint.save();
      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "rejected",
         performedBy: req.user._id,
         previousStatus,
         newStatus: complaint.status,
         remark: req.body.reason,
      });
      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error rejecting complaint:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const getComplaintByIdForStaff = async (req, res) => {
   try {
      const filter = { _id: req.params.id, status: { $ne: "deleted" } };
      if (req.user.role === "dept_staff") {
         filter.assignedDepartment = req.user.departmentId;
      }

      const complaint = await Complaint.findOne(filter)
         .populate("assignedDepartment", "fullname code")
         .populate("citizenId", "fullname email phone");

      if (!complaint) {
         return res.status(404).json({ error: "Complaint not found or you don't have access to it" });
      }

      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error fetching staff complaint details:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid complaint ID" });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const updateComplaintStatus = async (req, res) => {
   try {
      const complaint = await findComplaintForStaff(req);
      if (!complaint) {
         return res.status(404).json({ error: "Complaint not found" });
      }

      if (complaint.assignedStaff && String(complaint.assignedStaff) !== String(req.user._id)) {
         return res.status(403).json({ error: "Complaint is assigned to another staff member" });
      }

      const previousStatus = complaint.status;
      const allowedTransitions = {
         submitted: ["in_review", "in_progress", "assigned", "rejected"],
         assigned: ["in_review", "in_progress", "rejected"],
         in_review: ["in_progress", "resolved", "rejected"],
         in_progress: ["resolved", "rejected"],
         resolved: [],
         rejected: [],
         closed: [],
      };
      const newStatus = req.body.newStatus;
      if (!allowedTransitions[previousStatus]?.includes(newStatus)) {
         return res.status(409).json({
            error: `Cannot change complaint status from ${previousStatus} to ${newStatus}. Valid next statuses: ${allowedTransitions[previousStatus]?.join(", ") || "none"}.`,
         });
      }
      if (!complaint.slaDurationHours || !complaint.resolutionDeadline) {
         complaint.slaDurationHours = getSlaHours(complaint.priority);
         complaint.resolutionDeadline = calculateResolutionDeadline(complaint.priority, complaint.createdAt ?? new Date());
      }
      complaint.status = newStatus;
      await complaint.save();

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "status_changed",
         performedBy: req.user._id,
         previousStatus,
         newStatus: complaint.status,
         remark: req.body.remark || `Status changed from ${previousStatus} to ${newStatus} by ${req.user.fullname}.`,
      });

      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error updating complaint status:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const resolveComplaint = async (req, res) => {
   try {
      const complaint = await findComplaintForStaff(req);
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });
      if (complaint.assignedStaff && String(complaint.assignedStaff) !== String(req.user._id)) {
         return res.status(403).json({ error: "Complaint is assigned to another staff member" });
      }
      if (!req.body.resolutionDescription) {
         return res.status(400).json({ error: "Resolution description is required" });
      }

      const previousStatus = complaint.status;
      complaint.status = "resolved";
      complaint.resolutionDescription = req.body.resolutionDescription;
      complaint.resolutionMedia = req.body.resolutionMedia ?? [];
      complaint.resolutionVerificationStatus = "pending";
      complaint.resolutionVerifiedAt = null;
      complaint.resolutionVerificationRemark = null;
      await complaint.save();
      await recordStaffStatusChange(complaint, req, previousStatus, "resolved");
      await createNotification({
         recipientId: complaint.citizenId,
         complaintId: complaint._id,
         type: "resolution_verification",
         title: "Please verify your complaint resolution",
         message: `Staff marked ${complaint.complaintId} as resolved. Confirm that the issue is fixed or report that it still exists.`,
         io: req.app.get("io"),
      });
      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error resolving complaint:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const verifyComplaintResolution = async (req, res) => {
   const confirmed = req.body.confirmed;
   if (typeof confirmed !== "boolean") {
      return res.status(400).json({ error: "Confirmation must be true or false" });
   }

   try {
      const complaint = await Complaint.findOne({
         _id: req.params.id,
         citizenId: req.user._id,
         status: "resolved",
         resolutionVerificationStatus: "pending",
      });
      if (!complaint) {
         return res.status(404).json({ error: "No pending resolution verification found" });
      }

      const previousStatus = complaint.status;
      complaint.status = confirmed ? "closed" : "in_progress";
      complaint.resolutionVerificationStatus = confirmed ? "confirmed" : "rejected";
      complaint.resolutionVerifiedAt = new Date();
      complaint.resolutionVerificationRemark = typeof req.body.remark === "string" ? req.body.remark.trim() || null : null;
      await complaint.save();

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: confirmed ? "resolution_confirmed" : "resolution_rejected",
         performedBy: req.user._id,
         previousStatus,
         newStatus: complaint.status,
         remark: complaint.resolutionVerificationRemark || (confirmed ? "Citizen confirmed the resolution." : "Citizen reported that the issue still exists."),
      });

      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error verifying complaint resolution:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Unable to verify complaint resolution" });
   }
};

export const getMyNotifications = async (req, res) => {
   try {
      const notifications = await Notification.find({ recipientId: req.user._id })
         .populate("complaintId", "complaintId title status resolutionVerificationStatus")
         .sort({ createdAt: -1 })
         .limit(50);
      return res.status(200).json(notifications);
   } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: "Unable to load notifications" });
   }
};
export const assignComplaint = async (req, res) => {
   try {
      const complaint = await Complaint.findOneAndUpdate(
         { _id: req.params.id, status: { $ne: "deleted" } },
         {
            assignedDepartment: req.body.assignedDepartment,
            assignedStaff: req.body.assignedStaff || null,
            assignedAt: req.body.assignedStaff ? new Date() : null,
            status: "assigned",
         },
         { new: true, runValidators: true }
      );
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "assigned",
         performedBy: req.user._id,
         newStatus: complaint.status,
         remark: req.body.remark || `Complaint assigned to department ${req.body.assignedDepartment}${req.body.assignedStaff ? ` and staff member ${req.body.assignedStaff}` : ""}.`,
      });
      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error assigning complaint:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const updateComplaintPriority = async (req, res) => {
   const { priority } = req.body;
   if (!["low", "medium", "high", "urgent"].includes(priority)) return res.status(400).json({ error: "Invalid complaint priority" });
   const complaintToUpdate = await Complaint.findOne({ _id: req.params.id, status: { $ne: "deleted" } });
   if (!complaintToUpdate) return res.status(404).json({ error: "Complaint not found" });
   const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: "deleted" } },
      {
         $set: {
            priority,
            slaDurationHours: getSlaHours(priority),
            resolutionDeadline: calculateResolutionDeadline(priority, complaintToUpdate.createdAt),
         },
      },
      { new: true, runValidators: true }
   );
   if (!complaint) return res.status(404).json({ error: "Complaint not found" });
   await recordComplaintTimeline({ complaintId: complaint._id, action: "priority_changed", performedBy: req.user._id, remark: `Priority manually set to ${priority} by administrator.` });
   return res.status(200).json(complaint);
};

export const getEscalatedComplaints = async (req, res) => {
   try {
      await escalateOverdueComplaints();
      const complaints = await Complaint.find({ escalated: true, status: { $ne: "deleted" } })
         .populate("assignedDepartment", "fullname code")
         .populate("assignedStaff", "fullname email")
         .sort({ escalatedAt: -1 });
      return res.status(200).json(complaints);
   } catch (error) {
      console.error("Error fetching escalated complaints:", error);
      return res.status(500).json({ error: "Unable to load escalated complaints" });
   }
};

export const getEscalationSummary = async (req, res) => {
   try {
      await escalateOverdueComplaints();
      const summary = await Complaint.aggregate([
         { $match: { escalated: true, status: { $ne: "deleted" } } },
         {
            $group: {
               _id: "$assignedDepartment",
               escalatedCount: { $sum: 1 },
               oldestEscalation: { $min: "$escalatedAt" },
            },
         },
         { $sort: { escalatedCount: -1, oldestEscalation: 1 } },
         {
            $lookup: {
               from: "departments",
               localField: "_id",
               foreignField: "_id",
               as: "department",
            },
         },
         { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
         {
            $project: {
               _id: 0,
               departmentId: "$_id",
               departmentName: { $ifNull: ["$department.fullname", "Unassigned"] },
               departmentCode: { $ifNull: ["$department.code", "—"] },
               escalatedCount: 1,
               oldestEscalation: 1,
            },
         },
      ]);
      const total = summary.reduce((count, department) => count + department.escalatedCount, 0);
      const open = await Complaint.countDocuments({ status: { $in: openComplaintStatuses } });
      return res.status(200).json({ total, openComplaints: open, departments: summary });
   } catch (error) {
      console.error("Error fetching escalation summary:", error);
      return res.status(500).json({ error: "Unable to load escalation summary" });
   }
};

export const deleteComplaint = async (req, res) => {
   try {
      const complaint = await Complaint.findOne({
         _id: req.params.id,
         ...citizenQuery(req),
         status: { $ne: "deleted" },
      });

      if (!complaint) {
         return res.status(404).json({ error: "Complaint not found" });
      }

      const previousStatus = complaint.status;
      complaint.status = "deleted";
      await complaint.save();

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "deleted",
         performedBy: req.user._id,
         previousStatus,
         newStatus: complaint.status,
      });

      return res.status(200).json({ message: "Complaint deleted successfully" });
   } catch (error) {
      console.error("Error deleting complaint:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid complaint ID" });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};

export const getSimilarComplaints = async (req, res) => {
   try {
      const { lat, lng, category, text } = req.query;
      const numLat = Number(lat);
      const numLng = Number(lng);
      const coordinates = [numLng, numLat];

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000);
      const candidates = await Complaint.find({
         status: { $nin: ["deleted", "closed"] },
         createdAt: { $gte: thirtyDaysAgo },
         location: {
            $near: {
               $geometry: {
                  type: "Point",
                  coordinates,
               },
               $maxDistance: 1000,
            },
         },
      }).limit(40);

      const queryItem = {
         location: { type: "Point", coordinates },
         category,
         title: text,
         description: text,
         text,
         createdAt: new Date(),
      };

      const results = [];
      for (const candidate of candidates) {
         const analysis = scorePair(queryItem, candidate, DEFAULT_HISC_CONFIG);
         if (analysis.label === "duplicate" || analysis.label === "related") {
            const dist = distanceInMeters(coordinates, candidate.location?.coordinates);
            results.push({
               id: candidate._id.toString(),
               _id: candidate._id,
               title: candidate.title,
               description: candidate.description ? candidate.description.slice(0, 160) : "",
               category: candidate.category,
               status: candidate.status,
               distanceMeters: Math.round(dist),
               createdAt: candidate.createdAt,
               supportCount: candidate.supportCount ?? 0,
               score: analysis.score,
               label: analysis.label,
               features: analysis.features,
               explanation: analysis.explanation,
            });
         }
      }

      results.sort((a, b) => b.score - a.score);
      return res.status(200).json(results.slice(0, 5));
   } catch (error) {
      console.error("Error finding similar complaints:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
};
