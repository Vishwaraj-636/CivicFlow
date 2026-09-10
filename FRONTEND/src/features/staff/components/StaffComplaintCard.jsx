const statusLabel = (status = "") => status.replaceAll("_", " ");

const StaffComplaintCard = ({ complaint, onView, onAction }) => (
   <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
         <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-text">{complaint.complaintId}</p>
            <h3 className="mt-1 truncate font-semibold text-primary-text" title={complaint.title}>{complaint.title}</h3>
         </div>
         <span className="shrink-0 rounded-full border border-border px-2 py-1 text-xs capitalize text-secondary-text">
            {complaint.priority}
         </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
         <div><dt className="text-muted-text">Status</dt><dd className="mt-1 capitalize text-primary-text">{statusLabel(complaint.status)}</dd></div>
         <div><dt className="text-muted-text">Category</dt><dd className="mt-1 truncate text-primary-text">{complaint.category}</dd></div>
      </dl>
      <div className="mt-4 flex justify-end gap-2">
         <button type="button" onClick={() => onView?.(complaint)} className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-primary-text hover:bg-surface-elevated">
            View
         </button>
         {onAction && <button type="button" onClick={() => onAction(complaint)} className="rounded bg-primary-accent px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90">Actions</button>}
      </div>
   </article>
);

export default StaffComplaintCard;
