import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
   participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
   complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
   kind: { type: String, enum: ["direct", "complaint"], default: "direct" },
}, { timestamps: true });

conversationSchema.index({ participants: 1, updatedAt: -1 });
export default mongoose.model("Conversation", conversationSchema);
