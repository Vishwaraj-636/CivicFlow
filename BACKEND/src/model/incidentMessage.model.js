import mongoose from "mongoose";

const incidentMessageSchema = new mongoose.Schema({
   incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "IncidentCluster", required: true, index: true },
   senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   senderDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
   message: { type: String, required: true, trim: true, maxlength: 2000 },
   messageType: {
      type: String,
      enum: ["message", "handoff", "status_update", "request", "resolution_note", "system"],
      default: "message",
   },
   mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
}, { timestamps: true });

export default mongoose.model("IncidentMessage", incidentMessageSchema);