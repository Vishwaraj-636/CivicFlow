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
      Promise.all([getComplaintById(id), getComplaintTimeline(id)])
         .then(([item, events]) => {
            setComplaint(item);
            setTimeline(events);
         })
         .catch(() => setError("Complaint not found or you do not have permission to view it."));
   };

   const handleAccept = async () => {
      setIsUpdating(true);
      try {
         await acceptComplaint(id);
         fetchComplaintDetails();
      } catch (err) {
         alert("Failed to accept complaint.");
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
         // Data contains resolutionDescription and resolutionMedia.
         // If there are media files, they should be uploaded first. Since backend expects resolutionDescription...
         // Assuming updateComplaintStatus handles resolutionDescription.
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

   if (error) return <p className="p-8 text-danger">{error}</p>;
   if (!complaint) return <p className="p-8 text-secondary-text">Loading complaint details...</p>;

   const submittedDate = complaint.createdAt
      ? new Date(complaint.createdAt).toLocaleString("en-IN")
      : "—";

   return (
      <section className="mx-auto flex max-w-5xl flex-col gap-5 p-6 md:p-10">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm text-muted-text">{complaint.complaintId}</p>
               <h1 className="mt-1 text-2xl font-semibold text-primary-text">Review Complaint</h1>
               <p className="mt-1 text-lg text-secondary-text">{complaint.title}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
               <ComplaintStatus status={complaint.status} />
               {["assigned", "in_progress"].includes(complaint.status) && (
                  <button
                     onClick={() => setStatusModalOpen(true)}
                     className="text-xs text-primary-accent hover:underline"
                  >
                     Update Status
                  </button>
               )}
            </div>
         </div>

         <div className="mt-2">
            <ComplaintActionPanel
               complaint={complaint}
               onAccept={handleAccept}
               onReject={() => setRejectModalOpen(true)}
               onStartWork={handleStartWork}
               onResolve={() => setResolveModalOpen(true)}
               onClose={handleClose}
               disabled={isUpdating}
            />
         </div>

         <div className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
            <p><span className="text-sm text-muted-text">Complaint ID</span><br /><strong>{complaint.complaintId}</strong></p>
            <p><span className="text-sm text-muted-text">Category</span><br /><strong>{complaint.category}</strong></p>
            <p><span className="text-sm text-muted-text">Priority</span><br /><strong className="capitalize">{complaint.priority}</strong></p>
            <p><span className="text-sm text-muted-text">Submitted</span><br /><strong>{submittedDate}</strong></p>
            <p><span className="text-sm text-muted-text">Current Status</span><br /><strong className="capitalize">{complaint.status.replaceAll("_", " ")}</strong></p>
         </div>

         {complaint.status === "rejected" && complaint.rejectionReason && (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
               <h2 className="text-lg font-semibold text-danger">Rejection Reason</h2>
               <p className="mt-2 text-secondary-text">{complaint.rejectionReason}</p>
            </div>
         )}

         <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-primary-text">Citizen Information</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
               <p><span className="text-sm text-muted-text">Name</span><br /><strong>{complaint.citizenId?.fullname ?? "N/A"}</strong></p>
               <p><span className="text-sm text-muted-text">Contact</span><br />
                  <strong>
                     {complaint.citizenId?.email && <div>{complaint.citizenId.email}</div>}
                     {complaint.citizenId?.phone && <div>{complaint.citizenId.phone}</div>}
                     {(!complaint.citizenId?.email && !complaint.citizenId?.phone) && "N/A"}
                  </strong>
               </p>
            </div>
         </div>

         <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-primary-text">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-secondary-text">{complaint.description}</p>
         </div>

         {complaint.media?.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
               <h2 className="text-lg font-semibold text-primary-text">Media</h2>
               <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {complaint.media.map((item) => item.type.startsWith("video/") ? (
                     <video key={item.fileId} src={item.url} controls className="max-h-72 w-full rounded-lg bg-black" />
                  ) : (
                     <img key={item.fileId} src={item.url} alt={item.metadata?.originalName ?? "Complaint evidence"} className="max-h-72 w-full rounded-lg object-cover" />
                  ))}
               </div>
            </div>
         )}

         <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-primary-text">Location</h2>
            <p className="mt-2 text-sm text-secondary-text">{complaint.address}</p>
            <ComplaintMap complaint={complaint} />
         </div>

         <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-lg font-semibold text-primary-text">Status Timeline</h2>
            <ComplaintTimeline currentStatus={complaint.status} events={timeline} />
         </div>

         <div className="flex flex-wrap gap-3">
            <Link to="/staff/complaints/queue" className="rounded-lg border border-border px-4 py-2 font-semibold text-primary-text hover:bg-surface-elevated">Back to Queue</Link>
         </div>

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
      </section>
   );
};

export default ComplaintDetails;
