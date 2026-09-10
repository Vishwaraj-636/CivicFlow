import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ComplaintStatus from "../../../components/complaint/ComplaintStatus";
import ComplaintMap from "../../../components/maps/ComplaintMap";
import { deleteComplaint, getComplaintById } from "../services/complaint.api";

const ComplaintDetails = () => {
   const { id } = useParams(); const navigate = useNavigate();
   const [complaint, setComplaint] = useState(null); const [error, setError] = useState("");
   useEffect(() => { getComplaintById(id).then(setComplaint).catch(() => setError("Complaint not found.")); }, [id]);
   async function remove() { if (!window.confirm("Delete this complaint?")) return; await deleteComplaint(id); navigate("/citizen/complaints"); }
   if (error) return <p className="p-8 text-danger">{error}</p>;
   if (!complaint) return <p className="p-8 text-secondary-text">Loading complaint...</p>;
   return <section className="mx-auto flex max-w-5xl flex-col gap-5 p-6 md:p-10">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-text">{complaint.complaintId}</p><h1 className="mt-1 text-2xl font-semibold text-primary-text">{complaint.title}</h1></div><ComplaintStatus status={complaint.status} /></div>
      <p className="text-secondary-text">{complaint.description}</p><p className="text-sm text-muted-text">{complaint.address}</p><ComplaintMap complaint={complaint} />
      <div className="flex gap-3"><Link to={`/citizen/complaints/${id}/track`} className="rounded-lg bg-primary-accent px-4 py-2 font-semibold text-background">Track status</Link>{complaint.status === "submitted" && <button onClick={remove} className="rounded-lg border border-danger px-4 py-2 text-danger">Delete</button>}</div>
   </section>;
};

export default ComplaintDetails;
