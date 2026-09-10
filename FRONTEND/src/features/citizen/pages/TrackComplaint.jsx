import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ComplaintTimeline from "../../../components/complaint/ComplaintTimeline";
import { getComplaintById, getComplaintTimeline } from "../services/complaint.api";

const TrackComplaint = () => {
   const { id } = useParams(); const [complaint, setComplaint] = useState(null); const [events, setEvents] = useState([]); const [error, setError] = useState("");
   useEffect(() => { Promise.all([getComplaintById(id), getComplaintTimeline(id)]).then(([item, timeline]) => { setComplaint(item); setEvents(timeline); }).catch(() => setError("Unable to load tracking details.")); }, [id]);
   if (error) return <p className="p-8 text-danger">{error}</p>;
   if (!complaint) return <p className="p-8 text-secondary-text">Loading timeline...</p>;
   return (
      <section className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-10">
         <div>
            <p className="text-sm text-muted-text">{complaint.complaintId}</p>
            <h1 className="text-2xl font-semibold text-primary-text">Current Status</h1>
            <p className="mt-1 text-secondary-text">{complaint.title}</p>
         </div>
         <div className="rounded-2xl border border-border bg-surface p-5">
            <ComplaintTimeline currentStatus={complaint.status} />
         </div>
         <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-primary-text">Timeline activity</h2>
            {events.length === 0 && <p className="mt-2 text-sm text-secondary-text">No timeline activity yet.</p>}
            {events.map((event) => <p key={event._id} className="mt-2 text-sm text-secondary-text">{event.action.replaceAll("_", " ")} · {new Date(event.timestamp).toLocaleString()}</p>)}
         </div>
      </section>
   );
};

export default TrackComplaint;
