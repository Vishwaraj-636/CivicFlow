import { useNavigate } from "react-router-dom";
import ComplaintQueueFilters from "../components/ComplaintQueueFilters";
import StaffComplaintCard from "../components/StaffComplaintCard";
import useStaffComplaints from "../hook/useStaffComplaints";

const ComplaintQueue = () => {
   const navigate = useNavigate();
   const { complaints, filters, setFilters, loading, error } = useStaffComplaints();

   return (
      <main className="mx-auto max-w-7xl p-6 md:p-8">
         <div className="mb-8">
            <h1 className="text-3xl font-semibold text-primary-text">Complaint Queue</h1>
            <p className="mt-2 text-sm text-secondary-text">Manage and triage complaints assigned to your department.</p>
         </div>

         <ComplaintQueueFilters value={filters} onChange={setFilters} />

         {loading && <p className="text-secondary-text">Loading queue...</p>}
         {error && <p className="text-danger">{error}</p>}

         {!loading && !error && complaints.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
               <p className="text-secondary-text">No complaints found matching the filters.</p>
            </div>
         )}

         {!loading && !error && complaints.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {complaints.map((complaint) => (
                  <StaffComplaintCard
                     key={complaint._id}
                     complaint={complaint}
                     onView={(c) => navigate(`/staff/complaints/${c._id}`)}
                  />
               ))}
            </div>
         )}
      </main>
   );
};

export default ComplaintQueue;
