import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ComplaintStatus from "../../../components/complaint/ComplaintStatus";
import ComplaintTimeline from "../../../components/complaint/ComplaintTimeline";
import { getComplaintById, getComplaintTimeline } from "../services/complaint.api";

const ACTION_LABELS = {
   created: "Report Lodged",
   updated: "Details Updated",
   status_changed: "Status Updated",
   assigned: "Staff Dispatched",
   accepted: "Department Intake Accepted",
   resolved: "Fieldwork Completed",
   rejected: "Report Rejected",
   closed: "Report Closed",
   deleted: "Report Withdrawn",
};

const TrackComplaint = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [complaint, setComplaint] = useState(null);
   const [events, setEvents] = useState([]);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      setLoading(true);
      setError("");
      Promise.all([getComplaintById(id), getComplaintTimeline(id)])
         .then(([item, timeline]) => {
            setComplaint(item);
            setEvents(timeline || []);
         })
         .catch(() => setError("Unable to load complaint tracking details."))
         .finally(() => setLoading(false));
   }, [id]);

   if (error) {
      return (
         <div
            className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] p-6"
            style={{
               fontFamily:
                  "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
         >
            <div className="mx-auto max-w-2xl rounded-2xl border border-[#F3D0D0] bg-[#FBF0F0] p-8 text-center shadow-sm">
               <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#A44A4A]">
                  <svg
                     className="h-6 w-6"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                     />
                  </svg>
               </div>
               <h2 className="mt-3 text-lg font-bold text-[#17202A]">Unable to Load Tracker</h2>
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

   if (loading || !complaint) {
      return (
         <div
            className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] p-6"
            style={{
               fontFamily:
                  "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
         >
            <div className="mx-auto max-w-3xl space-y-4">
               <div className="h-6 w-36 rounded bg-[#E2E6E4]" />
               <div className="h-10 w-3/4 rounded bg-[#E2E6E4]" />
               <div className="h-44 rounded-2xl bg-white border border-[#E2E6E4]" />
               <div className="h-64 rounded-2xl bg-white border border-[#E2E6E4]" />
            </div>
         </div>
      );
   }

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
         <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6 md:p-8 lg:p-10">
            {/* ── Breadcrumb Navigation ── */}
            <div className="flex items-center justify-between">
               <button
                  onClick={() => navigate(`/citizen/complaints/${id}`)}
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
                  Back to Complaint Dossier
               </button>
               <Link
                  to="/citizen/complaints"
                  className="text-xs font-medium text-[#87919B] hover:text-[#173B5E]"
               >
                  All Reports
               </Link>
            </div>

            {/* ── Status Journey Header ── */}
            <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
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

               <h1 className="mt-3 text-xl font-bold tracking-tight text-[#17202A] sm:text-2xl">
                  {complaint.title}
               </h1>

               <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#87919B]">
                  <span>Lodged: {submittedDate}</span>
                  <span>•</span>
                  <span>
                     Dept: {complaint.assignedDepartment?.fullname ?? "Pending assignment"}
                  </span>
               </div>
            </div>

            {/* ── Contextual Rejection Notice if rejected ── */}
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
                     <h2 className="text-sm font-bold text-[#A44A4A]">Processing Stopped: Rejected</h2>
                     <p className="mt-0.5 text-xs text-[#A44A4A]">
                        Reason: <strong>{complaint.rejectionReason || "Not actionable"}</strong>.
                        This complaint has been reviewed and closed by municipal staff.
                     </p>
                  </div>
               </div>
            )}

            {/* ── Official Lifecycle Progression Stepper ── */}
            <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <div className="border-b border-[#E2E6E4] pb-3 mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#17202A]">
                     Official Lifecycle Stages
                  </h2>
                  <p className="mt-0.5 text-xs text-[#52606D]">
                     Standard municipal handling workflow from intake to resolution
                  </p>
               </div>
               <div className="pt-2">
                  <ComplaintTimeline currentStatus={complaint.status} />
               </div>
            </div>

            {/* ── Timeline Activity Stream (Audit Trail) ── */}
            <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <div className="border-b border-[#E2E6E4] pb-3 mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#17202A]">
                     Timeline Activity Trail
                  </h2>
                  <p className="mt-0.5 text-xs text-[#52606D]">
                     Verified events recorded during the lifecycle of this report
                  </p>
               </div>

               {events.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#CBD2CF] bg-[#F7F7F5] p-6 text-center">
                     <p className="text-xs text-[#87919B]">No timeline activity recorded yet.</p>
                     <p className="mt-1 text-[11px] text-[#52606D]">
                        Events will appear here as department staff review and update this case.
                     </p>
                  </div>
               )}

               {events.length > 0 && (
                  <div className="relative pl-5 space-y-5 border-l-2 border-[#E2E6E4]">
                     {events.map((event, index) => {
                        const actionTitle =
                           ACTION_LABELS[event.action] ??
                           event.action.replaceAll("_", " ");
                        const formattedTime = event.timestamp
                           ? new Date(event.timestamp).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                           })
                           : "—";

                        return (
                           <div key={event._id ?? index} className="relative">
                              {/* Node pin */}
                              <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#173B5E] shadow-xs" />

                              <div className="flex flex-col gap-1">
                                 <div className="flex flex-wrap items-center justify-between gap-1">
                                    <h3 className="text-xs font-bold capitalize text-[#17202A]">
                                       {actionTitle}
                                    </h3>
                                    <span className="text-[11px] font-medium text-[#87919B]">
                                       {formattedTime}
                                    </span>
                                 </div>

                                 {/* Status transition indicator */}
                                 {(event.previousStatus || event.newStatus) && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#52606D]">
                                       {event.previousStatus && (
                                          <span className="capitalize">
                                             {event.previousStatus.replaceAll("_", " ")}
                                          </span>
                                       )}
                                       {event.previousStatus && event.newStatus && <span>→</span>}
                                       {event.newStatus && (
                                          <span className="font-semibold capitalize text-[#173B5E]">
                                             {event.newStatus.replaceAll("_", " ")}
                                          </span>
                                       )}
                                    </div>
                                 )}

                                 {/* Performer info */}
                                 {event.performedBy && (
                                    <p className="text-[11px] text-[#87919B]">
                                       Actor:{" "}
                                       <span className="font-medium text-[#52606D]">
                                          {event.performedBy.fullname ?? "Municipal Staff"}
                                       </span>
                                       {event.performedBy.role && (
                                          <span className="ml-1 text-[10px] uppercase">
                                             ({event.performedBy.role === "dept_staff" ? "Staff" : event.performedBy.role})
                                          </span>
                                       )}
                                    </p>
                                 )}

                                 {/* Remark if provided */}
                                 {event.remark && (
                                    <div className="mt-1 rounded-lg border border-[#E2E6E4] bg-[#F7F7F5] p-2.5 text-xs text-[#17202A]">
                                       <span className="font-semibold text-[#52606D]">Note:</span>{" "}
                                       {event.remark}
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>

            {/* ── Support / Reference Notice ── */}
            <div className="rounded-xl border border-[#CBD2CF] bg-[#F1F3F2] p-4 text-xs text-[#52606D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
               <div>
                  <p className="font-semibold text-[#17202A]">Inquiring about this case?</p>
                  <p className="mt-0.5 text-[11px]">
                     Reference ID <strong className="font-mono">{complaint.complaintId}</strong> when communicating with municipal authorities.
                  </p>
               </div>
               <button
                  onClick={() => navigate(`/citizen/complaints/${id}`)}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-[#CBD2CF] bg-white px-4 py-1.5 text-xs font-semibold text-[#17202A] hover:bg-[#E2E6E4] cursor-pointer shrink-0"
               >
                  View Full Dossier
               </button>
            </div>
         </div>
      </div>
   );
};

export default TrackComplaint;
