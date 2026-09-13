import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssignedComplaints } from "../services/staff.api";

const statusColors = {
   submitted: "bg-[#F1F3F5] text-[#52606D] border-[#E2E6E4]",
   pending: "bg-[#F1F3F5] text-[#52606D] border-[#E2E6E4]",
   in_review: "bg-[#EEF4FA] text-[#24527A] border-[#D2E3F3]",
   assigned: "bg-[#EEF4FA] text-[#24527A] border-[#D2E3F3]",
   in_progress: "bg-[#F3F6EF] text-[#587044] border-[#DDE7D3]",
   resolved: "bg-[#ECF5F0] text-[#28704F] border-[#C6E7D5]",
   rejected: "bg-[#FBF0F0] text-[#A44A4A] border-[#F3D0D0]",
   closed: "bg-[#F0F1F2] text-[#454C52] border-[#DFE1E3]",
};

const AssignedComplaints = () => {
   const [complaints, setComplaints] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const navigate = useNavigate();

   useEffect(() => {
      getAssignedComplaints()
         .then((data) => setComplaints(Array.isArray(data) ? data : []))
         .catch(() => setError("Unable to load your assigned complaints."))
         .finally(() => setLoading(false));
   }, []);

   const counts = {
      total: complaints.length,
      inProgress: complaints.filter((c) => c.status === "in_progress").length,
      assigned: complaints.filter((c) => ["assigned", "in_review"].includes(c.status)).length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
   };

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased"
         style={{
            fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "--color-surface": "#FFFFFF",
            "--color-surface-secondary": "#F1F3F2",
            "--color-surface-elevated": "#F1F3F2",
            "--color-surface-bright": "#F7F7F5",
            "--color-border": "#E2E6E4",
            "--color-primary-text": "#17202A",
            "--color-secondary-text": "#52606D",
            "--color-muted-text": "#87919B",
            "--color-primary-accent": "#173B5E",
            "--color-accent-hover": "#122E4A",
         }}
      >
         <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 space-y-6">
            {/* Header */}
            <div className="space-y-1 border-b border-[#E2E6E4] pb-6">
               <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#39756B]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">
                     Department Staff Workspace
                  </p>
               </div>
               <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                  Assigned Complaints
               </h1>
               <p className="text-sm text-[#52606D]">
                  Complaints currently assigned to your direct operational responsibility.
               </p>
            </div>

            {/* Metrics Summary Strip */}
            {!loading && !error && (
               <section aria-label="Assigned Metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Assigned to You</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#173B5E]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.total}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Active case files</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Awaiting Review</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#24527A]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.assigned}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Intake triage</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">In Progress</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#587044]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.inProgress}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Active remediation</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Resolved</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#28704F]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.resolved}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Completed cases</p>
                  </div>
               </section>
            )}

            {/* Loading */}
            {loading && (
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-8 space-y-4">
                  <div className="h-6 w-48 rounded bg-[#F1F3F2]" />
                  <div className="h-4 w-full rounded bg-[#F1F3F2]" />
                  <div className="h-4 w-3/4 rounded bg-[#F1F3F2]" />
               </div>
            )}

            {/* Error */}
            {error && (
               <div className="flex items-start gap-3 rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-sm text-[#A44A4A]">
                  <span className="shrink-0 font-bold">!</span>
                  <p>{error}</p>
               </div>
            )}

            {/* Empty State */}
            {!loading && !error && complaints.length === 0 && (
               <div className="rounded-xl border border-dashed border-[#CBD2CF] bg-white p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F3F2] text-[#52606D] mb-3">
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                     </svg>
                  </div>
                  <h3 className="text-base font-semibold text-[#17202A]">No complaints currently assigned</h3>
                  <p className="mt-1 text-sm text-[#52606D] max-w-sm mx-auto">
                     You do not have any active complaints assigned directly to you. Check the department queue to accept new submissions.
                  </p>
               </div>
            )}

            {/* Mobile Stacked Card View (Screens < 640px) */}
            {!loading && !error && complaints.length > 0 && (
               <div className="block sm:hidden space-y-3">
                  {complaints.map((complaint) => {
                     const pillCls = statusColors[complaint.status] || "bg-[#F1F3F5] text-[#52606D] border-[#E2E6E4]";
                     return (
                        <div
                           key={complaint._id}
                           className="rounded-xl border border-[#E2E6E4] bg-white p-4 space-y-3 shadow-2xs"
                        >
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <span className="text-xs font-mono font-semibold text-[#52606D]">
                                    {complaint.complaintId || `#${String(complaint._id).slice(-6).toUpperCase()}`}
                                 </span>
                                 <h3 className="text-sm font-semibold text-[#17202A] mt-0.5 line-clamp-2">
                                    {complaint.title}
                                 </h3>
                              </div>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide shrink-0 ${pillCls}`}>
                                 {complaint.status?.replaceAll("_", " ")}
                              </span>
                           </div>

                           <div className="flex items-center justify-between text-xs text-[#52606D] pt-1 border-t border-[#E2E6E4]">
                              <span className="capitalize font-medium">Priority: {complaint.priority}</span>
                              <span>
                                 {complaint.assignedAt ? new Date(complaint.assignedAt).toLocaleDateString() : "—"}
                              </span>
                           </div>

                           <button
                              type="button"
                              onClick={() => navigate(`/staff/complaints/${complaint._id}`)}
                              className="w-full min-h-[44px] rounded-lg bg-[#173B5E] text-white text-xs font-semibold flex items-center justify-center transition hover:bg-[#122E4A] cursor-pointer"
                           >
                              View & Triage →
                           </button>
                        </div>
                     );
                  })}
               </div>
            )}

            {/* Desktop / Tablet Table View (Screens >= 640px) */}
            {!loading && !error && complaints.length > 0 && (
               <div className="hidden sm:block overflow-hidden rounded-xl border border-[#E2E6E4] bg-white shadow-2xs">
                  <table className="w-full text-left text-sm text-[#52606D]">
                     <thead className="border-b border-[#E2E6E4] bg-[#F1F3F2] text-xs uppercase tracking-wider text-[#17202A]">
                        <tr>
                           <th className="px-6 py-3.5 font-semibold">Complaint ID</th>
                           <th className="px-6 py-3.5 font-semibold">Title</th>
                           <th className="px-6 py-3.5 font-semibold">Priority</th>
                           <th className="px-6 py-3.5 font-semibold">Status</th>
                           <th className="px-6 py-3.5 font-semibold">Assigned Date</th>
                           <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#E2E6E4]">
                        {complaints.map((complaint) => {
                           const pillCls = statusColors[complaint.status] || "bg-[#F1F3F5] text-[#52606D] border-[#E2E6E4]";
                           return (
                              <tr key={complaint._id} className="transition-colors hover:bg-[#F7F7F5]">
                                 <td className="px-6 py-4 font-mono font-semibold text-xs text-[#17202A]">
                                    {complaint.complaintId || `#${String(complaint._id).slice(-6).toUpperCase()}`}
                                 </td>
                                 <td className="max-w-[280px] truncate px-6 py-4 font-medium text-[#17202A]" title={complaint.title}>
                                    {complaint.title}
                                 </td>
                                 <td className="px-6 py-4 capitalize text-xs font-semibold">
                                    <span className={`inline-block px-2 py-0.5 rounded border text-xs ${complaint.priority === 'urgent' || complaint.priority === 'high'
                                          ? 'border-[#F3D0D0] bg-[#FBF0F0] text-[#A44A4A]'
                                          : 'border-[#E2E6E4] bg-[#F1F3F2] text-[#52606D]'
                                       }`}>
                                       {complaint.priority}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${pillCls}`}>
                                       {complaint.status?.replaceAll("_", " ")}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-xs text-[#87919B]">
                                    {complaint.assignedAt ? new Date(complaint.assignedAt).toLocaleDateString() : "—"}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button
                                       type="button"
                                       onClick={() => navigate(`/staff/complaints/${complaint._id}`)}
                                       className="inline-flex min-h-[36px] items-center rounded-lg border border-[#CBD2CF] bg-white px-3.5 py-1.5 text-xs font-medium text-[#173B5E] hover:bg-[#173B5E] hover:text-white transition cursor-pointer"
                                    >
                                       View
                                    </button>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            )}
         </main>
      </div>
   );
};

export default AssignedComplaints;