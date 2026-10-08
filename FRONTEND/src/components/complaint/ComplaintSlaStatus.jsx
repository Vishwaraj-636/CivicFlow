import { useEffect, useState } from "react";

const WARNING_RATIO = 0.2;
const SLA_HOURS = { urgent: 24, high: 48, medium: 120, low: 168 };

const getDeadline = (complaint) => {
   if (complaint?.resolutionDeadline) return new Date(complaint.resolutionDeadline).getTime();
   const createdAt = new Date(complaint?.createdAt).getTime();
   const duration = (SLA_HOURS[complaint?.priority] ?? SLA_HOURS.medium) * 60 * 60 * 1000;
   return Number.isFinite(createdAt) ? createdAt + duration : Number.NaN;
};

const formatRemaining = (milliseconds) => {
   const totalMinutes = Math.max(0, Math.ceil(milliseconds / (60 * 1000)));
   const days = Math.floor(totalMinutes / (24 * 60));
   const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
   const minutes = totalMinutes % 60;
   if (days > 0) return `${days}d ${hours}h remaining`;
   if (hours > 0) return `${hours}h ${minutes}m remaining`;
   return `${minutes}m remaining`;
};

const getSlaState = (complaint, now) => {
   const deadline = getDeadline(complaint);
   if (!Number.isFinite(deadline)) return { label: "SLA unavailable", className: "text-[#87919B]" };
   if (["resolved", "closed", "rejected"].includes(complaint.status)) return { label: "SLA stopped", className: "text-[#28704F]" };

   const remaining = deadline - now;
   if (remaining <= 0) return { label: "SLA overdue", className: "text-[#A44A4A]" };

   const createdAt = new Date(complaint.createdAt).getTime();
   const duration = deadline - createdAt;
   if (Number.isFinite(createdAt) && remaining <= duration * WARNING_RATIO) {
      return { label: `${formatRemaining(remaining)} · approaching`, className: "text-[#A06A19]" };
   }
   return { label: formatRemaining(remaining), className: "text-[#28704F]" };
};

const ComplaintSlaStatus = ({ complaint, compact = false }) => {
   const [now, setNow] = useState(() => Date.now());

   useEffect(() => {
      const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
      return () => window.clearInterval(timer);
   }, []);

   const state = getSlaState(complaint, now);
   const deadlineValue = getDeadline(complaint);
   const deadline = Number.isFinite(deadlineValue)
      ? new Date(deadlineValue).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : "Not assigned";

   return (
      <div className={`${compact ? "text-xs" : "text-sm"} ${state.className}`} title={`Resolution deadline: ${deadline}`}>
         <span className="font-semibold">{state.label}</span>
         {!compact && <span className="ml-1 text-[#87919B]">(due {deadline})</span>}
      </div>
   );
};

export default ComplaintSlaStatus;
