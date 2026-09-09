import React from 'react';

const statusConfig = {
   pending: {
      label: 'Pending',
      className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
   },
   approved: {
      label: 'Approved',
      className: 'bg-green-500/10 text-green-400 border border-green-500/30',
   },
   rejected: {
      label: 'Rejected',
      className: 'bg-red-500/10 text-red-400 border border-red-500/30',
   },
};

const StaffRequestCard = ({ request, onApprove, onReject }) => {
   const { applicant, department, createdAt, status } = request;

   const formattedDate = createdAt
      ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

   const cfg = statusConfig[status] ?? statusConfig.pending;
   const initials = applicant?.fullname
      ? applicant.fullname.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
      : '?';

   return (
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-border/80 transition-colors">
         {/* Avatar */}
         <div className="w-10 h-10 rounded-xl bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center shrink-0">
            <span className="text-primary-accent text-xs font-bold">{initials}</span>
         </div>

         {/* Info */}
         <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-text truncate">{applicant?.fullname ?? '—'}</p>
            <p className="text-xs text-secondary-text truncate mt-0.5">{applicant?.email ?? ''}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
               <span className="text-xs text-muted-text flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {department?.name ?? department?.fullname ?? '—'}
               </span>
               <span className="text-xs text-muted-text/60">{formattedDate}</span>
            </div>
         </div>

         {/* Status */}
         <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${cfg.className}`}>
            {cfg.label}
         </span>

         {/* Actions */}
         {status === 'pending' && (
            <div className="flex gap-2 shrink-0">
               <button
                  onClick={() => onApprove(request)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors cursor-pointer"
               >
                  Approve
               </button>
               <button
                  onClick={() => onReject(request)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors cursor-pointer"
               >
                  Reject
               </button>
            </div>
         )}
      </div>
   );
};

export default StaffRequestCard;

