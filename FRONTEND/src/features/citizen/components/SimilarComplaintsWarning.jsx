import { useState } from "react";

const FEATURE_LABELS = {
   category: "Category Match",
   geographic: "Geographic Proximity",
   lexical: "Word Overlap",
   semantic: "Concept Alignment",
   temporal: "Time Recency",
};

const STATUS_BADGES = {
   submitted: { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "Submitted" },
   in_review: { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "In Review" },
   in_progress: { bg: "bg-purple-50 text-purple-700 border-purple-200", label: "In Progress" },
   assigned: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Assigned" },
   resolved: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Resolved" },
};

export default function SimilarComplaintsWarning({
   similarItems = [],
   loading = false,
   onSupport,
   onDismissDifferent,
   isDismissed = false,
}) {
   const [expandedCards, setExpandedCards] = useState({});
   const [supportedCardIds, setSupportedCardIds] = useState(new Set());
   const [supportingId, setSupportingId] = useState(null);

   if (isDismissed || (!loading && similarItems.length === 0)) {
      return null;
   }

   const toggleExpand = (id) => {
      setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
   };

   const handleSupportClick = async (item) => {
      const id = item.id || item._id;
      setSupportingId(id);
      try {
         if (onSupport) {
            await onSupport(id);
         }
         setSupportedCardIds((prev) => new Set([...prev, id]));
      } catch (err) {
         console.error("Failed to support complaint:", err);
      } finally {
         setSupportingId(null);
      }
   };

   // Filter out cards that were already supported by the user
   const visibleItems = similarItems.filter((item) => !supportedCardIds.has(item.id || item._id));

   if (visibleItems.length === 0 && !loading) {
      return null;
   }

   return (
      <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 sm:p-6 shadow-xs space-y-4 transition-all">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
               <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm">
                  !
               </span>
               <div>
                  <h3 className="text-base font-semibold text-amber-950">
                     Similar issues reported near you
                  </h3>
                  <p className="text-xs text-amber-800">
                     We found {visibleItems.length} active civic {visibleItems.length === 1 ? "report" : "reports"} within 1 km that may cover your issue.
                  </p>
               </div>
            </div>

            <button
               type="button"
               onClick={onDismissDifferent}
               className="self-start sm:self-center text-xs font-semibold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
               My issue is different &rarr;
            </button>
         </div>

         {loading && (
            <div className="flex items-center gap-2 py-4 text-xs text-amber-800">
               <svg className="h-4 w-4 animate-spin text-amber-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
               </svg>
               <span>Checking for nearby duplicate reports...</span>
            </div>
         )}

         <div className="space-y-3">
            {visibleItems.map((item) => {
               const id = item.id || item._id;
               const isExpanded = Boolean(expandedCards[id]);
               const isDuplicate = item.label === "duplicate";
               const statusBadge = STATUS_BADGES[item.status] || {
                  bg: "bg-gray-100 text-gray-700 border-gray-200",
                  label: item.status,
               };

               return (
                  <div
                     key={id}
                     className="rounded-lg border border-amber-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                     <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                           <div className="flex flex-wrap items-center gap-2">
                              <span
                                 className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                    isDuplicate
                                       ? "bg-rose-100 text-rose-800 border border-rose-200"
                                       : "bg-teal-100 text-teal-800 border border-teal-200"
                                 }`}
                              >
                                 {isDuplicate ? "Possible Duplicate" : "Related Issue"}
                              </span>
                              <span
                                 className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${statusBadge.bg}`}
                              >
                                 {statusBadge.label}
                              </span>
                              <span className="text-xs text-[#52606D] font-medium">
                                 {item.distanceMeters ?? 0}m away
                              </span>
                              <span className="text-xs text-[#87919B]">
                                 &bull; {item.supportCount ?? 0} citizens affected
                              </span>
                           </div>

                           <h4 className="text-sm font-semibold text-[#17202A] pt-1">
                              {item.title}
                           </h4>
                           <p className="text-xs text-[#52606D] line-clamp-2">
                              {item.description}
                           </p>
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
                           <button
                              type="button"
                              onClick={() => handleSupportClick(item)}
                              disabled={supportingId === id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#39756B] hover:bg-[#2e5e56] text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
                           >
                              {supportingId === id ? "Supporting..." : "I am affected too"}
                           </button>
                        </div>
                     </div>

                     {/* Expandable Feature Breakdown */}
                     <div className="pt-1 border-t border-[#F1F3F2]">
                        <button
                           type="button"
                           onClick={() => toggleExpand(id)}
                           className="flex items-center gap-1 text-xs font-semibold text-[#24527A] hover:underline cursor-pointer"
                        >
                           <span>{isExpanded ? "Hide similarity breakdown" : "View similarity signals"}</span>
                           <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                        </button>

                        {isExpanded && (
                           <div className="mt-3 p-3 rounded-lg bg-[#F7F9F8] border border-[#E2E6E4] space-y-2.5 text-xs">
                              <p className="font-semibold text-[#17202A]">
                                 HISC Similarity Signals (Overall: {Math.round((item.score ?? 0) * 100)}%)
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 {Object.entries(item.features || {}).map(([key, value]) => {
                                    const percent = Math.round(Number(value || 0) * 100);
                                    return (
                                       <div key={key} className="space-y-0.5">
                                          <div className="flex justify-between text-[11px] text-[#52606D]">
                                             <span>{FEATURE_LABELS[key] || key}</span>
                                             <span className="font-medium">{percent}%</span>
                                          </div>
                                          <div className="h-1.5 w-full bg-[#E2E6E4] rounded-full overflow-hidden">
                                             <div
                                                className="h-full bg-[#39756B] rounded-full transition-all"
                                                style={{ width: `${percent}%` }}
                                             />
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>

                              {Array.isArray(item.explanation) && item.explanation.length > 0 && (
                                 <div className="pt-1">
                                    <p className="text-[11px] font-semibold text-[#52606D]">Analysis notes:</p>
                                    <ul className="list-disc list-inside text-[11px] text-[#52606D] space-y-0.5 pl-1">
                                       {item.explanation.map((note, idx) => (
                                          <li key={idx}>{note}</li>
                                       ))}
                                    </ul>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </section>
   );
}
