import { useEffect, useState } from "react";
import { getStaffComplaints } from "../../citizen/services/complaint.api";

const StaffDashboard = () => {
   const [complaints, setComplaints] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      getStaffComplaints()
         .then(setComplaints)
         .catch(() => setError("Unable to load department complaints."))
         .finally(() => setLoading(false));
   }, []);

   return (
      <main className="mx-auto max-w-6xl p-6 md:p-8">
         <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-accent">Department workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-primary-text">Assigned complaints</h1>
            <p className="mt-2 text-sm text-secondary-text">Review reports routed to your department.</p>
         </div>

         {loading && <p className="text-secondary-text">Loading complaints...</p>}
         {error && <p className="text-danger">{error}</p>}
         {!loading && !error && complaints.length === 0 && (
            <p className="rounded-xl border border-border p-6 text-secondary-text">No complaints are assigned to your department.</p>
         )}
         {!loading && !error && complaints.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
               {complaints.map((complaint) => (
                  <article key={complaint._id} className="rounded-xl border border-border bg-surface p-5">
                     <div className="flex items-start justify-between gap-4">
                        <div>
                           <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">{complaint.complaintId}</p>
                           <h2 className="mt-1 text-lg font-semibold text-primary-text">{complaint.title}</h2>
                        </div>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-secondary-text">
                           {complaint.status.replaceAll("_", " ")}
                        </span>
                     </div>
                     <p className="mt-3 text-sm text-secondary-text">{complaint.description}</p>
                     <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                        <div>
                           <dt className="text-xs text-muted-text">Category</dt>
                           <dd className="mt-1 font-medium text-primary-text">{complaint.category}</dd>
                        </div>
                        <div>
                           <dt className="text-xs text-muted-text">Department</dt>
                           <dd className="mt-1 font-medium text-primary-text">{complaint.assignedDepartment?.fullname ?? "Unassigned"}</dd>
                        </div>
                     </dl>
                  </article>
               ))}
            </div>
         )}
      </main>
   );
};

export default StaffDashboard;