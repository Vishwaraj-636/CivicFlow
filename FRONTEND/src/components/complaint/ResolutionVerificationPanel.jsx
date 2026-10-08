import { useState } from "react";
import { verifyComplaintResolution } from "../../features/citizen/services/complaint.api";

const ResolutionVerificationPanel = ({ complaint, onVerified }) => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [remark, setRemark] = useState("");

   if (complaint?.resolutionVerificationStatus !== "pending") return null;

   const submit = async (confirmed) => {
      setLoading(true);
      setError("");
      try {
         const updatedComplaint = await verifyComplaintResolution(complaint._id, confirmed, remark);
         onVerified?.(updatedComplaint);
      } catch (verificationError) {
         setError(verificationError.response?.data?.error ?? "Unable to record your resolution response.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <section className="rounded-2xl border border-[#D2E3F3] bg-[#EEF4FA] p-5 shadow-sm sm:p-6" aria-label="Resolution verification">
         <p className="text-[11px] font-semibold uppercase tracking-wider text-[#24527A]">Action required</p>
         <h2 className="mt-1 text-base font-bold text-[#17202A]">Was this issue fixed?</h2>
         <p className="mt-1 text-sm text-[#52606D]">Staff marked this complaint as resolved. Confirm the fix or tell us the problem still exists so the department can continue work.</p>
         <textarea value={remark} onChange={(event) => setRemark(event.target.value)} rows="2" placeholder="Optional note about the resolution" className="mt-4 w-full rounded-lg border border-[#CBD2CF] bg-white p-3 text-sm text-[#17202A] outline-none focus:border-[#173B5E]" />
         {error && <p className="mt-2 text-xs font-semibold text-[#A44A4A]">{error}</p>}
         <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={loading} onClick={() => submit(true)} className="min-h-10 rounded-lg bg-[#28704F] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{loading ? "Saving..." : "Yes, issue fixed"}</button>
            <button type="button" disabled={loading} onClick={() => submit(false)} className="min-h-10 rounded-lg border border-[#A44A4A] bg-white px-4 py-2 text-xs font-semibold text-[#A44A4A] disabled:opacity-50">Issue still exists</button>
         </div>
      </section>
   );
};

export default ResolutionVerificationPanel;
