import Complaint from "../model/complaint.model.js";

const OPEN_STATUSES = ["submitted", "in_review", "assigned", "in_progress"];

export const shouldEscalateComplaint = (complaint, now = new Date()) => (
   OPEN_STATUSES.includes(complaint?.status) &&
   !complaint?.escalated &&
   complaint?.resolutionDeadline &&
   new Date(complaint.resolutionDeadline) <= now
);

export const escalateOverdueComplaints = async (now = new Date()) => {
   const result = await Complaint.updateMany(
      {
         status: { $in: OPEN_STATUSES },
         resolutionDeadline: { $lte: now },
         escalated: false,
      },
      {
         $set: {
            escalated: true,
            escalatedAt: now,
            escalationReason: "Complaint exceeded its resolution SLA.",
         },
      }
   );

   return result.modifiedCount ?? result.nModified ?? 0;
};

export const openComplaintStatuses = OPEN_STATUSES;
