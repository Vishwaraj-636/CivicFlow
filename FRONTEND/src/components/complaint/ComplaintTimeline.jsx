import React from 'react';

/** Ordered lifecycle steps */
const STEPS = [
   { key: 'submitted', label: 'Submitted' },
   { key: 'in_review', label: 'In Review' },
   { key: 'assigned', label: 'Assigned' },
   { key: 'in_progress', label: 'In Progress' },
   { key: 'resolved', label: 'Resolved' },
   { key: 'rejected', label: 'Rejected' },
   { key: 'closed', label: 'Closed' },
];

function getStepState(stepKey, currentStatus) {
   const currentIdx = STEPS.findIndex((s) => s.key === currentStatus);
   const stepIdx = STEPS.findIndex((s) => s.key === stepKey);
   if (stepIdx < currentIdx) return 'done';
   if (stepIdx === currentIdx) return 'active';
   return 'pending';
}

/**
 * ComplaintTimeline
 *
 * Vertical stepper that renders the complaint lifecycle:
 *   submitted → in_review → assigned → resolved → closed
 *
 * @param {string} currentStatus - The current lifecycle stage key
 */
const ComplaintTimeline = ({ currentStatus = 'submitted' }) => {
   return (
      <div className="flex flex-col gap-0">
         {STEPS.map((step, idx) => {
            const state = getStepState(step.key, currentStatus);
            const isLast = idx === STEPS.length - 1;

            /* Node styling */
            const nodeCls =
               state === 'done'
                  ? 'bg-success border-success text-background'
                  : state === 'active'
                     ? 'bg-transparent border-primary-accent text-primary-accent ring-4 ring-primary-accent/20'
                     : 'bg-surface border-border text-muted-text';

            /* Connector line styling */
            const lineCls =
               state === 'done'
                  ? 'border-success'
                  : 'border-border border-dashed';

            return (
               <div key={step.key} className="flex items-stretch gap-3">
                  {/* Left column: node + connector */}
                  <div className="flex flex-col items-center">
                     {/* Circle node */}
                     <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${nodeCls} transition-all duration-300`}
                     >
                        {state === 'done' ? (
                           /* Checkmark */
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                           </svg>
                        ) : state === 'active' ? (
                           /* Pulse dot */
                           <span className="w-2.5 h-2.5 rounded-full bg-primary-accent animate-pulse" />
                        ) : (
                           /* Empty dot */
                           <span className="w-2 h-2 rounded-full bg-muted-text/30" />
                        )}
                     </div>

                     {/* Connector line */}
                     {!isLast && (
                        <div className={`flex-1 w-px border-l-2 my-1 ${lineCls} min-h-6`} />
                     )}
                  </div>

                  {/* Right column: label */}
                  <div className={`pb-5 flex items-start pt-0.5 ${isLast ? 'pb-0' : ''}`}>
                     <span
                        className={`text-sm font-medium transition-colors duration-200 ${state === 'done'
                           ? 'text-success'
                           : state === 'active'
                              ? 'text-primary-accent font-semibold'
                              : 'text-muted-text'
                           }`}
                     >
                        {step.label}
                     </span>
                     {state === 'active' && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-primary-accent/70 bg-primary-accent/10 border border-primary-accent/20 px-1.5 py-0.5 rounded-full">
                           Active
                        </span>
                     )}
                  </div>
               </div>
            );
         })}
      </div>
   );
};

export default ComplaintTimeline;

