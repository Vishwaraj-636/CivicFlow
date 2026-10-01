import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema({
   conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
   senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
   message: { type: String, required: true, trim: true, maxlength: 2000 },
   readAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("DirectMessage", directMessageSchema);
