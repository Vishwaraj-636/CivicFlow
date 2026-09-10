import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ComplaintCard from "../../../components/complaint/ComplaintCard";
import { getMyComplaints } from "../services/complaint.api";

const CitizenDashboard = () => {
   const [complaints, setComplaints] = useState([]);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      getMyComplaints()
         .then(setComplaints)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, []);

   const stats = {
      total: complaints.length,
      submitted: complaints.filter(c => c.status === "pending" || c.status === "submitted").length,
      inProgress: complaints.filter(c => c.status === "in_progress").length,
      resolved: complaints.filter(c => c.status === "resolved").length,
   };

   return (
      <section className="mx-auto flex max-w-5xl flex-col gap-8 p-6 md:p-10">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <p className="text-sm uppercase tracking-widest text-primary-accent">Citizen Portal</p>
               <h1 className="mt-2 text-3xl font-semibold text-primary-text">Dashboard</h1>
            </div>
            <Link
               to="/citizen/complaints/report"
               className="rounded-lg bg-primary-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 text-center"
            >
               Report Complaint
            </Link>
         </div>

         {loading ? (
            <p className="text-secondary-text">Loading dashboard...</p>
         ) : (
            <>
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">Total</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.total}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">Submitted</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.submitted}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">In Progress</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.inProgress}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">Resolved</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.resolved}</p>
                  </div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-semibold text-primary-text">Recent Complaints</h2>
                     <Link to="/citizen/complaints" className="text-sm text-primary-accent hover:underline">
                        View All
                     </Link>
                  </div>

                  {complaints.length === 0 ? (
                     <div className="rounded-xl border border-dashed border-border p-8 text-center">
                        <p className="text-secondary-text">No complaints submitted yet.</p>
                     </div>
                  ) : (
                     <div className="grid gap-4 md:grid-cols-2">
                        {complaints.slice(0, 4).map((complaint) => (
                           <ComplaintCard
                              key={complaint._id}
                              complaint={complaint}
                              onClick={() => navigate(`/citizen/complaints/${complaint._id}`)}
                           />
                        ))}
                     </div>
                  )}
               </div>
            </>
         )}
      </section>
   );
};

export default CitizenDashboard;
