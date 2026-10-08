import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
   {
      recipientId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },
      complaintId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Complaint",
         default: null,
      },
      type: {
         type: String,
         enum: ["resolution_verification"],
         required: true,
      },
      title: {
         type: String,
         required: true,
         trim: true,
      },
      message: {
         type: String,
         required: true,
         trim: true,
      },
      readAt: {
         type: Date,
         default: null,
      },
   },
   { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
