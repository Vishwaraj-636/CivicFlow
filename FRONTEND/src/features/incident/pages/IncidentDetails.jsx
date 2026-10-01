import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
   getDepartments,
   getIncident,
   getIncidentMessages,
   getIncidentSimilarity,
   requestIncidentHandoff,
   updateIncidentStatus,
} from "../services/incident.api";
import { useIncidentSocket } from "../hooks/useIncidentSocket";
import { queryIncidentCopilot } from "../../ai/services/ai.api";
import ComplaintMap from "../../../components/maps/ComplaintMap";

const nextStatuses = {
   open: "in_progress",
   in_progress: "resolved",
   resolved: "closed",
};

const formatStatus = (status = "") => status.replaceAll("_", " ");

const IncidentDetails = () => {
   const { id } = useParams();
   const currentUser = useSelector((state) => state.auth.user);
   const [incident, setIncident] = useState(null);
   const [departments, setDepartments] = useState([]);
   const [similarity, setSimilarity] = useState(null);
   const { connected, messages, setMessages, sendMessage } = useIncidentSocket(id);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [updating, setUpdating] = useState(false);
   const [messageDraft, setMessageDraft] = useState("");
   const [aiQuery, setAiQuery] = useState("");
   const [aiResponse, setAiResponse] = useState(null);
   const [aiLoading, setAiLoading] = useState(false);
   const [handoffDepartment, setHandoffDepartment] = useState("");
   const [handoffNote, setHandoffNote] = useState("");
   const [handoffLoading, setHandoffLoading] = useState(false);

   useEffect(() => {
      let active = true;
      Promise.all([
         getIncident(id),
         getIncidentSimilarity(id),
         getIncidentMessages(id),
         getDepartments(),
      ]).then(([incidentData, similarityData, messageData, departmentData]) => {
         if (!active) return;
         setIncident(incidentData);
         setSimilarity(similarityData);
         setMessages(Array.isArray(messageData) ? messageData : []);
         setDepartments(Array.isArray(departmentData) ? departmentData : []);
      }).catch(() => {
         if (active) setError("Unable to load this incident.");
      }).finally(() => {
         if (active) setLoading(false);
      });
      return () => { active = false; };
   }, [id]);

   const handleStatusUpdate = async () => {
      const status = nextStatuses[incident?.status];
      if (!status) return;
      setUpdating(true);
      try {
         const updatedIncident = await updateIncidentStatus(id, status);
         setIncident(updatedIncident);
         const updatedMessages = await getIncidentMessages(id);
         setMessages(Array.isArray(updatedMessages) ? updatedMessages : []);
      } catch {
         setError("Unable to update the incident status.");
      } finally {
         setUpdating(false);
      }
   };

   const handleMessageSubmit = async (event) => {
      event.preventDefault();
      if (!messageDraft.trim()) return;
      try {
         const message = await sendMessage(messageDraft.trim());
         setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
         setMessageDraft("");
      } catch {
         setError("Unable to send the coordination message.");
      }
   };

   const handleAIQuery = async (event) => {
      event.preventDefault();
      if (!aiQuery.trim()) return;
      setAiLoading(true);
      try {
         setAiResponse(await queryIncidentCopilot(aiQuery.trim(), id));
      } catch {
         setAiResponse({ answer: "The copilot is unavailable right now.", sources: [] });
      } finally {
         setAiLoading(false);
      }
   };

   const handleHandoffSubmit = async (event) => {
      event.preventDefault();
      if (!handoffDepartment || !handoffNote.trim()) return;
      setHandoffLoading(true);
      try {
         await requestIncidentHandoff(id, handoffDepartment, handoffNote.trim());
         setHandoffDepartment("");
         setHandoffNote("");
         setMessages(await getIncidentMessages(id));
      } catch {
         setError("Unable to request department assistance.");
      } finally {
         setHandoffLoading(false);
      }
   };

   const primaryComplaint = incident?.complaintIds?.find((complaint) => String(complaint._id) === String(incident.primaryComplaint)) ?? incident?.complaintIds?.[0];
   const groupedComplaints = incident?.complaintIds ?? [];
   const confidence = Math.round((incident?.similarityConfidence ?? 0) * 100);
   const classification = similarity?.classification ?? "related";
   const classificationLabel = classification === "duplicate" ? "Likely duplicate" : classification === "related" ? "Related incident" : "Independent report";
   const timelineMessages = messages.filter((message) => ["system", "status_update", "handoff"].includes(message.messageType));

   if (loading) return <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-[#52606D]">Loading incident...</main>;
   if (error && !incident) return <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-[#A44A4A]">{error}</main>;
   if (!incident) return <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-[#52606D]">Incident not found.</main>;

   return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#F7F7F5] text-[#17202A]">
         <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            <Link to="/staff" className="text-sm font-medium text-[#173B5E] hover:underline">← Staff dashboard</Link>
            {error && <p className="rounded-lg border border-[#F3D0D0] bg-[#FBF0F0] p-3 text-sm text-[#A44A4A]">{error}</p>}

            <header className="flex flex-col gap-4 border-b border-[#E2E6E4] pb-6 sm:flex-row sm:items-start sm:justify-between">
               <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#39756B]">INCIDENT #{incident.clusterId}</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{primaryComplaint?.title ?? "Coordinated civic incident"}</h1>
                  <p className="mt-2 text-sm text-[#52606D]">{incident.complaintCount} reports appear connected around {incident.category}.</p>
               </div>
               <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#EEF4FA] px-3 py-1 text-xs font-semibold capitalize text-[#24527A]">{formatStatus(incident.status)}</span>
                  {nextStatuses[incident.status] && <button type="button" onClick={handleStatusUpdate} disabled={updating} className="rounded-lg bg-[#173B5E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{updating ? "Updating..." : `Mark ${formatStatus(nextStatuses[incident.status])}`}</button>}
               </div>
            </header>

            <section className="rounded-2xl border border-[#D7E6E1] bg-[#F3F8F6] p-5 shadow-sm sm:p-6">
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-[#39756B]">What is happening?</p><h2 className="mt-1 text-xl font-bold text-[#17202A]">{classificationLabel} <span className="text-[#39756B]">· {confidence}% confidence</span></h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#52606D]">{similarity?.explanation ?? "CivicFlow grouped these reports for coordinated review."}</p></div>
                  <div className="grid grid-cols-2 gap-2 text-center sm:min-w-56"><Metric label="Reports" value={incident.complaintCount} /><Metric label="Departments" value={incident.departmentIds?.length ?? 0} /></div>
               </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
               <section className="space-y-6">
                  <Panel title="Grouped complaints">
                     {groupedComplaints.length === 0 ? <p className="rounded-lg border border-dashed border-[#CBD2CF] p-4 text-sm text-[#87919B]">The incident is reporting {incident.complaintCount} reports, but their complaint details are still synchronizing.</p> : <div className="divide-y divide-[#E2E6E4]">
                        {groupedComplaints.map((complaint) => (
                           <Link key={complaint._id} to={`/staff/complaints/${complaint._id}`} className="block py-3 first:pt-0 last:pb-0 hover:text-[#173B5E]">
                              <div className="flex items-start justify-between gap-4">
                                 <div><p className="font-medium">{complaint.title ?? "Complaint report"}</p><p className="mt-1 text-xs capitalize text-[#52606D]">{complaint.category ?? "Category pending"} · {complaint.status?.replaceAll("_", " ") ?? "status pending"}</p></div>
                                 <span className="font-mono text-xs text-[#87919B]">{complaint.complaintId}</span>
                              </div>
                           </Link>
                        ))}
                     </div>}
                  </Panel>

                  <Panel title="Why CivicFlow grouped these reports">
                     <div className="mb-4 flex items-end justify-between"><div><p className="text-4xl font-bold text-[#39756B]">{confidence}%</p><p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">{classificationLabel}</p></div><span className="rounded-full bg-[#ECF5F0] px-3 py-1 text-xs font-bold text-[#28704F]">{confidence >= 80 ? "High confidence" : confidence >= 60 ? "Moderate confidence" : "Review needed"}</span></div>
                     <div className="space-y-3">{(similarity?.signals ?? []).map((signal) => <div key={signal.key}><div className="mb-1 flex justify-between gap-4 text-xs font-semibold text-[#52606D]"><span>{signal.label}</span><span>{signal.score}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E2E6E4]"><div className="h-full rounded-full bg-[#39756B]" style={{ width: `${signal.score}%` }} /></div><p className="mt-1 text-xs text-[#87919B]">{signal.meaning}</p></div>)}</div>
                     <p className="mt-5 rounded-lg border border-[#D7E6E1] bg-[#F8FBFA] p-3 text-sm leading-6 text-[#52606D]">{similarity?.explanation ?? "Location, category, description, similar issue, and reporting time are combined to calculate this grouping."}</p>
                     <details className="mt-4 text-xs text-[#52606D]"><summary className="cursor-pointer font-semibold text-[#173B5E]">View HISC calculation</summary><p className="mt-2 leading-5">{similarity?.algorithm ?? "HISC v1"} combines category, geographic, lexical, semantic, and temporal signals. This is a decision-support signal, not proof that every report is identical.</p></details>
                  </Panel>

                  <Panel title="Recommended action">
                     <p className="text-sm leading-6 text-[#52606D]">{similarity?.recommendedAction ?? "Review the grouped reports and coordinate the assigned departments before closing the incident."}</p>
                     <div className="mt-4 flex flex-wrap gap-2">{(incident.departmentIds ?? []).map((department) => <span key={department._id} className="rounded-full bg-[#EEF4FA] px-3 py-1 text-xs font-semibold text-[#24527A]">{department.fullname}</span>)}</div>
                  </Panel>

                  {primaryComplaint?.location ? <Panel title="Where are these reports?"><p className="mb-3 text-sm text-[#52606D]">{incident.complaintCount} reports within approximately {Math.round(incident.affectedRadius ?? 0)} m of the strongest match.</p><ComplaintMap complaint={primaryComplaint} relatedComplaints={groupedComplaints.filter((complaint) => String(complaint._id) !== String(primaryComplaint._id))} /></Panel> : <Panel title="Where are these reports?"><p className="text-sm text-[#87919B]">Location data is still synchronizing for this incident. The HISC geographic signal remains available in the explanation above.</p></Panel>}
               </section>

               <aside className="space-y-6">
                  <Panel title="Incident timeline">
                     {timelineMessages.length === 0 ? <p className="text-sm text-[#87919B]">No system events recorded yet.</p> : <div className="space-y-4">{timelineMessages.map((message) => <div key={message._id} className="relative border-l-2 border-[#D7E6E1] pl-4"><span className="absolute -left-1.25 top-1 h-2 w-2 rounded-full bg-[#39756B]" /><p className="text-sm font-medium capitalize text-[#17202A]">{message.messageType?.replaceAll("_", " ")}</p><p className="mt-1 text-sm leading-5 text-[#52606D]">{message.message}</p><p className="mt-1 text-[11px] text-[#87919B]">{message.createdAt ? new Date(message.createdAt).toLocaleString("en-IN") : "Recently"}</p></div>)}</div>}
                  </Panel>

                  <Panel title="Departments involved">
                     <div className="space-y-2">{(incident.departmentIds ?? []).length === 0 ? <p className="text-sm text-[#87919B]">Department assignment is pending.</p> : incident.departmentIds.map((department) => <div key={department._id} className="flex items-center justify-between rounded-lg border border-[#E2E6E4] p-3"><span className="text-sm font-semibold text-[#17202A]">{department.fullname}</span><span className="font-mono text-xs text-[#87919B]">{department.code}</span></div>)}</div>
                  </Panel>

                  {currentUser?.role === "dept_staff" && (
                     <Panel title="Request department handoff">
                        <form onSubmit={handleHandoffSubmit} className="space-y-3">
                           <select value={handoffDepartment} onChange={(event) => setHandoffDepartment(event.target.value)} className="w-full rounded-lg border border-[#CBD2CF] px-3 py-2 text-sm outline-none focus:border-[#39756B]">
                              <option value="">Choose a department</option>
                              {departments.filter((department) => String(department._id) !== String(currentUser.departmentId)).map((department) => <option key={department._id} value={department._id}>{department.fullname}</option>)}
                           </select>
                           <textarea value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} rows="3" placeholder="Explain why assistance is needed" className="w-full rounded-lg border border-[#CBD2CF] px-3 py-2 text-sm outline-none focus:border-[#39756B]" />
                           <button type="submit" disabled={handoffLoading || !handoffDepartment || !handoffNote.trim()} className="rounded-lg bg-[#173B5E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{handoffLoading ? "Requesting..." : "Request handoff"}</button>
                        </form>
                     </Panel>
                  )}

                  <Panel title="Incident coordination">
                     <div className="mb-3 flex items-center justify-between"><p className="text-xs text-[#87919B]">{connected ? "Live coordination connected" : "Reconnecting to coordination..."}</p><span className={`h-2 w-2 rounded-full ${connected ? "bg-[#28704F]" : "bg-[#C68A31]"}`} /></div>
                     {messages.length === 0 ? <p className="text-sm text-[#87919B]">No coordination messages yet.</p> : <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg bg-[#F7F7F5] p-3">{messages.map((message) => { const ownMessage = String(message.senderId?._id ?? message.senderId) === String(currentUser?._id); return <div key={message._id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 ${ownMessage ? "rounded-br-sm bg-[#173B5E] text-white" : "rounded-bl-sm border border-[#D7E6E1] bg-white text-[#17202A]"}`}><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{message.senderDepartmentId?.fullname ?? message.senderId?.fullname ?? "System"}</p><p className="mt-1 text-sm leading-5">{message.message}</p><p className="mt-1 text-[10px] opacity-60">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}</p></div></div>; })}</div>}
                     <form onSubmit={handleMessageSubmit} className="mt-4 flex gap-2 border-t border-[#E2E6E4] pt-4">
                        <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Message the coordinating departments..." className="min-w-0 flex-1 rounded-lg border border-[#CBD2CF] px-3 py-2 text-sm outline-none focus:border-[#39756B]" />
                        <button type="submit" disabled={!connected || !messageDraft.trim()} className="rounded-lg bg-[#173B5E] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Send</button>
                     </form>
                  </Panel>

                  <Panel title="CivicFlow Copilot">
                     <div className="mb-3 flex flex-wrap gap-2">{["Why were these reports grouped?", "Summarize this incident", "What should we do next?"].map((prompt) => <button key={prompt} type="button" onClick={() => setAiQuery(prompt)} className="rounded-full border border-[#D7E6E1] px-2.5 py-1 text-xs font-medium text-[#39756B] hover:bg-[#F3F8F6]">{prompt}</button>)}</div>
                     <form onSubmit={handleAIQuery} className="space-y-3">
                        <label htmlFor="incident-ai-query" className="text-sm text-[#52606D]">Ask about this incident</label>
                        <textarea id="incident-ai-query" value={aiQuery} onChange={(event) => setAiQuery(event.target.value)} rows="3" placeholder="Which departments are involved?" className="w-full rounded-lg border border-[#CBD2CF] px-3 py-2 text-sm outline-none focus:border-[#39756B]" />
                        <button type="submit" disabled={aiLoading || !aiQuery.trim()} className="rounded-lg bg-[#39756B] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{aiLoading ? "Thinking..." : "Ask CivicFlow"}</button>
                     </form>
                     {aiResponse?.answer && <div className="mt-4 border-t border-[#E2E6E4] pt-4"><p className="text-sm leading-6 text-[#17202A]">{aiResponse.answer}</p>{aiResponse.sources?.length > 0 && <p className="mt-3 text-xs text-[#87919B]">Sources: {aiResponse.sources.join(", ")}</p>}</div>}
                  </Panel>
               </aside>
            </div>
         </div>
      </main>
   );
};

const Panel = ({ title, children }) => <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 shadow-2xs"><h2 className="mb-4 text-base font-semibold">{title}</h2>{children}</section>;
const Metric = ({ label, value }) => <div className="rounded-xl border border-[#E2E6E4] bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">{label}</p><p className="mt-2 text-xl font-semibold capitalize">{value}</p></div>;
const Row = ({ label, value, strong = false }) => <div className="flex justify-between gap-4"><span className="text-[#52606D]">{label}</span><span className={strong ? "font-semibold text-[#39756B]" : "font-medium"}>{value}</span></div>;

export default IncidentDetails;
