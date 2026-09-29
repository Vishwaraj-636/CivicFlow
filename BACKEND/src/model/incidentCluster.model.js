import mongoose from "mongoose";

const incidentClusterSchema = new mongoose.Schema(
   {
      clusterId: { type: String, required: true, unique: true, trim: true },
      primaryComplaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
      complaintIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Complaint" }],
      category: { type: String, required: true, trim: true },
      departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
      centroid: {
         type: { type: String, enum: ["Point"], default: "Point" },
         coordinates: { type: [Number], required: true },
      },
      complaintCount: { type: Number, default: 1, min: 1 },
      affectedRadius: { type: Number, default: 0, min: 0 },
      similarityConfidence: { type: Number, default: 0, min: 0, max: 1 },
      priorityScore: { type: Number, default: 0, min: 0, max: 1 },
      status: {
         type: String,
         enum: ["open", "in_progress", "resolved", "closed"],
         default: "open",
      },
   },
   { timestamps: true }
);

incidentClusterSchema.index({ centroid: "2dsphere" });

export default mongoose.model("IncidentCluster", incidentClusterSchema);