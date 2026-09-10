import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssignedComplaints } from "../services/staff.api";

const AssignedComplaints = () => {
   const [complaints, setComplaints] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const navigate = useNavigate();

   useEffect(() => {
      getAssignedComplaints()
         .then(setComplaints)
         .catch(() => setError("Unable to load your assigned complaints."))
         .finally(() => setLoading(false));
   }, []);

   return (
      <main className="mx-auto max-w-7xl p-6 md:p-8">
         <div className="mb-8">
            <h1 className="text-3xl font-semibold text-primary-text">Assigned Complaints</h1>
            <p className="mt-2 text-sm text-secondary-text">Complaints currently assigned to you.</p>
         </div>

         {loading && <p className="text-secondary-text">Loading assigned complaints...</p>}
         {error && <p className="text-danger">{error}</p>}
         {!loading && !error && complaints.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
               <p className="text-secondary-text">No complaints are assigned to you.</p>
            </div>
         )}
         {!loading && !error && complaints.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
               <table className="w-full text-left text-sm text-secondary-text">
                  <thead className="border-b border-border bg-surface-elevated text-xs uppercase text-primary-text">
                     <tr>
                        <th className="px-6 py-4 font-semibold">Complaint ID</th>
                        <th className="px-6 py-4 font-semibold">Title</th>
                        <th className="px-6 py-4 font-semibold">Priority</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Assigned Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     {complaints.map((complaint) => (
                        <tr key={complaint._id} className="border-b border-border last:border-0 hover:bg-surface-bright">
                           <td className="px-6 py-4 font-medium text-primary-text">{complaint.complaintId}</td>
                           <td className="max-w-[240px] truncate px-6 py-4" title={complaint.title}>{complaint.title}</td>
                           <td className="px-6 py-4 capitalize">{complaint.priority}</td>
                           <td className="px-6 py-4 capitalize">{complaint.status.replaceAll("_", " ")}</td>
                           <td className="px-6 py-4">
                              {complaint.assignedAt ? new Date(complaint.assignedAt).toLocaleDateString() : "-"}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button
                                 type="button"
                                 onClick={() => navigate(`/staff/complaints/${complaint._id}`)}
                                 className="rounded border border-border px-3 py-1 text-xs font-medium text-primary-text hover:bg-surface-elevated"
                              >
                                 View
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </main>
   );
};

export default AssignedComplaints;
