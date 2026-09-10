import ComplaintStatus from './ComplaintStatus';

/**
 * CalendarIcon — inline SVG calendar icon
 */
const CalendarIcon = () => (
   <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
   </svg>
);

/**
 * LocationPinIcon — inline SVG map-pin icon
 */
const LocationPinIcon = () => (
   <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z" />
      <circle cx="12" cy="8" r="2.5" />
   </svg>
);

/**
 * ComplaintCard
 *
 * Displays a summary card for a single complaint with:
 *   - Complaint ID, Title, Category
 *   - Status badge (via ComplaintStatus)
 *   - Submission date
 *   - Location
 *
 * @param {Object}   complaint
 * @param {string}   complaint._id          - MongoDB ObjectId / complaint ID
 * @param {string}   complaint.title
 * @param {string}   complaint.category
 * @param {string}   complaint.status       - One of the 6 lifecycle stages
 * @param {string}   complaint.createdAt    - ISO date string
 * @param {Object}   complaint.location     - { address?: string }
 * @param {Function} [onClick]              - Called when the card is clicked
 */
const ComplaintCard = ({ complaint, onClick }) => {
   const {
      _id,
      complaintId,
      title = 'Untitled Complaint',
      category = '—',
      status = 'submitted',
      priority = 'medium',
      createdAt,
      location,
   } = complaint ?? {};

   const displayId = complaintId || (_id ? `#${String(_id).slice(-6).toUpperCase()}` : '—');

   const formattedDate = createdAt
      ? new Date(createdAt).toLocaleDateString('en-IN', {
         day: 'numeric',
         month: 'short',
         year: 'numeric',
      })
      : '—';

   const address = complaint?.address ?? location?.address ?? '—';

   return (
      <button
         onClick={onClick}
         className="w-full text-left bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary-accent/40 transition-colors duration-200 group cursor-pointer"
      >
         {/* ── Header row: ID + Status ── */}
         <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold text-muted-text tracking-wider bg-surface-elevated border border-border rounded-lg px-2 py-0.5">
               {displayId}
            </span>
            <ComplaintStatus status={status} size="sm" />
         </div>

         {/* ── Title ── */}
         <p className="text-sm font-semibold text-primary-text leading-snug line-clamp-2 group-hover:text-primary-accent/90 transition-colors">
            {title}
         </p>

         {/* ── Category chip ── */}
         <span className="self-start text-[10px] font-semibold uppercase tracking-widest text-secondary-text bg-surface-elevated border border-border rounded-md px-2 py-0.5">
            {category}
         </span>

         <div className="flex items-center justify-between text-xs text-secondary-text">
            <span>Priority</span>
            <span className="font-semibold capitalize text-primary-text">{priority}</span>
         </div>

         {/* ── Meta: date & location ── */}
         <div className="flex flex-col gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-text">
               <CalendarIcon />
               <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-text">
               <LocationPinIcon />
               <span className="truncate">{address}</span>
            </div>
         </div>
      </button>
   );
};

export default ComplaintCard;

