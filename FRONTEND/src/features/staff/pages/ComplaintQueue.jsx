import { useNavigate } from "react-router-dom";
import ComplaintQueueFilters from "../components/ComplaintQueueFilters";
import StaffComplaintCard from "../components/StaffComplaintCard";
import useStaffComplaints from "../hook/useStaffComplaints";

const ComplaintQueue = () => {
   const navigate = useNavigate();
   const { complaints, filters, setFilters, loading, error } = useStaffComplaints();

   const counts = {
      total: complaints.length,
      pending: complaints.filter((c) => ["submitted", "in_review"].includes(c.status)).length,
      inProgress: complaints.filter((c) => ["assigned", "in_progress"].includes(c.status)).length,
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
            {/* Page Header */}
            <div className="space-y-1 border-b border-[#E2E6E4] pb-6">
               <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#39756B]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">
                     Department Staff Workspace
                  </p>
               </div>
               <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                  Complaint Queue
               </h1>
               <p className="text-sm text-[#52606D]">
                  Manage, prioritize, and triage municipal complaints routed to your department.
               </p>
            </div>

            {/* Queue Summary Strip */}
            {!loading && !error && (
               <section aria-label="Queue Metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Matching Queue</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#173B5E]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.total}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Complaints listed</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Pending Triage</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#52606D]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.pending}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Needs review</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Active Fieldwork</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#587044]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.inProgress}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Assigned or in progress</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Resolved</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#28704F]" />
                     </div>
                     <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                        {counts.resolved}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Completed</p>
                  </div>
               </section>
            )}

            {/* Filter Section */}
            <div className="rounded-xl border border-[#E2E6E4] bg-white p-1 shadow-2xs">
               <ComplaintQueueFilters value={filters} onChange={setFilters} />
            </div>

            {/* Loading State */}
            {loading && (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                     <div
                        key={n}
                        className="h-44 rounded-xl border border-[#E2E6E4] bg-white p-4 space-y-3"
                     >
                        <div className="flex justify-between">
                           <div className="h-4 w-20 rounded bg-[#F1F3F2]" />
                           <div className="h-4 w-14 rounded bg-[#F1F3F2]" />
                        </div>
                        <div className="h-5 w-3/4 rounded bg-[#F1F3F2]" />
                        <div className="grid grid-cols-2 gap-3 pt-2">
                           <div className="h-4 w-16 rounded bg-[#F1F3F2]" />
                           <div className="h-4 w-20 rounded bg-[#F1F3F2]" />
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* Error Banner */}
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                     </svg>
                  </div>
                  <h3 className="text-base font-semibold text-[#17202A]">No complaints found</h3>
                  <p className="mt-1 text-sm text-[#52606D] max-w-sm mx-auto">
                     No complaints match your active filter criteria. Try adjusting the status, priority, or category filters.
                  </p>
               </div>
            )}

            {/* Complaints Grid */}
            {!loading && !error && complaints.length > 0 && (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {complaints.map((complaint) => (
                     <StaffComplaintCard
                        key={complaint._id}
                        complaint={complaint}
                        onView={(c) => navigate(`/staff/complaints/${c._id}`)}
                     />
                  ))}
               </div>
            )}
         </main>
      </div>
   );
};

export default ComplaintQueue;