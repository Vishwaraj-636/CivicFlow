import React from 'react';

/**
 * Status configuration for all complaint lifecycle stages.
 * Colors align with the CivicFlow theme tokens defined in App.css.
 */
const STATUS_CONFIG = {
   submitted: {
      label: 'Submitted',
      dot: 'bg-[#6F6B64]',
      pill: 'bg-[#6F6B64]/10 text-[#A7A39B] border border-[#6F6B64]/30',
   },
   in_review: {
      label: 'In Review',
      dot: 'bg-[#7895A0]',
      pill: 'bg-[#7895A0]/10 text-[#7895A0] border border-[#7895A0]/30',
   },
   assigned: {
      label: 'Assigned',
      dot: 'bg-[#9B7EC8]',
      pill: 'bg-[#9B7EC8]/10 text-[#9B7EC8] border border-[#9B7EC8]/30',
   },
   rejected: {
      label: 'Rejected',
      dot: 'bg-danger',
      pill: 'bg-danger/10 text-danger border border-danger/30',
   },
   closed: {
      label: 'Closed',
      dot: 'bg-[#5B9E9A]',
      pill: 'bg-[#5B9E9A]/10 text-[#5B9E9A] border border-[#5B9E9A]/30',
   },
   in_progress: {
      label: 'In Progress',
      dot: 'bg-primary-accent',
      pill: 'bg-primary-accent/10 text-primary-accent border border-primary-accent/30',
   },
   resolved: {
      label: 'Resolved',
      dot: 'bg-success',
      pill: 'bg-success/10 text-success border border-success/30',
   },
};

/**
 * ComplaintStatus
 *
 * Renders a compact styled pill badge for a given complaint lifecycle status.
 * Consistent across all complaint-related views.
 *
 * @param {string}  status - One of the backend complaint statuses
 * @param {string}  [size='md'] - 'sm' | 'md'
 */
const ComplaintStatus = ({ status, size = 'md' }) => {
   const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;

   const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
   const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
   const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

   return (
      <span
         className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-widest ${textSize} ${padding} ${cfg.pill}`}
      >
         <span className={`rounded-full shrink-0 ${dotSize} ${cfg.dot}`} />
         {cfg.label}
      </span>
   );
};

export default ComplaintStatus;

