const ComplaintActionPanel = ({ complaint, onAccept, onReject, onStartWork, onResolve, onClose, disabled = false }) => {
   const canAct = !disabled && !["resolved", "rejected", "closed"].includes(complaint?.status);
   if (!complaint || !canAct) return null;

   return (
      <div className="flex flex-wrap gap-2">
         {['submitted'].includes(complaint.status) && <button type="button" onClick={() => onAccept?.()} className="rounded bg-success px-4 py-2 text-sm font-semibold text-background disabled:opacity-50" disabled={disabled}>Accept</button>}
         {complaint.status === 'submitted' && <button type="button" onClick={() => onReject?.()} className="rounded border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50" disabled={disabled}>Reject</button>}
         {['in_review', 'assigned'].includes(complaint.status) && <button type="button" onClick={() => onStartWork?.()} className="rounded border border-primary-accent px-4 py-2 text-sm font-semibold text-primary-accent disabled:opacity-50" disabled={disabled}>Start Work</button>}
         {['in_review', 'in_progress'].includes(complaint.status) && <button type="button" onClick={() => onResolve?.()} className="rounded bg-primary-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-50" disabled={disabled}>Resolve</button>}
         {complaint.status === 'resolved' && <button type="button" onClick={() => onClose?.()} className="rounded border border-success px-4 py-2 text-sm font-semibold text-success disabled:opacity-50" disabled={disabled}>Close</button>}
      </div>
   );
};

export default ComplaintActionPanel;
