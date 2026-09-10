import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ComplaintCard from "../../../components/complaint/ComplaintCard";
import { getMyComplaints } from "../services/complaint.api";

const MyComplaints = () => {
   const [complaints, setComplaints] = useState([]);
   const [error, setError] = useState("");
   const navigate = useNavigate();

   useEffect(() => {
      getMyComplaints().then(setComplaints).catch(() => setError("Unable to load complaints."));
   }, []);

   return (
      <section className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-10">
         <div className="flex items-center justify-between gap-4">
            <div><h1 className="text-2xl font-semibold text-primary-text">My complaints</h1><p className="mt-1 text-sm text-secondary-text">Your submitted reports.</p></div>
            <Link to="/citizen/complaints/report" className="rounded-lg bg-primary-accent px-4 py-2 text-sm font-semibold text-background">Report issue</Link>
         </div>
         {error && <p className="text-sm text-danger">{error}</p>}
         {complaints.length === 0 && !error ? <p className="text-secondary-text">No complaints yet.</p> : (
            <div className="grid gap-4 md:grid-cols-2">
               {complaints.map((complaint) => <ComplaintCard key={complaint._id} complaint={complaint} onClick={() => navigate(`/citizen/complaints/${complaint._id}`)} />)}
            </div>
         )}
      </section>
   );
};

export default MyComplaints;
