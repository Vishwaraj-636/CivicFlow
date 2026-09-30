import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
   getDepartments,
   getIncident,
   getIncidentCost,
   getIncidentMessages,
   getIncidentSimilarity,
   requestIncidentHandoff,
   updateIncidentStatus,
} from "../services/incident.api";
import { useIncidentSocket } from "../hooks/useIncidentSocket";
import { queryIncidentCopilot } from "../../ai/services/ai.api";

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
   const [cost, setCost] = useState(null);
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
         getIncidentCost(id),
         getIncidentSimilarity(id),
         getIncidentMessages(id),
         getDepartments(),
      ]).then(([incidentData, costData, similarityData, messageData, departmentData]) => {
         if (!active) return;
         setIncident(incidentData);
         setCost(costData);
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
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#39756B]">{incident.clusterId}</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Coordinated civic incident</h1>
                  <p className="mt-2 text-sm text-[#52606D]">{incident.complaintCount} reports grouped for departmental coordination.</p>
               </div>
               <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#EEF4FA] px-3 py-1 text-xs font-semibold capitalize text-[#24527A]">{formatStatus(incident.status)}</span>
                  {nextStatuses[incident.status] && <button type="button" onClick={handleStatusUpdate} disabled={updating} className="rounded-lg bg-[#173B5E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{updating ? "Updating..." : `Mark ${formatStatus(nextStatuses[incident.status])}`}</button>}
               </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-4">
               <Metric label="Reports" value={incident.complaintCount} />
               <Metric label="Departments" value={incident.departmentIds?.length ?? 0} />
               <Metric label="Confidence" value={`${Math.round((incident.similarityConfidence ?? 0) * 100)}%`} />
               <Metric label="Affected radius" value={`${Math.round(incident.affectedRadius ?? 0)} m`} />
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
               <section className="space-y-6">
                  <Panel title="Grouped complaints">
                     <div className="divide-y divide-[#E2E6E4]">
                        {(incident.complaintIds ?? []).map((complaint) => (
                           <Link key={complaint._id} to={`/staff/complaints/${complaint._id}`} className="block py-3 first:pt-0 last:pb-0 hover:text-[#173B5E]">
                              <div className="flex items-start justify-between gap-4">
                                 <div><p className="font-medium">{complaint.title}</p><p className="mt-1 text-xs text-[#52606D]">{complaint.category}</p></div>
                                 <span className="font-mono text-xs text-[#87919B]">{complaint.complaintId}</span>
                              </div>
                           </Link>
                        ))}
                     </div>
                  </Panel>

                  <Panel title="HISC analysis">
                     <div className="grid gap-3 sm:grid-cols-2">
                        <Metric label="Algorithm" value={similarity?.algorithm ?? "HISC"} />
                        <Metric label="Cluster confidence" value={`${Math.round((similarity?.clusterConfidence ?? 0) * 100)}%`} />
                     </div>
                     <ul className="mt-4 space-y-2 text-sm text-[#52606D]">
                        <li>• Category, location, lexical, semantic, and temporal signals are combined.</li>
                        <li>• {similarity?.matches?.length ?? 0} related matches are attached to this incident.</li>
                        <li>• Candidate retrieval is limited by the configured distance and time window.</li>
                     </ul>
                  </Panel>
               </section>

               <aside className="space-y-6">
                  <Panel title="Cost comparison">
                     <div className="space-y-3 text-sm">
                        <Row label="Separate handling" value={`₹${(cost?.individualCost ?? 0).toLocaleString("en-IN")}`} />
                        <Row label="Clustered handling" value={`₹${(cost?.clusteredCost ?? 0).toLocaleString("en-IN")}`} />
                        <Row label="Estimated saving" value={`₹${(cost?.estimatedSavings ?? 0).toLocaleString("en-IN")}`} strong />
                     </div>
                     <p className="mt-4 text-xs text-[#87919B]">Estimated operational model, not actual government expenditure.</p>
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

                  <Panel title="Coordination messages">
                     <p className="mb-3 text-xs text-[#87919B]">{connected ? "Live coordination connected" : "Connecting to live coordination..."}</p>
                     {messages.length === 0 ? <p className="text-sm text-[#87919B]">No messages yet.</p> : <div className="space-y-3">{messages.map((message) => <div key={message._id} className="border-l-2 border-[#D7E6E1] pl-3"><p className="text-sm">{message.message}</p><p className="mt-1 text-xs text-[#87919B]">{message.messageType?.replaceAll("_", " ")}</p></div>)}</div>}
                     <form onSubmit={handleMessageSubmit} className="mt-4 flex gap-2 border-t border-[#E2E6E4] pt-4">
                        <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Write to the coordinating departments" className="min-w-0 flex-1 rounded-lg border border-[#CBD2CF] px-3 py-2 text-sm outline-none focus:border-[#39756B]" />
                        <button type="submit" disabled={!connected || !messageDraft.trim()} className="rounded-lg bg-[#173B5E] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Send</button>
                     </form>
                  </Panel>

                  <Panel title="CivicFlow Copilot">
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
