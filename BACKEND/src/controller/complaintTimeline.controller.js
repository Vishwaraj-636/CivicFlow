import Complaint from "../model/complaint.model.js";
import ComplaintTimeline from "../model/complaintTimeline.model.js";

export const recordComplaintTimeline = async ({
   complaintId,
   action,
   performedBy,
   previousStatus = null,
   newStatus = null,
   remark = null,
}) => {
   try {
      return await ComplaintTimeline.create({
         complaintId,
         action,
         performedBy,
         previousStatus,
         newStatus,
         remark,
      });
   } catch (error) {
      console.error("Error recording complaint timeline event:", error);
      return null;
   }
};

export const getComplaintTimeline = async (req, res) => {
   try {
      const complaint = await Complaint.findOne({
         _id: req.params.id,
         citizenId: req.user._id,
      }).select("_id");

      if (!complaint) {
         return res.status(404).json({ error: "Complaint not found" });
      }

      const timeline = await ComplaintTimeline.find({ complaintId: complaint._id })
         .populate("performedBy", "fullname role")
         .sort({ timestamp: 1 });

      return res.status(200).json(timeline);
   } catch (error) {
      console.error("Error fetching complaint timeline:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid complaint ID" });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
};
