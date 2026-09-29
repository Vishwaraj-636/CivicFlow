import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ComplaintStatus from "../../../components/complaint/ComplaintStatus";
import ComplaintTimeline from "../../../components/complaint/ComplaintTimeline";
import ComplaintMap from "../../../components/maps/ComplaintMap";
import {
   acceptComplaint,
   getComplaintById,
   getComplaintTimeline,
   rejectComplaint,
   resolveComplaint,
   updateComplaintStatus,
} from "../services/staff.api";
import ComplaintActionPanel from "../components/ComplaintActionPanel";
import StatusUpdateModal from "../components/StatusUpdateModal";
import RejectComplaintModal from "../components/RejectComplaintModal";
import ResolveComplaintModal from "../components/ResolveComplaintModal";
import { IncidentIntelligencePanel } from "../../incident";

const ComplaintDetails = () => {
   const { id } = useParams();
   const [complaint, setComplaint] = useState(null);
   const [timeline, setTimeline] = useState([]);
   const [error, setError] = useState("");

   const [isStatusModalOpen, setStatusModalOpen] = useState(false);
   const [isRejectModalOpen, setRejectModalOpen] = useState(false);
   const [isResolveModalOpen, setResolveModalOpen] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);

   useEffect(() => {
      fetchComplaintDetails();
   }, [id]);

   const fetchComplaintDetails = () => {
      return Promise.all([getComplaintById(id), getComplaintTimeline(id)])
         .then(([item, events]) => {
            setComplaint(item);
            setTimeline(events);
            return item;
         })
         .catch((fetchError) => {
            setError("Complaint not found or you do not have permission to view it.");
            throw fetchError;
         });
   };

   const handleAccept = async () => {
      setIsUpdating(true);
      try {
         await acceptComplaint(id);
         await fetchComplaintDetails();
      } catch (err) {
         try {
            const currentComplaint = await getComplaintById(id);
            if (currentComplaint.status === "in_review") {
               setComplaint(currentComplaint);
               return;
            }
         } catch {
         }
         alert(err.response?.data?.error ?? "Failed to accept complaint.");
      } finally {
         setIsUpdating(false);
      }
   };

   const handleStartWork = async () => {
      setIsUpdating(true);
      try {
         await updateComplaintStatus(id, "in_progress");
         fetchComplaintDetails();
      } catch (err) {
         alert("Failed to start work.");
      } finally {
         setIsUpdating(false);
      }
   };

   const handleRejectSubmit = async (reason) => {
      setIsUpdating(true);
      try {
         await rejectComplaint(id, reason);
         setRejectModalOpen(false);
         fetchComplaintDetails();
      } catch (err) {
         alert("Failed to reject complaint.");
      } finally {
         setIsUpdating(false);
      }
   };

   const handleResolveSubmit = async (data) => {
      setIsUpdating(true);
      try {
         await resolveComplaint(id, data.resolutionDescription, data.resolutionMedia);
         setResolveModalOpen(false);
         fetchComplaintDetails();
      } catch (err) {
         alert("Failed to resolve complaint.");
      } finally {
         setIsUpdating(false);
      }
   };

   const handleClose = async () => {
      setIsUpdating(true);
      try {
         await updateComplaintStatus(id, "closed", { remark: "Complaint closed after resolution" });
         fetchComplaintDetails();
      } catch (err) {
         alert("Failed to close complaint.");
      } finally {
         setIsUpdating(false);
      }
   };

   const handleStatusUpdateSubmit = async (data) => {
      setIsUpdating(true);
      try {
         await updateComplaintStatus(id, data.newStatus, { remark: data.remark });
         setStatusModalOpen(false);
         fetchComplaintDetails();
      } catch (err) {
         alert("Failed to update status.");
      } finally {
         setIsUpdating(false);
      }
   };

   if (error) {
      return (
         <div className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] p-6 md:p-10 font-['Public_Sans',sans-serif]">
            <div className="mx-auto max-w-4xl rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-6 text-sm text-[#A44A4A]">
               <h2 className="font-semibold text-base mb-1">Unable to Load Complaint</h2>
               <p>{error}</p>
               <div className="mt-4">
                  <Link to="/staff/complaints/queue" className="inline-flex min-h-[44px] items-center rounded-lg bg-[#173B5E] px-4 py-2 text-xs font-medium text-white">
                     ← Return to Queue
                  </Link>
               </div>
            </div>
         </div>
      );
   }

   if (!complaint) {
      return (
         <div className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] p-6 md:p-10 font-['Public_Sans',sans-serif]">
            <div className="mx-auto max-w-4xl rounded-xl border border-[#E2E6E4] bg-white p-8 space-y-4">
               <div className="h-6 w-48 rounded bg-[#F1F3F2]" />
               <div className="h-8 w-3/4 rounded bg-[#F1F3F2]" />
               <div className="h-40 w-full rounded bg-[#F1F3F2]" />
            </div>
         </div>
      );
   }

   const submittedDate = complaint.createdAt
      ? new Date(complaint.createdAt).toLocaleString("en-IN", {
         day: "numeric",
         month: "short",
         year: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      })
      : "—";

   const displayId = complaint.complaintId || `#${String(complaint._id).slice(-6).toUpperCase()}`;

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased pb-16"
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
         {/* Top Institutional Context Header */}
         <div className="border-b border-[#E2E6E4] bg-white">
            <div className="mx-auto max-w-5xl px-4 py-3 sm:py-4 flex items-center justify-between">
               <Link
                  to="/staff/complaints/queue"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#E2E6E4] bg-white px-3.5 py-2 text-xs font-medium text-[#52606D] transition hover:border-[#CBD2CF] hover:text-[#17202A] cursor-pointer"
               >
                  <span aria-hidden="true">←</span>
                  <span>Back to Queue</span>
               </Link>
               <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#39756B]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">
                     Department Staff Workspace
                  </span>
               </div>
            </div>
         </div>

         <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8 space-y-6">
            {/* Triage Dossier Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[#E2E6E4] pb-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                     <span className="font-mono text-xs font-semibold bg-[#EEF4FA] text-[#24527A] px-2 py-0.5 rounded border border-[#D2E3F3]">
                        {displayId}
                     </span>
                     <span className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">
                        {complaint.category}
                     </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                     {complaint.title}
                  </h1>
                  <p className="text-xs text-[#87919B]">
                     Submitted on {submittedDate}
                  </p>
               </div>

               <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  <ComplaintStatus status={complaint.status} size="lg" />
                  {["assigned", "in_progress"].includes(complaint.status) && (
                     <button
                        type="button"
                        onClick={() => setStatusModalOpen(true)}
                        className="inline-flex min-h-[44px] items-center text-xs font-semibold text-[#173B5E] hover:text-[#122E4A] hover:underline cursor-pointer"
                     >
                        Update Status →
                     </button>
                  )}
               </div>
            </div>

            {/* Operational Action Deck */}
            <section aria-label="Triage Actions" className="rounded-xl border border-[#E2E6E4] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
               <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">
                     Operational Actions
                  </h2>
                  <span className="text-xs text-[#87919B]">
                     {isUpdating ? "Processing update..." : "Select appropriate triage decision"}
                  </span>
               </div>
               <ComplaintActionPanel
                  complaint={complaint}
                  onAccept={handleAccept}
                  onReject={() => setRejectModalOpen(true)}
                  onStartWork={handleStartWork}
                  onResolve={() => setResolveModalOpen(true)}
                  onClose={handleClose}
                  disabled={isUpdating}
               />
            </section>

            {/* Rejection Alert Banner (if applicable) */}
            {complaint.status === "rejected" && complaint.rejectionReason && (
               <div className="rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-5 space-y-1">
                  <h2 className="text-sm font-semibold text-[#A44A4A]">Rejection Notice</h2>
                  <p className="text-xs text-[#52606D]">Reason provided: <strong className="text-[#17202A]">{complaint.rejectionReason}</strong></p>
               </div>
            )}

            {/* Incident Overview Card */}
            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
               <h2 className="text-base font-semibold tracking-tight text-[#17202A]">
                  Incident Overview
               </h2>
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-[#E2E6E4] pt-4">
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Complaint ID</p>
                     <p className="mt-1 font-mono text-sm font-semibold text-[#17202A]">{displayId}</p>
                  </div>
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Category</p>
                     <p className="mt-1 text-sm font-medium text-[#17202A]">{complaint.category}</p>
                  </div>
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Priority</p>
                     <p className="mt-1 text-sm font-semibold capitalize text-[#17202A]">{complaint.priority}</p>
                  </div>
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Lifecycle Stage</p>
                     <p className="mt-1 text-sm font-medium capitalize text-[#17202A]">{complaint.status?.replaceAll("_", " ")}</p>
                  </div>
               </div>
            </section>

            {/* HISC Incident Intelligence */}
            <IncidentIntelligencePanel complaintId={id} />

            {/* Citizen Information Card */}
            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-3">
               <h2 className="text-base font-semibold tracking-tight text-[#17202A]">
                  Citizen Reporting Party
               </h2>
               <div className="grid gap-4 sm:grid-cols-2 border-t border-[#E2E6E4] pt-4">
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Full Name</p>
                     <p className="mt-1 text-sm font-medium text-[#17202A]">{complaint.citizenId?.fullname ?? "Anonymous / Unspecified"}</p>
                  </div>
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Contact Information</p>
                     <div className="mt-1 text-sm text-[#17202A] space-y-0.5">
                        {complaint.citizenId?.email && <p>{complaint.citizenId.email}</p>}
                        {complaint.citizenId?.phone && <p>{complaint.citizenId.phone}</p>}
                        {(!complaint.citizenId?.email && !complaint.citizenId?.phone) && <p className="text-[#87919B]">No contact details on file</p>}
                     </div>
                  </div>
               </div>
            </section>

            {/* Incident Statement / Description Card */}
            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-3">
               <h2 className="text-base font-semibold tracking-tight text-[#17202A]">
                  Incident Description
               </h2>
               <div className="border-t border-[#E2E6E4] pt-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#52606D]">
                     {complaint.description}
                  </p>
               </div>
            </section>

            {/* Supporting Photographic & Video Evidence */}
            {complaint.media?.length > 0 && (
               <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-base font-semibold tracking-tight text-[#17202A]">
                        Evidence Media ({complaint.media.length})
                     </h2>
                     <span className="text-xs text-[#87919B]">Citizen uploaded files</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 border-t border-[#E2E6E4] pt-4">
                     {complaint.media.map((item) => item.type.startsWith("video/") ? (
                        <div key={item.fileId} className="rounded-lg overflow-hidden border border-[#CBD2CF] bg-black">
                           <video src={item.url} controls className="max-h-72 w-full" />
                        </div>
                     ) : (
                        <div key={item.fileId} className="rounded-lg overflow-hidden border border-[#CBD2CF] bg-[#F1F3F2]">
                           <img
                              src={item.url}
                              alt={item.metadata?.originalName ?? "Complaint evidence"}
                              className="max-h-72 w-full object-cover"
                           />
                        </div>
                     ))}
                  </div>
               </section>
            )}

            {/* Geospatial Verification & Map */}
            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-[#17202A]">
                     Geospatial Location & Routing
                  </h2>
                  <span className="text-xs text-[#87919B]">Geospatial coordinates</span>
               </div>
               <div className="border-t border-[#E2E6E4] pt-4 space-y-3">
                  <p className="text-sm font-medium text-[#17202A]">{complaint.address}</p>
                  <div className="rounded-lg overflow-hidden border border-[#E2E6E4]">
                     <ComplaintMap complaint={complaint} />
                  </div>
               </div>
            </section>

            {/* Lifecycle Audit Timeline */}
            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-[#17202A]">
                     Lifecycle Audit Trail
                  </h2>
                  <span className="text-xs text-[#87919B]">Official municipal log</span>
               </div>
               <div className="border-t border-[#E2E6E4] pt-4">
                  <ComplaintTimeline currentStatus={complaint.status} events={timeline} />
               </div>
            </section>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
               <Link
                  to="/staff/complaints/queue"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#CBD2CF] bg-white px-4 py-2 text-xs font-medium text-[#17202A] hover:bg-[#F1F3F2] transition cursor-pointer"
               >
                  ← Back to Queue
               </Link>
            </div>
         </main>

         {/* Modals */}
         <StatusUpdateModal
            isOpen={isStatusModalOpen}
            currentStatus={complaint.status}
            onClose={() => setStatusModalOpen(false)}
            onSubmit={handleStatusUpdateSubmit}
            loading={isUpdating}
         />

         <RejectComplaintModal
            isOpen={isRejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            onSubmit={handleRejectSubmit}
            loading={isUpdating}
         />

         <ResolveComplaintModal
            isOpen={isResolveModalOpen}
            onClose={() => setResolveModalOpen(false)}
            onSubmit={handleResolveSubmit}
            loading={isUpdating}
         />
      </div>
   );
};

export default ComplaintDetails;