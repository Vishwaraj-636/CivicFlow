import { randomUUID } from "node:crypto";
import Complaint from "../model/complaint.model.js";
import Department from "../model/department.model.js";
import { recordComplaintTimeline } from "./complaintTimeline.controller.js";
import { findSimilarComplaints } from "../service/complaintSimilarity.service.js";
import { uploadMedia, validateMediaFile } from "../service/imagekit.service.js";

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
         assignedDepartment: department?._id ?? null,
         complaintId: `CF-${randomUUID()}`,
         citizenId: req.user._id,
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

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "created",
         performedBy: req.user._id,
         newStatus: complaint.status,
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
      complaint.assignedStaff = req.user._id;
      complaint.assignedAt = complaint.assignedAt ?? new Date();
      complaint.status = "in_review";
      await complaint.save();
      await recordStaffStatusChange(complaint, req, previousStatus, "accepted");
      return res.status(200).json(complaint);
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
         resolved: ["closed"],
         rejected: [],
         closed: [],
      };
      const newStatus = req.body.newStatus;
      if (!allowedTransitions[previousStatus]?.includes(newStatus)) {
         return res.status(409).json({
            error: `Cannot change complaint status from ${previousStatus} to ${newStatus}`,
         });
      }
      complaint.status = newStatus;
      await complaint.save();

      await recordComplaintTimeline({
         complaintId: complaint._id,
         action: "status_changed",
         performedBy: req.user._id,
         previousStatus,
         newStatus: complaint.status,
         remark: req.body.remark,
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
      await complaint.save();
      await recordStaffStatusChange(complaint, req, previousStatus, "resolved");
      return res.status(200).json(complaint);
   } catch (error) {
      console.error("Error resolving complaint:", error);
      if (error.name === "CastError" || error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
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
         remark: req.body.remark,
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
