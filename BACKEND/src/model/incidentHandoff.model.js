import mongoose from "mongoose";

const incidentHandoffSchema = new mongoose.Schema({
   incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "IncidentCluster", required: true, index: true },
   fromDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
   toDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
   requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
   note: { type: String, trim: true, maxlength: 1000 },
   decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
   decidedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("IncidentHandoff", incidentHandoffSchema);