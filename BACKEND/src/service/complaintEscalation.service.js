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

let lastEscalationCheck = 0;
const ESCALATION_THROTTLE_MS = 60000;

/**
 * Throttled escalation check running at most once every 60 seconds per process.
 * Ideal for free-tier hosting where background intervals may sleep.
 * @param {Date} [now=new Date()]
 * @param {boolean} [force=false]
 * @returns {Promise<number>} Number of newly escalated complaints
 */
export const lazyEscalateOverdueComplaints = async (now = new Date(), force = false) => {
   const currentTime = now instanceof Date ? now.getTime() : Date.now();
   if (!force && currentTime - lastEscalationCheck < ESCALATION_THROTTLE_MS) {
      return 0;
   }
   lastEscalationCheck = currentTime;
   return escalateOverdueComplaints(now);
};

export const resetLazyEscalationThrottle = () => {
   lastEscalationCheck = 0;
};
