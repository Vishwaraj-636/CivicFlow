import mongoose from "mongoose";

const complaintStatuses = [
   "submitted",
   "in_review",
   "in_progress",
   "assigned",
   "resolved",
   "rejected",
   "closed",
   "deleted",
];

const complaintTimelineSchema = new mongoose.Schema(
   {
      complaintId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Complaint",
         required: true,
         index: true,
      },
      action: {
         type: String,
         enum: ["created", "updated", "status_changed", "assigned", "accepted", "resolved", "rejected", "closed", "deleted"],
         required: true,
         trim: true,
      },
      performedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      previousStatus: {
         type: String,
         enum: complaintStatuses,
         default: null,
      },
      newStatus: {
         type: String,
         enum: complaintStatuses,
         default: null,
      },
      remark: {
         type: String,
         trim: true,
         default: null,
      },
      timestamp: {
         type: Date,
         default: Date.now,
      },
   },
   {
      _id: true,
   }
);

complaintTimelineSchema.index({ complaintId: 1, timestamp: 1 });

const ComplaintTimeline = mongoose.model("ComplaintTimeline", complaintTimelineSchema);

export default ComplaintTimeline;
