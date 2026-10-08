const CommunityComplaintCard = ({ complaint, onSupport, supporting = false }) => (
   <article className="rounded-xl border border-[#E2E6E4] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
         <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold text-[#87919B]">{complaint.complaintId}</p>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#17202A]">{complaint.title}</h3>
         </div>
         <span className="shrink-0 rounded-md border border-[#E2E6E4] bg-[#F1F3F2] px-2 py-1 text-[10px] font-semibold capitalize text-[#52606D]">{complaint.priority}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#52606D]">{complaint.description}</p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E2E6E4] pt-3 text-xs text-[#87919B]">
         <span>{complaint.category}</span>
         <span className="font-semibold text-[#24527A]">{complaint.supportCount ?? 0} supported</span>
      </div>
      <button type="button" disabled={complaint.supportedByMe || supporting} onClick={() => onSupport?.(complaint)} className={`mt-3 min-h-10 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${complaint.supportedByMe ? "border border-[#C6E7D5] bg-[#ECF5F0] text-[#28704F]" : "bg-[#173B5E] text-white hover:bg-[#122E4A] disabled:opacity-50"}`}>
         {supporting ? "Supporting..." : complaint.supportedByMe ? "You support this complaint" : "I am affected too"}
      </button>
   </article>
);

export default CommunityComplaintCard;
