import { Link, useNavigate } from "react-router-dom";
import ComplaintCard from "../../../components/complaint/ComplaintCard";
import useStaffComplaints from "../hook/useStaffComplaints";
import useStaffDashboard from "../hook/useStaffDashboard";

const StaffDashboard = () => {
   const navigate = useNavigate();
   const { complaints, loading, error } = useStaffComplaints();
   const stats = useStaffDashboard(complaints);

   const departmentName = complaints.length > 0
      ? complaints[0].assignedDepartment?.fullname ?? "Department"
      : "Department";

   return (
      <main className="mx-auto max-w-6xl p-6 md:p-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-primary-accent">{departmentName} Workspace</p>
               <h1 className="mt-2 text-3xl font-semibold text-primary-text">Staff Dashboard</h1>
               <p className="mt-2 text-sm text-secondary-text">Overview of complaints routed to {departmentName}.</p>
            </div>
            <Link
               to="/staff/complaints/queue"
               className="rounded-lg bg-primary-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 text-center"
            >
               View Queue
            </Link>
         </div>

         {loading && <p className="text-secondary-text">Loading dashboard...</p>}
         {error && <p className="text-danger">{error}</p>}

         {!loading && !error && (
            <div className="flex flex-col gap-8">
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">Total Department Complaints</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.total}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">Pending</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.pending}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-5">
                     <p className="text-sm text-secondary-text">Assigned</p>
                     <p className="mt-2 text-3xl font-semibold text-primary-text">{stats.assigned}</p>
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
                     <Link to="/staff/complaints/queue" className="text-sm text-primary-accent hover:underline">
                        View All
                     </Link>
                  </div>

                  {complaints.length === 0 ? (
                     <div className="rounded-xl border border-dashed border-border p-8 text-center">
                        <p className="text-secondary-text">No complaints are assigned to your department.</p>
                     </div>
                  ) : (
                     <div className="grid gap-4 md:grid-cols-2">
                        {complaints.slice(0, 4).map((complaint) => (
                           <ComplaintCard
                              key={complaint._id}
                              complaint={complaint}
                              onClick={() => navigate(`/staff/complaints/${complaint._id}`)}
                           />
                        ))}
                     </div>
                  )}
               </div>
            </div>
         )}
      </main>
   );
};

export default StaffDashboard;