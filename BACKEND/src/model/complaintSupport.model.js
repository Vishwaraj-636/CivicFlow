import mongoose from "mongoose";

const complaintSupportSchema = new mongoose.Schema(
   {
      complaintId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Complaint",
         required: true,
      },
      citizenId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
   },
   { timestamps: true }
);

complaintSupportSchema.index({ complaintId: 1, citizenId: 1 }, { unique: true });

const ComplaintSupport = mongoose.model("ComplaintSupport", complaintSupportSchema);

export default ComplaintSupport;
