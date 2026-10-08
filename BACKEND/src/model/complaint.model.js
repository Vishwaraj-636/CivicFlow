import mongoose from "mongoose";
import locationSchema from "./location.schema.js";
import { calculateResolutionDeadline, getSlaHours } from "../service/sla.service.js";

const complaintSchema = new mongoose.Schema(
   {
      complaintId: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      citizenId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      title: {
         type: String,
         required: true,
         trim: true,
      },
      description: {
         type: String,
         required: true,
         trim: true,
      },
      category: {
         type: String,
         required: true,
         trim: true,
      },
      media: [
         {
            fileId: {
               type: String,
               required: true,
               trim: true,
            },
            url: {
               type: String,
               required: true,
               trim: true,
            },
            type: {
               type: String,
               required: true,
               trim: true,
            },
            metadata: {
               originalName: { type: String, trim: true },
               mimeType: { type: String, trim: true },
               size: { type: Number, min: 0 },
            },
         },
      ],
      location: {
         type: locationSchema,
         required: true,
      },
      address: {
         type: String,
         required: true,
         trim: true,
      },
      status: {
         type: String,
         enum: ["submitted", "in_review", "in_progress", "assigned", "resolved", "rejected", "closed", "deleted"],
         default: "submitted",
      },
      priority: {
         type: String,
         enum: ["low", "medium", "high", "urgent"],
         default: "medium",
      },
      supportCount: {
         type: Number,
         min: 0,
         default: 0,
      },
      slaDurationHours: {
         type: Number,
         required: true,
         min: 1,
      },
      resolutionDeadline: {
         type: Date,
         required: true,
      },
      escalated: {
         type: Boolean,
         default: false,
      },
      escalatedAt: {
         type: Date,
         default: null,
      },
      escalationReason: {
         type: String,
         trim: true,
         default: null,
      },
      assignedDepartment: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Department",
         default: null,
      },
      assignedStaff: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },
      assignedAt: {
         type: Date,
         default: null,
      },
      groupId: {
         type: mongoose.Schema.Types.ObjectId,
         default: null,
      },
      duplicateOf: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Complaint",
         default: null,
      },
      similarityScore: {
         type: Number,
         min: 0,
         max: 1,
         default: null,
      },
      resolutionDescription: {
         type: String,
         trim: true,
         default: null,
      },
      resolutionVerificationStatus: {
         type: String,
         enum: ["pending", "confirmed", "rejected", null],
         default: null,
      },
      resolutionVerifiedAt: {
         type: Date,
         default: null,
      },
      resolutionVerificationRemark: {
         type: String,
         trim: true,
         default: null,
      },
      rejectionReason: {
         type: String,
         trim: true,
         default: null,
      },
      resolutionMedia: [
         {
            fileId: {
               type: String,
               required: true,
               trim: true,
            },
            url: {
               type: String,
               required: true,
               trim: true,
            },
            type: {
               type: String,
               required: true,
               trim: true,
            },
         },
      ],
   },
   {
      timestamps: true,
   }
);

complaintSchema.pre("validate", function setSlaDeadline() {
   if (!this.slaDurationHours || !this.resolutionDeadline) {
      this.slaDurationHours = getSlaHours(this.priority);
      this.resolutionDeadline = calculateResolutionDeadline(this.priority, this.createdAt ?? new Date());
   }
});

complaintSchema.post("init", function setLegacySlaFields(document) {
   if (!document.slaDurationHours || !document.resolutionDeadline) {
      document.slaDurationHours = getSlaHours(document.priority);
      document.resolutionDeadline = calculateResolutionDeadline(document.priority, document.createdAt ?? new Date());
   }
});

complaintSchema.index({ location: "2dsphere" });
complaintSchema.index({ createdAt: 1, category: 1, assignedDepartment: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
