import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ComplaintCard from "../../../components/complaint/ComplaintCard";
import { getMyComplaints } from "../services/complaint.api";

const CitizenDashboard = () => {
   const [complaints, setComplaints] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const navigate = useNavigate();

   useEffect(() => {
      getMyComplaints()
         .then((data) => {
            setComplaints(Array.isArray(data) ? data : []);
            setError("");
         })
         .catch((err) => {
            console.error(err);
            setError("Unable to load complaints at this time. Please try refreshing.");
         })
         .finally(() => setLoading(false));
   }, []);

   const stats = {
      total: complaints.length,
      submitted: complaints.filter((c) => c.status === "pending" || c.status === "submitted").length,
      inProgress: complaints.filter((c) => c.status === "in_progress").length,
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
            "--color-border": "#E2E6E4",
            "--color-primary-text": "#17202A",
            "--color-secondary-text": "#52606D",
            "--color-muted-text": "#87919B",
            "--color-primary-accent": "#173B5E",
            "--color-accent-hover": "#122E4A",
         }}
      >
         <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 space-y-8">
            {/* Top Area / Context Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E6E4] pb-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="inline-block h-2 w-2 rounded-full bg-[#173B5E]" />
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">
                        Citizen Services Portal
                     </p>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                     Citizen Dashboard
                  </h1>
                  <p className="text-sm text-[#52606D] max-w-xl">
                     Overview of your reported municipal issues, active service requests, and resolution progress.
                  </p>
               </div>
               <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                     to="/request-dept-staff"
                     className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#173B5E] bg-white px-5 py-2.5 text-sm font-medium text-[#173B5E] transition-colors hover:bg-[#EEF4FA] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 text-center shadow-xs cursor-pointer"
                  >
                     Request Staff Access
                  </Link>
                  <Link
                     to="/citizen/complaints/report"
                     className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#173B5E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 text-center shadow-xs cursor-pointer"
                  >
                     Report Complaint
                  </Link>
               </div>
            </div>

            {/* Error Banner */}
            {error && (
               <div className="flex items-start gap-3 rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-sm text-[#A44A4A]">
                  <span className="shrink-0 font-bold">!</span>
                  <p>{error}</p>
               </div>
            )}

            {/* Metric Strip */}
            <section aria-label="Complaint Statistics">
               <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {/* Total Reports */}
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Total Reports</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#173B5E]" />
                     </div>
                     <p className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#17202A]">
                        {loading ? "—" : stats.total}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">All recorded submissions</p>
                  </div>

                  {/* Submitted */}
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Submitted</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#52606D]" />
                     </div>
                     <p className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#17202A]">
                        {loading ? "—" : stats.submitted}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Awaiting initial review</p>
                  </div>

                  {/* In Progress */}
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">In Progress</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#587044]" />
                     </div>
                     <p className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#17202A]">
                        {loading ? "—" : stats.inProgress}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Dispatched to department</p>
                  </div>

                  {/* Resolved */}
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 transition-colors hover:border-[#CBD2CF]">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Resolved</p>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#28704F]" />
                     </div>
                     <p className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#17202A]">
                        {loading ? "—" : stats.resolved}
                     </p>
                     <p className="mt-1 text-xs text-[#87919B]">Completed action taken</p>
                  </div>
               </div>
            </section>

            {/* Recent Complaints Section */}
            <section aria-label="Recent Complaints" className="space-y-4">
               <div className="flex items-center justify-between border-b border-[#E2E6E4] pb-3">
                  <div>
                     <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#17202A]">
                        Recent Complaints
                     </h2>
                     <p className="text-xs text-[#87919B]">Latest activity on your citizen submissions</p>
                  </div>
                  <Link
                     to="/citizen/complaints"
                     className="inline-flex min-h-[44px] items-center text-xs sm:text-sm font-medium text-[#173B5E] hover:text-[#122E4A] hover:underline"
                  >
                     View All →
                  </Link>
               </div>

               {loading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     {[1, 2].map((n) => (
                        <div
                           key={n}
                           className="h-44 rounded-2xl border border-[#E2E6E4] bg-white p-5"
                        >
                           <div className="flex justify-between">
                              <div className="h-4 w-20 rounded bg-[#F1F3F2]" />
                              <div className="h-4 w-16 rounded bg-[#F1F3F2]" />
                           </div>
                           <div className="mt-4 h-5 w-3/4 rounded bg-[#F1F3F2]" />
                           <div className="mt-3 h-4 w-24 rounded bg-[#F1F3F2]" />
                           <div className="mt-6 flex justify-between">
                              <div className="h-3 w-28 rounded bg-[#F1F3F2]" />
                              <div className="h-3 w-36 rounded bg-[#F1F3F2]" />
                           </div>
                        </div>
                     ))}
                  </div>
               ) : complaints.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#CBD2CF] bg-white p-8 sm:p-10 text-center">
                     <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F3F2] text-[#52606D] mb-3">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                     </div>
                     <h3 className="text-base font-semibold text-[#17202A]">No complaints submitted yet</h3>
                     <p className="mt-1 text-sm text-[#52606D] max-w-sm mx-auto">
                        When you submit municipal reports, they will appear here for tracking and status updates.
                     </p>
                     <div className="mt-5">
                        <Link
                           to="/citizen/complaints/report"
                           className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#173B5E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#122E4A] cursor-pointer"
                        >
                           Report a Complaint
                        </Link>
                     </div>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     {complaints.slice(0, 4).map((complaint) => (
                        <ComplaintCard
                           key={complaint._id}
                           complaint={complaint}
                           onClick={() => navigate(`/citizen/complaints/${complaint._id}`)}
                        />
                     ))}
                  </div>
               )}
            </section>
         </main>
      </div>
   );
};

export default CitizenDashboard;