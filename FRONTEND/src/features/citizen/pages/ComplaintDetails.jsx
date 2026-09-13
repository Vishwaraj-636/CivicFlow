import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ComplaintStatus from "../../../components/complaint/ComplaintStatus";
import ComplaintTimeline from "../../../components/complaint/ComplaintTimeline";
import GroupedReportsSummary from "../../../components/complaint/GroupedReportsSummary";
import ComplaintMap from "../../../components/maps/ComplaintMap";
import { deleteComplaint, getComplaintById } from "../services/complaint.api";

const CitizenComplaintDetails = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [complaint, setComplaint] = useState(null);
   const [error, setError] = useState("");
   const [deleting, setDeleting] = useState(false);

   useEffect(() => {
      getComplaintById(id)
         .then(setComplaint)
         .catch(() => setError("Complaint not found or you are not authorized to view it."));
   }, [id]);

   async function remove() {
      if (!window.confirm("Are you sure you want to delete this complaint? This action cannot be undone.")) {
         return;
      }
      try {
         setDeleting(true);
         await deleteComplaint(id);
         navigate("/citizen/complaints");
      } catch {
         alert("Unable to delete complaint. Please try again.");
         setDeleting(false);
      }
   }

   if (error) {
      return (
         <div
            className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] p-6"
            style={{
               fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
         >
            <div className="mx-auto max-w-2xl rounded-2xl border border-[#F3D0D0] bg-[#FBF0F0] p-8 text-center shadow-sm">
               <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#A44A4A]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
               </div>
               <h2 className="mt-3 text-lg font-bold text-[#17202A]">Unable to Load Complaint</h2>
               <p className="mt-1 text-sm text-[#A44A4A]">{error}</p>
               <button
                  onClick={() => navigate("/citizen/complaints")}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#173B5E] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#122E4A] cursor-pointer"
               >
                  ← Back to My Complaints
               </button>
            </div>
         </div>
      );
   }

   if (!complaint) {
      return (
         <div
            className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] p-6"
            style={{
               fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
         >
            <div className="mx-auto max-w-4xl space-y-4">
               <div className="h-6 w-32 rounded bg-[#E2E6E4]" />
               <div className="h-10 w-3/4 rounded bg-[#E2E6E4]" />
               <div className="h-32 rounded-2xl bg-white border border-[#E2E6E4]" />
               <div className="h-64 rounded-2xl bg-white border border-[#E2E6E4]" />
            </div>
         </div>
      );
   }

   const relatedReports = complaint.relatedReports ?? complaint.groupedReports?.reports ?? [];
   const relatedCount = complaint.groupedReports?.count ?? relatedReports.length;
   const submittedDate = complaint.createdAt
      ? new Date(complaint.createdAt).toLocaleString("en-IN", {
         dateStyle: "medium",
         timeStyle: "short",
      })
      : "—";

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased"
         style={{
            fontFamily:
               "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
         <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6 md:p-8 lg:p-10">
            {/* ── Breadcrumb & Back Navigation ── */}
            <div>
               <button
                  onClick={() => navigate("/citizen/complaints")}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#52606D] hover:text-[#173B5E] transition-colors cursor-pointer"
               >
                  <svg
                     className="h-4 w-4"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to My Complaints
               </button>
            </div>

            {/* ── Dossier Header ── */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                     <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#173B5E] bg-[#EEF4FA] border border-[#D2E3F3] rounded-md px-2 py-0.5">
                        {complaint.complaintId}
                     </span>
                     <span className="rounded-md border border-[#E2E6E4] bg-[#F1F3F2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#52606D]">
                        {complaint.category}
                     </span>
                  </div>
                  <ComplaintStatus status={complaint.status} />
               </div>

               <h1 className="mt-1 text-xl font-bold tracking-tight text-[#17202A] sm:text-2xl">
                  {complaint.title}
               </h1>

               <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#87919B]">
                  <span>Lodged: {submittedDate}</span>
                  <span>•</span>
                  <span>
                     Dept: {complaint.assignedDepartment?.fullname ?? "Pending assignment"}
                  </span>
               </div>
            </div>

            {/* ── Contextual Lifecycle Notices ── */}
            {complaint.status === "submitted" && (
               <div className="flex items-start gap-3 rounded-xl border border-[#CBD2CF] bg-[#F1F3F2] p-4 text-[#17202A] shadow-xs">
                  <svg
                     className="h-5 w-5 text-[#173B5E] shrink-0 mt-0.5"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  <div>
                     <h2 className="text-sm font-bold text-[#17202A]">Complaint Submitted</h2>
                     <p className="mt-0.5 text-xs text-[#52606D]">
                        Your report has been logged in the municipal intake queue. Department staff will assess the report and initiate dispatch.
                     </p>
                  </div>
               </div>
            )}

            {complaint.status === "rejected" && (
               <div className="flex items-start gap-3 rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-[#A44A4A] shadow-xs">
                  <svg
                     className="h-5 w-5 shrink-0 mt-0.5 text-[#A44A4A]"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  <div>
                     <h2 className="text-sm font-bold text-[#A44A4A]">Complaint Rejected</h2>
                     <p className="mt-0.5 text-xs text-[#A44A4A]">
                        Reason: <strong>{complaint.rejectionReason || "Not actionable"}</strong>.
                        If you believe this decision was made in error, you may file a revised complaint with additional photos and details.
                     </p>
                  </div>
               </div>
            )}

            {complaint.status === "resolved" && (
               <div className="flex items-start gap-3 rounded-xl border border-[#C6E7D5] bg-[#ECF5F0] p-4 text-[#28704F] shadow-xs">
                  <svg
                     className="h-5 w-5 shrink-0 mt-0.5 text-[#28704F]"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  <div>
                     <h2 className="text-sm font-bold text-[#28704F]">Work Resolved</h2>
                     <p className="mt-0.5 text-xs text-[#28704F]">
                        Department staff has completed work on this complaint.
                        {complaint.resolutionDescription && (
                           <span className="block mt-1 italic">
                              "{complaint.resolutionDescription}"
                           </span>
                        )}
                     </p>
                  </div>
               </div>
            )}

            {/* ── Metadata Grid ── */}
            <div className="grid gap-3 rounded-2xl border border-[#E2E6E4] bg-white p-5 shadow-sm sm:grid-cols-2 md:grid-cols-3">
               <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                     Complaint ID
                  </span>
                  <p className="mt-0.5 font-mono text-xs font-bold text-[#17202A]">
                     {complaint.complaintId}
                  </p>
               </div>
               <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                     Category
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-[#17202A]">
                     {complaint.category}
                  </p>
               </div>
               <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                     Department
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-[#17202A]">
                     {complaint.assignedDepartment?.fullname ?? "Pending assignment"}
                  </p>
               </div>
               <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                     Priority
                  </span>
                  <p className="mt-0.5 text-xs font-semibold capitalize text-[#17202A]">
                     {complaint.priority}
                  </p>
               </div>
               <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                     Submission Date
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-[#17202A]">{submittedDate}</p>
               </div>
               <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                     Current Status
                  </span>
                  <p className="mt-0.5 text-xs font-semibold capitalize text-[#17202A]">
                     {complaint.status.replaceAll("_", " ")}
                  </p>
               </div>
            </div>

            {/* ── Incident Narrative ── */}
            <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <h2 className="text-sm font-bold uppercase tracking-wider text-[#52606D]">
                  Citizen Incident Statement
               </h2>
               <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-[#17202A]">
                  {complaint.description}
               </p>
            </div>

            {/* ── Evidence Media ── */}
            {complaint.media?.length > 0 && (
               <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#52606D]">
                     Submitted Evidence ({complaint.media.length})
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                     {complaint.media.map((item) =>
                        item.type?.startsWith("video/") ? (
                           <video
                              key={item.fileId}
                              src={item.url}
                              controls
                              className="max-h-72 w-full rounded-xl bg-black object-cover border border-[#E2E6E4]"
                           />
                        ) : (
                           <img
                              key={item.fileId}
                              src={item.url}
                              alt={item.metadata?.originalName ?? "Complaint evidence"}
                              className="max-h-72 w-full rounded-xl object-cover border border-[#E2E6E4]"
                           />
                        )
                     )}
                  </div>
               </div>
            )}

            {/* ── Resolution Media if available ── */}
            {complaint.resolutionMedia?.length > 0 && (
               <div className="rounded-2xl border border-[#C6E7D5] bg-[#ECF5F0]/30 p-5 sm:p-6 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#28704F]">
                     Department Resolution Evidence ({complaint.resolutionMedia.length})
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                     {complaint.resolutionMedia.map((item) =>
                        item.type?.startsWith("video/") ? (
                           <video
                              key={item.fileId}
                              src={item.url}
                              controls
                              className="max-h-72 w-full rounded-xl bg-black object-cover border border-[#C6E7D5]"
                           />
                        ) : (
                           <img
                              key={item.fileId}
                              src={item.url}
                              alt="Resolution evidence"
                              className="max-h-72 w-full rounded-xl object-cover border border-[#C6E7D5]"
                           />
                        )
                     )}
                  </div>
               </div>
            )}

            {/* ── Location & GIS Map ── */}
            <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <h2 className="text-sm font-bold uppercase tracking-wider text-[#52606D]">
                  Location Details
               </h2>
               <div className="mt-2 flex items-start gap-2 text-xs text-[#52606D]">
                  <svg
                     className="h-4 w-4 shrink-0 text-[#173B5E] mt-0.5"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                     />
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                     />
                  </svg>
                  <span className="font-medium text-[#17202A]">{complaint.address}</span>
               </div>
               <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E6E4]">
                  <ComplaintMap complaint={complaint} />
               </div>
            </div>

            {/* ── Status Timeline ── */}
            <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#52606D]">
                     Lifecycle Progression
                  </h2>
                  <Link
                     to={`/citizen/complaints/${id}/track`}
                     className="text-xs font-semibold text-[#173B5E] hover:underline"
                  >
                     Full Tracking Audit Trail →
                  </Link>
               </div>
               <div className="mt-4 pt-1">
                  <ComplaintTimeline currentStatus={complaint.status} />
               </div>
            </div>

            {/* ── Related Reports Summary ── */}
            <GroupedReportsSummary count={relatedCount} reports={relatedReports} />

            {/* ── Permitted Citizen Actions ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
               <Link
                  to={`/citizen/complaints/${id}/track`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#173B5E] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30"
               >
                  <svg
                     className="h-4 w-4"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                     />
                  </svg>
                  Track Live Progress
               </Link>

               {complaint.status === "submitted" && (
                  <button
                     onClick={remove}
                     disabled={deleting}
                     className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#F3D0D0] bg-[#FBF0F0] px-4 py-2 text-xs font-semibold text-[#A44A4A] transition-colors hover:bg-[#F3D0D0] cursor-pointer disabled:opacity-50"
                  >
                     <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                     </svg>
                     {deleting ? "Deleting..." : "Withdraw / Delete Report"}
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

export default CitizenComplaintDetails;
