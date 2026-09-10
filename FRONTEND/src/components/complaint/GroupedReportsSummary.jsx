
/**
 * GroupedReportsSummary
 *
 * An inline info strip (NOT a separate page/section) that surfaces
 * possible related complaint reports grouped near the same location.
 *
 * @param {number}   count        - Number of related reports (e.g. 4)
 * @param {Array}    reports      - Array of related complaint objects:
 *                                  { id, title, category, distanceM }
 * @param {Function} [onViewAll]  - Called when the user clicks "View all"
 */
const GroupedReportsSummary = ({ count = 0, reports = [], onViewAll }) => {
   if (!count && reports.length === 0) return null;

   return (
      <div className="rounded-xl bg-surface-elevated border-l-2 border-primary-accent border border-border/60 px-4 py-3 flex flex-col gap-2.5">
         {/* Header */}
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
               {/* Link / cluster icon */}
               <svg
                  className="w-4 h-4 text-primary-accent shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
               >
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
               </svg>
               <p className="text-sm font-semibold text-primary-text">
                  Possible related reports:{' '}
                  <span className="text-primary-accent">{count}</span>
               </p>
            </div>

            {onViewAll && (
               <button
                  onClick={onViewAll}
                  className="text-xs text-secondary-text hover:text-primary-accent transition-colors cursor-pointer shrink-0"
               >
                  View all
               </button>
            )}
         </div>

         {/* Related report list */}
         {reports.length > 0 && (
            <ul className="flex flex-col gap-1.5">
               {reports.map((r) => (
                  <li
                     key={r.id ?? r._id}
                     className="flex items-center gap-2 text-xs text-secondary-text"
                  >
                     {/* Category chip */}
                     <span className="shrink-0 bg-surface border border-border text-muted-text rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        {r.category}
                     </span>

                     {/* Title (truncated) */}
                     <span className="flex-1 truncate text-secondary-text">{r.title}</span>

                     {/* Distance badge */}
                     {r.distanceM != null && (
                        <span className="shrink-0 bg-surface border border-border rounded-full px-2 py-0.5 text-[10px] text-muted-text">
                           {r.distanceM}m
                        </span>
                     )}
                  </li>
               ))}
            </ul>
         )}
      </div>
   );
};

export default GroupedReportsSummary;

