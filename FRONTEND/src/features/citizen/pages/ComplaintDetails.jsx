import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ComplaintStatus from "../../../components/complaint/ComplaintStatus";
import ComplaintTimeline from "../../../components/complaint/ComplaintTimeline";
import GroupedReportsSummary from "../../../components/complaint/GroupedReportsSummary";
import ComplaintMap from "../../../components/maps/ComplaintMap";
import { deleteComplaint, getComplaintById } from "../services/complaint.api";

const ComplaintDetails = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [complaint, setComplaint] = useState(null);
   const [error, setError] = useState("");

   useEffect(() => {
      getComplaintById(id).then(setComplaint).catch(() => setError("Complaint not found."));
   }, [id]);

   async function remove() {
      if (!window.confirm("Delete this complaint?")) return;
      await deleteComplaint(id);
      navigate("/citizen/complaints");
   }

   if (error) return <p className="p-8 text-danger">{error}</p>;
   if (!complaint) return <p className="p-8 text-secondary-text">Loading complaint...</p>;

   const relatedReports = complaint.relatedReports ?? complaint.groupedReports?.reports ?? [];
   const relatedCount = complaint.groupedReports?.count ?? relatedReports.length;
   const submittedDate = complaint.createdAt
      ? new Date(complaint.createdAt).toLocaleString("en-IN")
      : "—";

   return (
      <section className="mx-auto flex max-w-5xl flex-col gap-5 p-6 md:p-10">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm text-muted-text">{complaint.complaintId}</p>
               <h1 className="mt-1 text-2xl font-semibold text-primary-text">Complaint Details</h1>
               <p className="mt-1 text-lg text-secondary-text">{complaint.title}</p>
            </div>
            <ComplaintStatus status={complaint.status} />
         </div>

         {complaint.status === "submitted" && (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-success">
               <h2 className="font-semibold">Complaint Submitted</h2>
               <p className="mt-1 text-sm">Your report has been received and is ready for department review.</p>
            </div>
         )}

         <div className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
            <p><span className="text-sm text-muted-text">Complaint ID</span><br /><strong>{complaint.complaintId}</strong></p>
            <p><span className="text-sm text-muted-text">Category</span><br /><strong>{complaint.category}</strong></p>
            <p><span className="text-sm text-muted-text">Department</span><br /><strong>{complaint.assignedDepartment?.fullname ?? "Pending assignment"}</strong></p>
            <p><span className="text-sm text-muted-text">Priority</span><br /><strong className="capitalize">{complaint.priority}</strong></p>
            <p><span className="text-sm text-muted-text">Submitted</span><br /><strong>{submittedDate}</strong></p>
            <p><span className="text-sm text-muted-text">Current Status</span><br /><strong className="capitalize">{complaint.status.replaceAll("_", " ")}</strong></p>
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
            <ComplaintTimeline currentStatus={complaint.status} />
         </div>

         <GroupedReportsSummary count={relatedCount} reports={relatedReports} />

         <div className="flex flex-wrap gap-3">
            <Link to={`/citizen/complaints/${id}/track`} className="rounded-lg bg-primary-accent px-4 py-2 font-semibold text-background">Track status</Link>
            {complaint.status === "submitted" && <button onClick={remove} className="rounded-lg border border-danger px-4 py-2 text-danger">Delete</button>}
         </div>
      </section>
   );
};

export default ComplaintDetails;
