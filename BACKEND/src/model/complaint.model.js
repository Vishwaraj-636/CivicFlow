import mongoose from "mongoose";
import locationSchema from "./location.schema.js";

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

complaintSchema.index({ location: "2dsphere" });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
