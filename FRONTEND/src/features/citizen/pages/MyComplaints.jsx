import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ComplaintCard from "../../../components/complaint/ComplaintCard";
import { getMyComplaints } from "../services/complaint.api";

const MyComplaints = () => {
   const [complaints, setComplaints] = useState([]);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      getMyComplaints()
         .then(setComplaints)
         .catch(() => setError("Unable to load complaints."))
         .finally(() => setLoading(false));
   }, []);

   return (
      <section className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-10">
         <div className="flex items-center justify-between gap-4">
            <div><h1 className="text-2xl font-semibold text-primary-text">My complaints</h1><p className="mt-1 text-sm text-secondary-text">Your submitted reports.</p></div>
            <Link to="/citizen/complaints/report" className="rounded-lg bg-primary-accent px-4 py-2 text-sm font-semibold text-background">Report a Complaint</Link>
         </div>
         {error && <p className="text-sm text-danger">{error}</p>}
         {loading && <p className="text-secondary-text">Loading complaints...</p>}
         {!loading && !error && complaints.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
               <p className="text-secondary-text">No complaints submitted yet.</p>
               <Link to="/citizen/complaints/report" className="mt-4 inline-flex rounded-lg bg-primary-accent px-4 py-2 text-sm font-semibold text-background">
                  Report a Complaint
               </Link>
            </div>
         )}
         {!loading && !error && complaints.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
               {complaints.map((complaint) => <ComplaintCard key={complaint._id} complaint={complaint} onClick={() => navigate(`/citizen/complaints/${complaint._id}`)} />)}
            </div>
         )}
      </section>
   );
};

export default MyComplaints;
