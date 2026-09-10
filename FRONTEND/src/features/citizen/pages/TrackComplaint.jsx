import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ComplaintTimeline from "../../../components/complaint/ComplaintTimeline";
import { getComplaintById, getComplaintTimeline } from "../services/complaint.api";

const TrackComplaint = () => {
   const { id } = useParams(); const [complaint, setComplaint] = useState(null); const [events, setEvents] = useState([]); const [error, setError] = useState("");
   useEffect(() => { Promise.all([getComplaintById(id), getComplaintTimeline(id)]).then(([item, timeline]) => { setComplaint(item); setEvents(timeline); }).catch(() => setError("Unable to load tracking details.")); }, [id]);
   if (error) return <p className="p-8 text-danger">{error}</p>;
   if (!complaint) return <p className="p-8 text-secondary-text">Loading timeline...</p>;
   return <section className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-10"><h1 className="text-2xl font-semibold text-primary-text">Track complaint</h1><p className="text-secondary-text">{complaint.title}</p><ComplaintTimeline currentStatus={complaint.status} /><div className="border-t border-border pt-4"><h2 className="font-semibold text-primary-text">Activity</h2>{events.map((event) => <p key={event._id} className="mt-2 text-sm text-secondary-text">{event.action} · {new Date(event.timestamp).toLocaleString()}</p>)}</div></section>;
};

export default TrackComplaint;
